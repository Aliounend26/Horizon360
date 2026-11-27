import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';
import { Park, User } from '../models';

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    if (!token) return res.status(401).json({ message: 'Authentification requise' });

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.id);
    if (!user || user.status !== 'active') {
      return res.status(401).json({ message: 'Session invalide' });
    }
    // Use the current database role so role changes and deactivation take effect
    // immediately, instead of trusting potentially stale claims until token expiry.
    req.user = {
      id: String(user._id),
      role: user.role,
      username: user.username,
    };
    next();
  } catch {
    return res.status(401).json({ message: 'Token invalide ou expiré' });
  }
}

export function requireRole(...roles: Array<'superadmin' | 'admin' | 'user'>) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role as any)) {
      return res.status(403).json({ message: "Accès refusé — permissions insuffisantes" });
    }
    next();
  };
}

/** Standard users may only access parks explicitly assigned to them. */
export async function accessibleParkIds(req: AuthRequest): Promise<string[] | null> {
  if (!req.user || req.user.role !== 'user') return null;
  const parks = await Park.find({ assignedUsers: req.user.id }).select('_id');
  return parks.map((park) => String(park._id));
}

export async function requireParkAccess(req: AuthRequest, parkId: unknown) {
  const ids = await accessibleParkIds(req);
  if (ids && !ids.includes(String(parkId))) throw new Error('PARC_ACCESS_DENIED');
}
