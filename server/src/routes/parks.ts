import { Router } from 'express';
import { Park, Vehicle, VehicleRate, Maintenance } from '../models';
import { asyncHandler, ApiError } from '../utils/asyncHandler';
import { requireAuth, requireRole, AuthRequest, accessibleParkIds, requireParkAccess } from '../middlewares/auth';
import { logActivity } from '../services/activityLogService';
import { getDashboardSummary } from '../services/dashboardService';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const ids = await accessibleParkIds(req as AuthRequest);
    const parks = await Park.find(ids ? { _id: { $in: ids } } : {})
      .populate('assignedUsers', 'firstName lastName username role status')
      .sort({ name: 1 });
    const withCounts = await Promise.all(
      parks.map(async (p) => {
        const vehicleCount = await Vehicle.countDocuments({ park: p._id, status: { $ne: 'archived' } });
        const summary = await getDashboardSummary({ park: String(p._id) });
        return { ...p.toJSON(), vehicleCount, revenue: summary.revenue, expenses: summary.expensesTotal, netProfit: summary.netProfit, utilizationRate: summary.utilizationRate };
      })
    );
    res.json(withCounts);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const park = await Park.findById(req.params.id).populate('assignedUsers', 'firstName lastName username role status');
    if (!park) throw new ApiError(404, 'Parc introuvable');
    try { await requireParkAccess(req as AuthRequest, park._id); } catch { throw new ApiError(403, 'Accès refusé à ce parc'); }
    const vehicles = await Vehicle.find({ park: park._id });
    const summary = await getDashboardSummary({ park: String(park._id) });
    res.json({ ...park.toJSON(), vehicles, summary });
  })
);

router.post(
  '/',
  requireRole('superadmin', 'admin'),
  asyncHandler(async (req: AuthRequest, res) => {
    const park = await Park.create({ ...req.body, assignedUsers: req.body.assignedUsers || [] });
    await logActivity(req, 'create', 'Park', String(park._id), undefined, park.toJSON());
    res.status(201).json(park);
  })
);

router.put(
  '/:id',
  requireRole('superadmin', 'admin'),
  asyncHandler(async (req: AuthRequest, res) => {
    const park = await Park.findById(req.params.id);
    if (!park) throw new ApiError(404, 'Parc introuvable');
    const before = park.toJSON();
    Object.assign(park, { ...req.body, assignedUsers: req.body.assignedUsers || [] });
    await park.save();
    await logActivity(req, 'update', 'Park', String(park._id), before, park.toJSON());
    res.json(park);
  })
);

router.delete(
  '/:id',
  requireRole('superadmin'),
  asyncHandler(async (req: AuthRequest, res) => {
    const vehicleCount = 0;
    const park = await Park.findById(req.params.id);
    if (vehicleCount > 0) throw new ApiError(400, 'Impossible de supprimer un parc contenant des véhicules');
    if (!park) throw new ApiError(404, 'Parc introuvable');
    const vehicles = await Vehicle.find({ park: park._id }).select('_id');
    const vehicleIds = vehicles.map((vehicle) => vehicle._id);
    if (vehicleIds.length > 0) {
      await Promise.all([
        VehicleRate.deleteMany({ vehicle: { $in: vehicleIds } }),
        Maintenance.deleteMany({ vehicle: { $in: vehicleIds } }),
      ]);
      await Vehicle.deleteMany({ _id: { $in: vehicleIds } });
    }
    await park.deleteOne();
    await logActivity(req, 'delete', 'Park', String(park._id), park.toJSON());
    res.json({ message: 'Parc supprimé' });
  })
);

export default router;
