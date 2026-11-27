import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { User } from '../models';
import { asyncHandler, ApiError } from '../utils/asyncHandler';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { requireAuth, AuthRequest } from '../middlewares/auth';
import { logActivity } from '../services/activityLogService';

const router = Router();

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });

router.post(
  '/login',
  loginLimiter,
  asyncHandler(async (req, res) => {
    const { username, password } = req.body as { username: string; password: string };
    if (!username || !password) throw new ApiError(400, 'Identifiant et mot de passe requis');

    const user = await User.findOne({ username: username.toLowerCase().trim() });
    if (!user || user.status !== 'active') throw new ApiError(401, 'Identifiants incorrects');

    const valid = await user.comparePassword(password);
    if (!valid) throw new ApiError(401, 'Identifiants incorrects');

    user.lastLoginAt = new Date();
    await user.save();

    const payload = { id: String(user._id), role: user.role, username: user.username };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken, user: user.toJSON() });
  })
);

router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken;
    if (!token) throw new ApiError(401, 'Session expirée');
    try {
      const payload = verifyRefreshToken(token);
      const user = await User.findById(payload.id);
      if (!user || user.status !== 'active') throw new ApiError(401, 'Session invalide');
      const accessToken = signAccessToken({ id: String(user._id), role: user.role, username: user.username });
      res.json({ accessToken, user: user.toJSON() });
    } catch {
      throw new ApiError(401, 'Session expirée, veuillez vous reconnecter');
    }
  })
);

router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken');
  res.json({ message: 'Déconnecté' });
});

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    const user = await User.findById(req.user!.id);
    if (!user) throw new ApiError(404, 'Utilisateur introuvable');
    res.json(user.toJSON());
  })
);

router.post(
  '/change-password',
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) throw new ApiError(400, 'Le nouveau mot de passe doit contenir au moins 6 caractères');

    const user = await User.findById(req.user!.id);
    if (!user) throw new ApiError(404, 'Utilisateur introuvable');

    if (!user.mustChangePassword) {
      const valid = await user.comparePassword(currentPassword);
      if (!valid) throw new ApiError(401, 'Mot de passe actuel incorrect');
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.mustChangePassword = false;
    await user.save();
    await logActivity(req, 'change_password', 'User', String(user._id));
    res.json({ message: 'Mot de passe modifié avec succès' });
  })
);

export default router;
