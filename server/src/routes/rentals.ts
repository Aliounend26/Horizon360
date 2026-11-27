import { Router } from 'express';
import { Rental, Vehicle, Payment, CompanySettings } from '../models';
import { asyncHandler, ApiError } from '../utils/asyncHandler';
import { requireAuth, requireRole, AuthRequest, accessibleParkIds, requireParkAccess } from '../middlewares/auth';
import { logActivity } from '../services/activityLogService';
import { computeDays, computeRentalAmount, getRateForVehicleZone, assertVehicleAvailable } from '../services/rentalService';
import { generateRentalNumber } from '../utils/generateNumber';

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  const filter: any = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.vehicle) filter.vehicle = req.query.vehicle;
  if (req.query.client) filter.client = req.query.client;
  if (req.query.park) filter.park = req.query.park;
  const accessibleParks = await accessibleParkIds(req);
  if (accessibleParks) {
    filter.park = req.query.park
      ? { $in: accessibleParks.filter((id) => id === String(req.query.park)) }
      : { $in: accessibleParks };
  }
  if (req.query.zone) filter.zone = req.query.zone;
  if (req.query.from || req.query.to) {
    filter.startDate = {};
    if (req.query.from) filter.startDate.$gte = new Date(String(req.query.from));
    if (req.query.to) filter.startDate.$lte = new Date(String(req.query.to));
  }
  const rentals = await Rental.find(filter)
    .populate('client')
    .populate('vehicle')
    .populate('park')
    .populate('zone')
    .sort({ startDate: -1 });
  res.json(rentals);
}));

router.get('/availability', asyncHandler(async (req, res) => {
  const { vehicle, start, end } = req.query;
  if (!vehicle || !start || !end) throw new ApiError(400, 'Paramètres manquants');
  try {
    await assertVehicleAvailable(String(vehicle), new Date(String(start)), new Date(String(end)));
    res.json({ available: true });
  } catch (e: any) {
    res.json({ available: false, reason: e.message });
  }
}));

router.get('/quote', asyncHandler(async (req, res) => {
  const { vehicle, zone, start, end, discount, extraFees } = req.query;
  if (!vehicle || !zone || !start || !end) throw new ApiError(400, 'Paramètres manquants');

  const startDate = new Date(String(start));
  const endDate = new Date(String(end));
  const days = computeDays(startDate, endDate);
  const rate = await getRateForVehicleZone(String(vehicle), String(zone));
  const { grossAmount, totalAmount } = computeRentalAmount({
    days,
    ratePerDay: rate.pricePerDay,
    discount: discount ? Number(discount) : 0,
    extraFees: extraFees ? Number(extraFees) : 0,
  });
  res.json({ days, ratePerDay: rate.pricePerDay, grossAmount, totalAmount, deposit: rate.deposit || 0 });
}));

router.get('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const rental = await Rental.findById(req.params.id).populate('client').populate('vehicle').populate('park').populate('zone');
  if (!rental) throw new ApiError(404, 'Location introuvable');
  try { await requireParkAccess(req, rental.park); } catch { throw new ApiError(403, 'Accès refusé à cette location'); }
  const payments = await Payment.find({ rental: rental._id }).sort({ date: -1 });
  res.json({ ...rental.toJSON(), payments });
}));

router.post('/', asyncHandler(async (req: AuthRequest, res) => {
  const { client, vehicle, zone, startDate, endDate, discount, extraFees, deposit, paymentMethod, observations, paidAmount, status } = req.body;
  if (!client || !vehicle || !zone || !startDate || !endDate) throw new ApiError(400, 'Champs requis manquants');

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (end <= start) throw new ApiError(400, 'La date de retour doit être après la date de départ');

  await assertVehicleAvailable(vehicle, start, end);

  const vehicleDoc = await Vehicle.findById(vehicle);
  if (!vehicleDoc) throw new ApiError(404, 'Véhicule introuvable');
  try { await requireParkAccess(req, vehicleDoc.park); } catch { throw new ApiError(403, 'Accès refusé à ce véhicule'); }
  if (vehicleDoc.status === 'maintenance' || vehicleDoc.status === 'unavailable' || vehicleDoc.status === 'archived') {
    throw new ApiError(400, `Véhicule non disponible (statut: ${vehicleDoc.status})`);
  }

  const days = computeDays(start, end);
  const rate = await getRateForVehicleZone(vehicle, zone);
  const { grossAmount, totalAmount } = computeRentalAmount({
    days,
    ratePerDay: rate.pricePerDay,
    discount: discount || 0,
    extraFees: extraFees || 0,
  });

  const paid = paidAmount || 0;
  if (paid > 0) {
    const settings = await CompanySettings.findOne();
    if (settings && !settings.paymentMethods.includes(paymentMethod || 'Espèces')) {
      throw new ApiError(400, 'Mode de paiement invalide');
    }
  }
  const rental = await Rental.create({
    rentalNumber: generateRentalNumber(),
    client,
    vehicle,
    park: vehicleDoc.park,
    zone,
    startDate: start,
    endDate: end,
    days,
    ratePerDay: rate.pricePerDay,
    grossAmount,
    discount: discount || 0,
    extraFees: extraFees || 0,
    deposit: deposit ?? 0,
    totalAmount,
    paidAmount: paid,
    balanceDue: totalAmount - paid,
    paymentMethod,
    status: status || 'reservation',
    observations,
    createdBy: req.user!.id,
  });

  if (paid > 0) {
    await Payment.create({ rental: rental._id, amount: paid, method: paymentMethod || 'Espèces', createdBy: req.user!.id });
  }

  if (rental.status === 'ongoing' || rental.status === 'confirmed') {
    vehicleDoc.status = 'rented';
    await vehicleDoc.save();
  }

  await logActivity(req, 'create', 'Rental', String(rental._id), undefined, rental.toJSON());
  res.status(201).json(rental);
}));

