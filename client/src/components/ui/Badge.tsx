import { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

type Tone = 'slate' | 'green' | 'blue' | 'amber' | 'red' | 'purple';

const toneClasses: Record<Tone, string> = {
  slate: 'bg-slate-100 text-slate-700',
  green: 'bg-emerald-100 text-emerald-700',
  blue: 'bg-blue-100 text-blue-700',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-700',
  purple: 'bg-purple-100 text-purple-700',
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ className, tone = 'slate', ...props }: BadgeProps) {
  return (
    <span
      className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', toneClasses[tone], className)}
      {...props}
    />
  );
}

const vehicleStatusTone: Record<string, Tone> = {
  available: 'green',
  rented: 'blue',
  maintenance: 'amber',
  unavailable: 'red',
  archived: 'slate',
};
const vehicleStatusLabel: Record<string, string> = {
  available: 'Disponible',
  rented: 'Loué',
  maintenance: 'En maintenance',
  unavailable: 'Indisponible',
  archived: 'Archivé',
};
export function VehicleStatusBadge({ status }: { status: string }) {
  return <Badge tone={vehicleStatusTone[status] || 'slate'}>{vehicleStatusLabel[status] || status}</Badge>;
}

const rentalStatusTone: Record<string, Tone> = {
  reservation: 'purple',
  confirmed: 'blue',
  ongoing: 'green',
  completed: 'slate',
  cancelled: 'red',
  late: 'amber',
};
const rentalStatusLabel: Record<string, string> = {
  reservation: 'Réservation',
  confirmed: 'Confirmée',
  ongoing: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée',
  late: 'En retard',
};
export function RentalStatusBadge({ status }: { status: string }) {
  return <Badge tone={rentalStatusTone[status] || 'slate'}>{rentalStatusLabel[status] || status}</Badge>;
}

const maintenanceStatusTone: Record<string, Tone> = {
  upcoming: 'green',
  due_soon: 'blue',
  due: 'amber',
  overdue: 'red',
  done: 'slate',
};
const maintenanceStatusLabel: Record<string, string> = {
  upcoming: 'À venir',
  due_soon: 'Bientôt dû',
  due: 'Dû',
  overdue: 'En retard',
  done: 'Effectué',
};
export function MaintenanceStatusBadge({ status }: { status: string }) {
  return <Badge tone={maintenanceStatusTone[status] || 'slate'}>{maintenanceStatusLabel[status] || status}</Badge>;
}
