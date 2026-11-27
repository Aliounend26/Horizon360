import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth, AuthRequest, accessibleParkIds } from '../middlewares/auth';
import {
  getDashboardSummary,
  getVehiclePerformance,
  getExpenseBreakdown,
  getRevenueTrend,
  DashboardFilters,
} from '../services/dashboardService';
import { Maintenance, Rental, Vehicle } from '../models';
import { refreshMaintenanceStatuses } from '../services/maintenanceService';

const router = Router();
router.use(requireAuth);

async function parseFilters(req: AuthRequest): Promise<DashboardFilters> {
  return {
    from: req.query.from ? new Date(String(req.query.from)) : undefined,
    to: req.query.to ? new Date(String(req.query.to)) : undefined,
    park: req.query.park ? String(req.query.park) : undefined,
    vehicle: req.query.vehicle ? String(req.query.vehicle) : undefined,
    zone: req.query.zone ? String(req.query.zone) : undefined,
    status: req.query.status ? String(req.query.status) : undefined,
    allowedParkIds: await accessibleParkIds(req) || undefined,
  };
}

router.get('/summary', asyncHandler(async (req: AuthRequest, res) => {
  const summary = await getDashboardSummary(await parseFilters(req));
  res.json(summary);
}));

router.get('/vehicle-performance', asyncHandler(async (req: AuthRequest, res) => {
  const perf = await getVehiclePerformance(await parseFilters(req));
  res.json(perf);
}));

router.get('/expense-breakdown', asyncHandler(async (req: AuthRequest, res) => {
  const breakdown = await getExpenseBreakdown(await parseFilters(req));
  res.json(breakdown);
}));

router.get('/revenue-trend', asyncHandler(async (req: AuthRequest, res) => {
  const granularity = (req.query.granularity as 'day' | 'week' | 'month') || 'day';
  const trend = await getRevenueTrend(await parseFilters(req), granularity);
  res.json(trend);
}));

router.get('/alerts', asyncHandler(async (req: AuthRequest, res) => {
  await refreshMaintenanceStatuses();
  const allowedParkIds = await accessibleParkIds(req);
  const accessibleVehicles = allowedParkIds ? await Vehicle.find({ park: { $in: allowedParkIds } }).select('_id') : null;
  const vehicleFilter = accessibleVehicles ? { $in: accessibleVehicles.map((vehicle) => vehicle._id) } : undefined;
  const parkFilter = allowedParkIds ? { $in: allowedParkIds } : undefined;
  const upcomingMaintenance = await Maintenance.find({ status: { $in: ['due_soon', 'due', 'overdue'] }, ...(vehicleFilter ? { vehicle: vehicleFilter } : {}) })
    .populate('vehicle')
    .populate('type')
    .limit(20);

  const now = new Date();
  const soon = new Date();
  soon.setDate(soon.getDate() + 3);
  const upcomingReturns = await Rental.find({ status: { $in: ['ongoing', 'confirmed'] }, endDate: { $lte: soon }, ...(parkFilter ? { park: parkFilter } : {}) })
    .populate('client')
    .populate('vehicle')
    .limit(20);

  const lateRentals = await Rental.find({ status: { $in: ['ongoing', 'late'] }, endDate: { $lt: now }, ...(parkFilter ? { park: parkFilter } : {}) })
    .populate('client')
    .populate('vehicle')
    .limit(20);

  const unpaidRentals = await Rental.find({ balanceDue: { $gt: 0 }, status: { $in: ['ongoing', 'completed'] }, ...(parkFilter ? { park: parkFilter } : {}) })
    .populate('client')
    .populate('vehicle')
    .limit(20);

  res.json({ upcomingMaintenance, upcomingReturns, lateRentals, unpaidRentals });
}));

export default router;
