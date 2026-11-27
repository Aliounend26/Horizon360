import { Router } from 'express';
import { Zone, VehicleRate } from '../models';
import { asyncHandler, ApiError } from '../utils/asyncHandler';
import { requireAuth, requireRole, AuthRequest } from '../middlewares/auth';
import { logActivity } from '../services/activityLogService';

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const zones = await Zone.find().sort({ name: 1 });
  res.json(zones);
}));

router.post('/', requireRole('superadmin', 'admin'), asyncHandler(async (req: AuthRequest, res) => {
  const zone = await Zone.create(req.body);
  await logActivity(req, 'create', 'Zone', String(zone._id), undefined, zone.toJSON());
  res.status(201).json(zone);
}));

router.put('/:id', requireRole('superadmin', 'admin'), asyncHandler(async (req: AuthRequest, res) => {
  const zone = await Zone.findById(req.params.id);
  if (!zone) throw new ApiError(404, 'Zone introuvable');
  const before = zone.toJSON();
  Object.assign(zone, req.body);
  await zone.save();
  await logActivity(req, 'update', 'Zone', String(zone._id), before, zone.toJSON());
  res.json(zone);
}));

router.delete('/:id', requireRole('superadmin'), asyncHandler(async (req: AuthRequest, res) => {
  const rateCount = await VehicleRate.countDocuments({ zone: req.params.id });
  if (rateCount > 0) throw new ApiError(400, 'Impossible de supprimer une zone utilisée par des tarifs');
  const zone = await Zone.findByIdAndDelete(req.params.id);
  if (!zone) throw new ApiError(404, 'Zone introuvable');
  await logActivity(req, 'delete', 'Zone', String(zone._id), zone.toJSON());
  res.json({ message: 'Zone supprimée' });
}));

// Vehicle rates nested under zones/rates
router.get('/rates/all', asyncHandler(async (req, res) => {
  const filter: any = {};
  if (req.query.vehicle) filter.vehicle = req.query.vehicle;
  if (req.query.zone) filter.zone = req.query.zone;
  const rates = await VehicleRate.find(filter).populate('vehicle').populate('zone');
  res.json(rates);
}));

router.post('/rates', requireRole('superadmin', 'admin'), asyncHandler(async (req: AuthRequest, res) => {
  const rate = await VehicleRate.findOneAndUpdate(
    { vehicle: req.body.vehicle, zone: req.body.zone },
    { $set: req.body },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  await logActivity(req, 'upsert', 'VehicleRate', String(rate._id), undefined, rate.toJSON());
  res.status(201).json(rate);
}));

router.delete('/rates/:id', requireRole('superadmin', 'admin'), asyncHandler(async (req: AuthRequest, res) => {
  const rate = await VehicleRate.findByIdAndDelete(req.params.id);
  if (!rate) throw new ApiError(404, 'Tarif introuvable');
  await logActivity(req, 'delete', 'VehicleRate', String(rate._id), rate.toJSON());
  res.json({ message: 'Tarif supprimé' });
}));

export default router;
