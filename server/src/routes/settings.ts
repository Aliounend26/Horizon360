import { Router } from 'express';
import { CompanySettings } from '../models';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth, requireRole, AuthRequest } from '../middlewares/auth';
import { logActivity } from '../services/activityLogService';
import { upload } from '../middlewares/upload';

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  let settings = await CompanySettings.findOne();
  if (!settings) settings = await CompanySettings.create({});
  res.json(settings);
}));

router.put('/', requireRole('superadmin'), asyncHandler(async (req: AuthRequest, res) => {
  let settings = await CompanySettings.findOne();
  if (!settings) settings = new CompanySettings();
  const before = settings.toJSON();
  Object.assign(settings, req.body);
  await settings.save();
  await logActivity(req, 'update', 'CompanySettings', String(settings._id), before, settings.toJSON());
  res.json(settings);
}));

router.post('/logo', requireRole('superadmin'), upload.single('logo'), asyncHandler(async (req: AuthRequest, res) => {
  let settings = await CompanySettings.findOne();
  if (!settings) settings = new CompanySettings();
  if (req.file) settings.logoUrl = `/uploads/${req.file.filename}`;
  await settings.save();
  res.json(settings);
}));

export default router;
