import { Router } from 'express';
import { Notification } from '../models';
import { asyncHandler, ApiError } from '../utils/asyncHandler';
import { requireAuth, AuthRequest } from '../middlewares/auth';
import { generateMaintenanceNotifications, generateDocumentExpiryNotifications } from '../services/maintenanceService';

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  await generateMaintenanceNotifications();
  await generateDocumentExpiryNotifications();
  const filter: any = { targetRoles: req.user!.role };
  if (req.query.unreadOnly === 'true') filter.read = false;
  const notifications = await Notification.find(filter).populate('relatedVehicle').sort({ createdAt: -1 }).limit(100);
  const unreadCount = await Notification.countDocuments({ targetRoles: req.user!.role, read: false });
  res.json({ notifications, unreadCount });
}));

router.post('/:id/read', asyncHandler(async (req, res) => {
  const notif = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
  if (!notif) throw new ApiError(404, 'Notification introuvable');
  res.json(notif);
}));

router.post('/read-all', asyncHandler(async (req: AuthRequest, res) => {
  await Notification.updateMany({ targetRoles: req.user!.role, read: false }, { read: true });
  res.json({ message: 'Toutes les notifications ont été marquées comme lues' });
}));

export default router;
