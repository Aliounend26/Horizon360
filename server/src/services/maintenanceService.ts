import { Maintenance, MaintenanceType, Vehicle, Notification } from '../models';

export function computeMaintenanceStatus(
  currentMileage: number,
  nextDueMileage?: number,
  nextDueDate?: Date
): 'upcoming' | 'due_soon' | 'due' | 'overdue' {
  const now = new Date();
  let mileageBucket: 'upcoming' | 'due_soon' | 'due' | 'overdue' | null = null;
  let dateBucket: 'upcoming' | 'due_soon' | 'due' | 'overdue' | null = null;

  if (nextDueMileage != null) {
    const remaining = nextDueMileage - currentMileage;
    if (remaining <= 0) mileageBucket = 'overdue';
    else if (remaining <= 500) mileageBucket = 'due';
    else if (remaining <= 1500) mileageBucket = 'due_soon';
    else mileageBucket = 'upcoming';
  }

  if (nextDueDate) {
    const daysRemaining = Math.ceil((nextDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysRemaining <= 0) dateBucket = 'overdue';
    else if (daysRemaining <= 7) dateBucket = 'due';
    else if (daysRemaining <= 30) dateBucket = 'due_soon';
    else dateBucket = 'upcoming';
  }

  const rank = { overdue: 3, due: 2, due_soon: 1, upcoming: 0 };
  const candidates = [mileageBucket, dateBucket].filter(Boolean) as Array<'upcoming' | 'due_soon' | 'due' | 'overdue'>;
  if (candidates.length === 0) return 'upcoming';
  return candidates.reduce((worst, cur) => (rank[cur] > rank[worst] ? cur : worst), candidates[0]);
}

export async function refreshMaintenanceStatuses() {
  const items = await Maintenance.find().populate('vehicle').populate('type');
  for (const m of items) {
    const vehicle = m.vehicle as any;
    if (!vehicle) continue;
    const status = computeMaintenanceStatus(vehicle.mileage, m.nextDueMileage, m.nextDueDate);
    if (status !== m.status) {
      m.status = status;
      await m.save();
    }
  }
}

export async function generateMaintenanceNotifications() {
  await refreshMaintenanceStatuses();
  const items = await Maintenance.find({ status: { $in: ['due_soon', 'due', 'overdue'] } })
    .populate('vehicle')
    .populate('type');

  for (const m of items) {
    const vehicle = m.vehicle as any;
    const type = m.type as any;
    if (!vehicle || !type) continue;

    const existing = await Notification.findOne({
      type: 'maintenance',
      relatedVehicle: vehicle._id,
      read: false,
      title: { $regex: type.name },
    });
    if (existing) continue;

    let message = `${vehicle.brand} ${vehicle.model} — ${type.name}`;
    if (m.nextDueMileage != null) {
      const remaining = m.nextDueMileage - vehicle.mileage;
      message += remaining > 0 ? ` — dans ${remaining} km` : ` — dépassé de ${Math.abs(remaining)} km`;
    }
    if (m.nextDueDate) {
      const days = Math.ceil((m.nextDueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      message += days > 0 ? ` — expire dans ${days} jours` : ` — expiré depuis ${Math.abs(days)} jours`;
    }

    await Notification.create({
      type: 'maintenance',
      title: `Entretien ${m.status === 'overdue' ? 'en retard' : m.status === 'due' ? 'dû' : 'bientôt dû'} — ${type.name}`,
      message,
      severity: m.status === 'overdue' ? 'critical' : m.status === 'due' ? 'warning' : 'info',
      relatedVehicle: vehicle._id,
      targetRoles: ['superadmin', 'admin'],
    });
  }
}

export async function generateDocumentExpiryNotifications() {
  const soon = new Date();
  soon.setDate(soon.getDate() + 30);

  const vehicles = await Vehicle.find({
    status: { $ne: 'archived' },
    $or: [{ insuranceExpiryDate: { $lte: soon } }, { technicalControlExpiryDate: { $lte: soon } }],
  });

  for (const v of vehicles) {
    if (v.insuranceExpiryDate && v.insuranceExpiryDate <= soon) {
      const days = Math.ceil((v.insuranceExpiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      const existing = await Notification.findOne({ type: 'insurance', relatedVehicle: v._id, read: false });
      if (!existing) {
        await Notification.create({
          type: 'insurance',
          title: `Assurance — ${v.brand} ${v.model}`,
          message: days > 0 ? `Expire dans ${days} jours` : `Expirée depuis ${Math.abs(days)} jours`,
          severity: days <= 0 ? 'critical' : days <= 7 ? 'warning' : 'info',
          relatedVehicle: v._id,
        });
      }
    }
    if (v.technicalControlExpiryDate && v.technicalControlExpiryDate <= soon) {
      const days = Math.ceil((v.technicalControlExpiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      const existing = await Notification.findOne({ type: 'technical_control', relatedVehicle: v._id, read: false });
      if (!existing) {
        await Notification.create({
          type: 'technical_control',
          title: `Contrôle technique — ${v.brand} ${v.model}`,
          message: days > 0 ? `Expire dans ${days} jours` : `Expiré depuis ${Math.abs(days)} jours`,
          severity: days <= 0 ? 'critical' : days <= 7 ? 'warning' : 'info',
          relatedVehicle: v._id,
        });
      }
    }
  }
}
