import { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'brand',
  subtitle,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: 'brand' | 'green' | 'red' | 'amber' | 'blue';
  subtitle?: string;
}) {
  const toneClasses = {
    brand: 'bg-brand-50 text-brand-700',
    green: 'bg-emerald-50 text-emerald-700',
    red: 'bg-rose-50 text-rose-700',
    amber: 'bg-amber-50 text-amber-700',
    blue: 'bg-sky-50 text-sky-700',
  }[tone];

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.03)] sm:p-5">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium leading-5 text-slate-500">{label}</span>
        <div className={cn('rounded-xl p-2', toneClasses)}>
          <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
        </div>
      </div>
      <div className="mt-3 text-[26px] font-semibold leading-none tracking-[-0.025em] text-slate-950 sm:text-[28px]">{value}</div>
      {subtitle && <div className="mt-2 text-xs font-medium text-slate-500">{subtitle}</div>}
    </div>
  );
}
