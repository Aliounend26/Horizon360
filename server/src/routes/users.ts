import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models';
import { asyncHandler, ApiError } from '../utils/asyncHandler';
import { requireAuth, requireRole, AuthRequest } from '../middlewares/auth';
import { logActivity } from '../services/activityLogService';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  requireRole('superadmin', 'admin'),
  asyncHandler(async (req, res) => {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  })
);

router.post(
  '/',
  requireRole('superadmin', 'admin'),
  asyncHandler(async (req: AuthRequest, res) => {
    const { firstName, lastName, username, email, password, role, status } = req.body;
    if (!firstName || !lastName || !username || !password) throw new ApiError(400, 'Champs requis manquants');

    const requestedRole = role || 'user';
    if (req.user!.role === 'admin' && requestedRole !== 'user') {
      throw new ApiError(403, 'Un Admin ne peut créer que des utilisateurs standards');
    }

    const existing = await User.findOne({ username: username.toLowerCase().trim() });
    if (existing) throw new ApiError(409, 'Cet identifiant existe déjà');

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      firstName,
      lastName,
      username: username.toLowerCase().trim(),
      email,
      passwordHash,
      role: requestedRole,
      status: status || 'active',
      mustChangePassword: true,
      createdBy: req.user!.id,
    });

    await logActivity(req, 'create', 'User', String(user._id), undefined, user.toJSON());
    res.status(201).json(user.toJSON());
  })
);

router.put(
  '/:id',
  requireRole('superadmin', 'admin'),
  asyncHandler(async (req: AuthRequest, res) => {
    const user = await User.findById(req.params.id);
    if (!user) throw new ApiError(404, 'Utilisateur introuvable');

    if (req.user!.role === 'admin' && (user.role !== 'user' || req.body.role === 'superadmin' || req.body.role === 'admin')) {
      throw new ApiError(403, "Un Admin ne peut modifier que les utilisateurs standards qu'il gère");
    }

    const before = user.toJSON();
    const { firstName, lastName, email, role, status, password } = req.body;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email !== undefined) user.email = email;
    if (role && req.user!.role === 'superadmin') user.role = role;
    if (status) user.status = status;
    if (password) {
      user.passwordHash = await bcrypt.hash(password, 10);
      user.mustChangePassword = true;
    }
    await user.save();
    await logActivity(req, 'update', 'User', String(user._id), before, user.toJSON());
    res.json(user.toJSON());
  })
);

router.delete(
  '/:id',
  requireRole('superadmin'),
  asyncHandler(async (req: AuthRequest, res) => {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) throw new ApiError(404, 'Utilisateur introuvable');
    await logActivity(req, 'delete', 'User', String(user._id), user.toJSON());
    res.json({ message: 'Utilisateur supprimé' });
  })
);

export default router;