router.put('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const rental = await Rental.findById(req.params.id);
  if (!rental) throw new ApiError(404, 'Location introuvable');
  try { await requireParkAccess(req, rental.park); } catch { throw new ApiError(403, 'Accès refusé à cette location'); }
  const before = rental.toJSON();

  const { startDate, endDate, discount, extraFees, deposit, observations, paymentMethod } = req.body;

  if (startDate || endDate) {
    const start = startDate ? new Date(startDate) : rental.startDate;
    const end = endDate ? new Date(endDate) : rental.endDate;
    if (end <= start) throw new ApiError(400, 'La date de retour doit être après la date de départ');
    await assertVehicleAvailable(String(rental.vehicle), start, end, String(rental._id));
    rental.startDate = start;
    rental.endDate = end;
    rental.days = computeDays(start, end);
  }

  if (discount !== undefined) rental.discount = discount;
  if (extraFees !== undefined) rental.extraFees = extraFees;
  if (deposit !== undefined) rental.deposit = deposit;
  if (observations !== undefined) rental.observations = observations;
  if (paymentMethod !== undefined) rental.paymentMethod = paymentMethod;

  const { grossAmount, totalAmount } = computeRentalAmount({
    days: rental.days,
    ratePerDay: rental.ratePerDay,
    discount: rental.discount,
    extraFees: rental.extraFees,
  });
  rental.grossAmount = grossAmount;
  rental.totalAmount = totalAmount;
  rental.balanceDue = totalAmount - rental.paidAmount;

  await rental.save();
  await logActivity(req, 'update', 'Rental', String(rental._id), before, rental.toJSON());
  res.json(rental);
}));

router.post('/:id/status', asyncHandler(async (req: AuthRequest, res) => {
  const { status, mileageStart, mileageEnd } = req.body;
  const rental = await Rental.findById(req.params.id);
  if (!rental) throw new ApiError(404, 'Location introuvable');
  try { await requireParkAccess(req, rental.park); } catch { throw new ApiError(403, 'Accès refusé à cette location'); }
  const vehicle = await Vehicle.findById(rental.vehicle);
  if (!vehicle) throw new ApiError(404, 'Véhicule introuvable');

  const before = rental.toJSON();

  if (status === 'ongoing') {
    if (mileageStart != null) rental.mileageStart = mileageStart;
    rental.status = 'ongoing';
    vehicle.status = 'rented';
  } else if (status === 'completed') {
    if (mileageEnd == null && rental.mileageStart == null) {
      throw new ApiError(400, 'Kilométrage de départ requis avant de clôturer la location');
    }
    if (mileageEnd != null) {
      if (rental.mileageStart != null && mileageEnd < rental.mileageStart) {
        throw new ApiError(400, 'Le kilométrage de retour ne peut pas être inférieur au kilométrage de départ');
      }
      rental.mileageEnd = mileageEnd;
      rental.kmDriven = rental.mileageStart != null ? mileageEnd - rental.mileageStart : undefined;
      vehicle.mileage = mileageEnd;
    }
    rental.status = 'completed';
    rental.actualReturnDate = new Date();
    vehicle.status = 'available';
  } else if (status === 'cancelled') {
    rental.status = 'cancelled';
    if (vehicle.status === 'rented') vehicle.status = 'available';
  } else if (status === 'confirmed') {
    rental.status = 'confirmed';
  } else if (status === 'late') {
    rental.status = 'late';
  } else {
    throw new ApiError(400, 'Statut invalide');
  }

  await rental.save();
  await vehicle.save();
  await logActivity(req, `status_${status}`, 'Rental', String(rental._id), before, rental.toJSON());
  res.json(rental);
}));

router.post('/:id/payments', asyncHandler(async (req: AuthRequest, res) => {
  const { amount, method, note } = req.body;
  if (!amount || amount <= 0) throw new ApiError(400, 'Montant invalide');
  const settings = await CompanySettings.findOne();
  if (settings && !settings.paymentMethods.includes(method || 'Espèces')) {
    throw new ApiError(400, 'Mode de paiement invalide');
  }

  const rental = await Rental.findById(req.params.id);
  if (!rental) throw new ApiError(404, 'Location introuvable');
  try { await requireParkAccess(req, rental.park); } catch { throw new ApiError(403, 'Accès refusé à cette location'); }
  if (amount > rental.balanceDue) throw new ApiError(400, `Le montant dépasse le reste à payer (${rental.balanceDue})`);

  const payment = await Payment.create({ rental: rental._id, amount, method: method || 'Espèces', note, createdBy: req.user!.id });
  rental.paidAmount += amount;
  rental.balanceDue -= amount;
  await rental.save();

  await logActivity(req, 'add_payment', 'Rental', String(rental._id), undefined, payment.toJSON());
  res.status(201).json({ payment, rental });
}));

router.delete('/:id', requireRole('superadmin', 'admin'), asyncHandler(async (req: AuthRequest, res) => {
  const rental = await Rental.findById(req.params.id);
  if (!rental) throw new ApiError(404, 'Location introuvable');
  try { await requireParkAccess(req, rental.park); } catch { throw new ApiError(403, 'Accès refusé à cette location'); }
  if (['ongoing', 'completed'].includes(rental.status)) {
    throw new ApiError(400, 'Impossible de supprimer une location en cours ou terminée. Annulez-la plutôt.');
  }
  await rental.deleteOne();
  await logActivity(req, 'delete', 'Rental', String(rental._id), rental.toJSON());
  res.json({ message: 'Location supprimée' });
}));

export default router;
