import { Router } from 'express';
import { Expense, Vehicle } from '../models';
import { asyncHandler, ApiError } from '../utils/asyncHandler';
import { requireAuth, requireRole, AuthRequest, accessibleParkIds } from '../middlewares/auth';
import { logActivity } from '../services/activityLogService';
import { upload } from '../middlewares/upload';

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  const filter: any = {};
  if (req.query.vehicle) filter.vehicle = req.query.vehicle;
  if (req.query.park) filter.park = req.query.park;
  const allowedParkIds = await accessibleParkIds(req);
  if (allowedParkIds) {
    const vehicleIds = await Vehicle.find({ park: { $in: allowedParkIds } }).distinct('_id');
    filter.$or = [{ park: { $in: allowedParkIds } }, { vehicle: { $in: vehicleIds } }];
  }
  if (req.query.category) filter.category = req.query.category;
  if (req.query.from || req.query.to) {
    filter.date = {};
    if (req.query.from) filter.date.$gte = new Date(String(req.query.from));
    if (req.query.to) filter.date.$lte = new Date(String(req.query.to));
  }
  const expenses = await Expense.find(filter).populate('vehicle').populate('park').sort({ date: -1 });
  res.json(expenses);
}));

router.post('/', requireRole('superadmin', 'admin'), asyncHandler(async (req: AuthRequest, res) => {
  const expense = await Expense.create({ ...req.body, createdBy: req.user!.id });
  await logActivity(req, 'create', 'Expense', String(expense._id), undefined, expense.toJSON());
  res.status(201).json(expense);
}));

router.put('/:id', requireRole('superadmin', 'admin'), asyncHandler(async (req: AuthRequest, res) => {
  const expense = await Expense.findById(req.params.id);
  if (!expense) throw new ApiError(404, 'Dépense introuvable');
  const before = expense.toJSON();
  Object.assign(expense, req.body);
  await expense.save();
  await logActivity(req, 'update', 'Expense', String(expense._id), before, expense.toJSON());
  res.json(expense);
}));

router.post(
  '/:id/receipt',
  requireRole('superadmin', 'admin'),
  upload.single('receipt'),
  asyncHandler(async (req: AuthRequest, res) => {
    const expense = await Expense.findById(req.params.id);
    if (!expense) throw new ApiError(404, 'Dépense introuvable');
    if (!req.file) throw new ApiError(400, 'Aucun fichier fourni');
    expense.receiptUrl = `/uploads/${req.file.filename}`;
    await expense.save();
    res.json(expense);
  })
);

router.delete('/:id', requireRole('superadmin', 'admin'), asyncHandler(async (req: AuthRequest, res) => {
  const expense = await Expense.findByIdAndDelete(req.params.id);
  if (!expense) throw new ApiError(404, 'Dépense introuvable');
  await logActivity(req, 'delete', 'Expense', String(expense._id), expense.toJSON());
  res.json({ message: 'Dépense supprimée' });
}));

export default router;
