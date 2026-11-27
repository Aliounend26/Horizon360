import { ActivityLog } from '../models';
import { AuthRequest } from '../middlewares/auth';

export async function logActivity(
  req: AuthRequest,
  action: string,
  entity: string,
  entityId?: string,
  before?: any,
  after?: any
) {
  const userLabel = req.user ? `${req.user.username} (${req.user.role})` : 'Système';
  await ActivityLog.create({
    user: req.user?.id,
    userLabel,
    action,
    entity,
    entityId,
    before,
    after,
  });
}
