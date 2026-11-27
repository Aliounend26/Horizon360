import { Router } from 'express';
import { Client, Rental } from '../models';
import { asyncHandler, ApiError } from '../utils/asyncHandler';
import { requireAuth, requireRole, AuthRequest } from '../middlewares/auth';
import { logActivity } from '../services/activityLogService';

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const filter: any = {};
  if (req.query.search) {
    const s = String(req.query.search);
    filter.$or = [
      { firstName: { $regex: s, $options: 'i' } },
      { lastName: { $regex: s, $options: 'i' } },
      { phone: { $regex: s, $options: 'i' } },
    ];
  }
  const clients = await Client.find(filter).sort({ createdAt: -1 });
  const withStats = await Promise.all(
    clients.map(async (c) => {
      const rentals = await Rental.find({ client: c._id, status: { $ne: 'cancelled' } });
      const totalSpent = rentals.reduce((sum, r) => sum + r.paidAmount, 0);
      return { ...c.toJSON(), rentalsCount: rentals.length, totalSpent };
    })
  );
  res.json(withStats);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id);
  if (!client) throw new ApiError(404, 'Client introuvable');
  const rentals = await Rental.find({ client: client._id }).populate('vehicle').sort({ startDate: -1 });
  const totalSpent = rentals.filter((r) => r.status !== 'cancelled').reduce((sum, r) => sum + r.paidAmount, 0);
  res.json({ ...client.toJSON(), rentals, totalSpent, rentalsCount: rentals.length });
}));

router.post('/', asyncHandler(async (req: AuthRequest, res) => {
  const client = await Client.create(req.body);
  await logActivity(req, 'create', 'Client', String(client._id), undefined, client.toJSON());
  res.status(201).json(client);
}));

router.put('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const client = await Client.findById(req.params.id);
  if (!client) throw new ApiError(404, 'Client introuvable');
  const before = client.toJSON();
  Object.assign(client, req.body);
  await client.save();
  await logActivity(req, 'update', 'Client', String(client._id), before, client.toJSON());
  res.json(client);
}));

router.delete('/:id', requireRole('superadmin', 'admin'), asyncHandler(async (req: AuthRequest, res) => {
  const rentalCount = await Rental.countDocuments({ client: req.params.id });
  if (rentalCount > 0) throw new ApiError(400, 'Impossible de supprimer un client ayant des locations');
  const client = await Client.findByIdAndDelete(req.params.id);
  if (!client) throw new ApiError(404, 'Client introuvable');
  await logActivity(req, 'delete', 'Client', String(client._id), client.toJSON());
  res.json({ message: 'Client supprimé' });
}));

export default router;
