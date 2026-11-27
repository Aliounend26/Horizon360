import { Router } from 'express';
import { Vehicle, Rental, Expense, Maintenance } from '../models';
import { asyncHandler, ApiError } from '../utils/asyncHandler';
import { requireAuth, requireRole, AuthRequest, accessibleParkIds, requireParkAccess } from '../middlewares/auth';
import { logActivity } from '../services/activityLogService';
import { upload } from '../middlewares/upload';
import { getDashboardSummary } from '../services/dashboardService';

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  const filter: any = { status: { $ne: 'archived' } };
  if (req.query.park) filter.park = req.query.park;
  const accessibleParks = await accessibleParkIds(req);
  if (accessibleParks) {
    filter.park = req.query.park
      ? { $in: accessibleParks.filter((id) => id === String(req.query.park)) }
      : { $in: accessibleParks };
  }
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) {
    const s = String(req.query.search);
    filter.$or = [
      { brand: { $regex: s, $options: 'i' } },
      { model: { $regex: s, $options: 'i' } },
      { plateNumber: { $regex: s, $options: 'i' } },
    ];
  }
  const vehicles = await Vehicle.find(filter).populate('park').sort({ createdAt: -1 });
  res.json(vehicles);
}));

router.get('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const vehicle = await Vehicle.findById(req.params.id).populate('park');
  if (!vehicle) throw new ApiError(404, 'Véhicule introuvable');
  try { await requireParkAccess(req, vehicle.park); } catch { throw new ApiError(403, 'Accès refusé à ce véhicule'); }

  const summary = await getDashboardSummary({ vehicle: String(vehicle._id) });
  const rentals = await Rental.find({ vehicle: vehicle._id }).populate('client').sort({ startDate: -1 }).limit(20);
  const expenses = await Expense.find({ vehicle: vehicle._id }).sort({ date: -1 }).limit(10);
  const maintenances = await Maintenance.find({ vehicle: vehicle._id }).populate('type');

  res.json({ ...vehicle.toJSON(), summary, rentals, expenses, maintenances });
}));

router.post('/', requireRole('superadmin', 'admin'), asyncHandler(async (req: AuthRequest, res) => {
  const vehicle = await Vehicle.create(req.body);
  await logActivity(req, 'create', 'Vehicle', String(vehicle._id), undefined, vehicle.toJSON());
  res.status(201).json(vehicle);
}));

router.put('/:id', requireRole('superadmin', 'admin'), asyncHandler(async (req: AuthRequest, res) => {
  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) throw new ApiError(404, 'Véhicule introuvable');
  const before = vehicle.toJSON();
  Object.assign(vehicle, req.body);
  await vehicle.save();
  await logActivity(req, 'update', 'Vehicle', String(vehicle._id), before, vehicle.toJSON());
  res.json(vehicle);
}));

router.delete('/:id', requireRole('superadmin'), asyncHandler(async (req: AuthRequest, res) => {
  const activeRental = await Rental.findOne({ vehicle: req.params.id, status: { $in: ['ongoing', 'reservation', 'confirmed', 'late'] } });
  if (activeRental) throw new ApiError(400, 'Impossible de supprimer un véhicule ayant des locations actives');
  const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, { status: 'archived' }, { new: true });
  if (!vehicle) throw new ApiError(404, 'Véhicule introuvable');
  await logActivity(req, 'archive', 'Vehicle', String(vehicle._id), undefined, vehicle.toJSON());
  res.json({ message: 'Véhicule archivé' });
}));

router.post(
  '/:id/photo',
  requireRole('superadmin', 'admin'),
  upload.single('photo'),
  asyncHandler(async (req: AuthRequest, res) => {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) throw new ApiError(404, 'Véhicule introuvable');
    if (!req.file) throw new ApiError(400, 'Aucun fichier fourni');
    vehicle.photoUrl = `/uploads/${req.file.filename}`;
    await vehicle.save();
    await logActivity(req, 'update_photo', 'Vehicle', String(vehicle._id));
    res.json(vehicle);
  })
);

router.post(
  '/:id/gallery',
  requireRole('superadmin', 'admin'),
  upload.array('photos', 10),
  asyncHandler(async (req: AuthRequest, res) => {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) throw new ApiError(404, 'Véhicule introuvable');
    const files = (req.files as Express.Multer.File[]) || [];
    vehicle.gallery.push(...files.map((f) => `/uploads/${f.filename}`));
    await vehicle.save();
    res.json(vehicle);
  })
);

export default router;
