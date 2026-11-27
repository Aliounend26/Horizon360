import { Router } from 'express';
import { ActivityLog } from '../models';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth, requireRole } from '../middlewares/auth';

const router = Router();
router.use(requireAuth, requireRole('superadmin', 'admin'));

router.get('/', asyncHandler(async (req, res) => {
  const filter: any = {};
  if (req.query.entity) filter.entity = req.query.entity;
  if (req.query.user) filter.user = req.query.user;
  const logs = await ActivityLog.find(filter).sort({ createdAt: -1 }).limit(200);
  res.json(logs);
}));

export default router;
