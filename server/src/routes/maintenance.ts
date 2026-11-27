import { Router } from 'express';
import { Maintenance, MaintenanceType, Vehicle } from '../models';
import { asyncHandler, ApiError } from '../utils/asyncHandler';
import { requireAuth, requireRole, AuthRequest, accessibleParkIds } from '../middlewares/auth';
import { logActivity } from '../services/activityLogService';
import { computeMaintenanceStatus, refreshMaintenanceStatuses } from '../services/maintenanceService';

const router = Router();
router.use(requireAuth);

router.get('/types', asyncHandler(async (req, res) => {
  const types = await MaintenanceType.find().sort({ name: 1 });
  res.json(types);
}));

router.post('/types', requireRole('superadmin'), asyncHandler(async (req: AuthRequest, res) => {
  const type = await MaintenanceType.create(req.body);
  await logActivity(req, 'create', 'MaintenanceType', String(type._id), undefined, type.toJSON());
  res.status(201).json(type);
}));

router.put('/types/:id', requireRole('superadmin'), asyncHandler(async (req: AuthRequest, res) => {
  const type = await MaintenanceType.findById(req.params.id);
  if (!type) throw new ApiError(404, "Type d'entretien introuvable");
  Object.assign(type, req.body);
  await type.save();
  res.json(type);
}));

router.delete('/types/:id', requireRole('superadmin'), asyncHandler(async (req: AuthRequest, res) => {
  const inUse = await Maintenance.countDocuments({ type: req.params.id });
  if (inUse > 0) throw new ApiError(400, 'Type utilisé par des entretiens existants');
  await MaintenanceType.findByIdAndDelete(req.params.id);
  res.json({ message: 'Type supprimé' });
}));

router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  await refreshMaintenanceStatuses();
  const filter: any = {};
  if (req.query.vehicle) filter.vehicle = req.query.vehicle;
  const allowedParkIds = await accessibleParkIds(req);
  if (allowedParkIds) filter.vehicle = { $in: await Vehicle.find({ park: { $in: allowedParkIds } }).distinct('_id') };
  if (req.query.status) filter.status = req.query.status;
  const items = await Maintenance.find(filter).populate('vehicle').populate('type').sort({ nextDueDate: 1 });
  res.json(items);
}));

router.post('/', requireRole('superadmin', 'admin'), asyncHandler(async (req: AuthRequest, res) => {
  const { vehicle, type, lastServiceDate, lastServiceMileage } = req.body;
  const vehicleDoc = await Vehicle.findById(vehicle);
  const typeDoc = await MaintenanceType.findById(type);
  if (!vehicleDoc || !typeDoc) throw new ApiError(404, 'Véhicule ou type introuvable');

  let nextDueDate: Date | undefined;
  let nextDueMileage: number | undefined;
  const baseDate = lastServiceDate ? new Date(lastServiceDate) : new Date();
  const baseMileage = lastServiceMileage ?? vehicleDoc.mileage;

  if (typeDoc.timeIntervalMonths) {
    nextDueDate = new Date(baseDate);
    nextDueDate.setMonth(nextDueDate.getMonth() + typeDoc.timeIntervalMonths);
  }
  if (typeDoc.mileageInterval) {
    nextDueMileage = baseMileage + typeDoc.mileageInterval;
  }

  const status = computeMaintenanceStatus(vehicleDoc.mileage, nextDueMileage, nextDueDate);

  const maintenance = await Maintenance.create({
    vehicle,
    type,
    lastServiceDate: baseDate,
    lastServiceMileage: baseMileage,
    nextDueDate,
    nextDueMileage,
    status,
  });

  await logActivity(req, 'create', 'Maintenance', String(maintenance._id), undefined, maintenance.toJSON());
  res.status(201).json(maintenance);
}));

router.post('/:id/complete', requireRole('superadmin', 'admin'), asyncHandler(async (req: AuthRequest, res) => {
  const { serviceDate, mileage, cost, notes } = req.body;
  const maintenance = await Maintenance.findById(req.params.id).populate('type');
  if (!maintenance) throw new ApiError(404, 'Entretien introuvable');
  const vehicleDoc = await Vehicle.findById(maintenance.vehicle);
  if (!vehicleDoc) throw new ApiError(404, 'Véhicule introuvable');
  const typeDoc = maintenance.type as any;

  const date = serviceDate ? new Date(serviceDate) : new Date();
  const km = mileage ?? vehicleDoc.mileage;

  maintenance.lastServiceDate = date;
  maintenance.lastServiceMileage = km;
  maintenance.cost = cost;
  maintenance.notes = notes;

  if (typeDoc.timeIntervalMonths) {
    const next = new Date(date);
    next.setMonth(next.getMonth() + typeDoc.timeIntervalMonths);
    maintenance.nextDueDate = next;
  }
  if (typeDoc.mileageInterval) {
    maintenance.nextDueMileage = km + typeDoc.mileageInterval;
  }
  maintenance.status = computeMaintenanceStatus(vehicleDoc.mileage, maintenance.nextDueMileage, maintenance.nextDueDate);

  await maintenance.save();
  await logActivity(req, 'complete', 'Maintenance', String(maintenance._id));
  res.json(maintenance);
}));

router.delete('/:id', requireRole('superadmin', 'admin'), asyncHandler(async (req: AuthRequest, res) => {
  const maintenance = await Maintenance.findByIdAndDelete(req.params.id);
  if (!maintenance) throw new ApiError(404, 'Entretien introuvable');
  await logActivity(req, 'delete', 'Maintenance', String(maintenance._id));
  res.json({ message: 'Entretien supprimé' });
}));

export default router;
