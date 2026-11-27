import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { RentalStatusBadge } from '../components/ui/Badge';
import { formatCurrency, formatDate } from '../utils/format';
import { cn } from '../utils/cn';

const statusColor: Record<string, string> = {
  reservation: 'bg-purple-100 text-purple-700',
  confirmed: 'bg-blue-100 text-blue-700',
  ongoing: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-slate-100 text-slate-600',
  late: 'bg-amber-100 text-amber-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function CalendarPage() {
  const [cursor, setCursor] = useState(new Date());
  const [rentals, setRentals] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  useEffect(() => {
    const from = new Date(year, month, 1);
    const to = new Date(year, month + 1, 0);
    api.get('/rentals').then((res) => {
      setRentals(res.data.filter((r: any) => {
        const s = new Date(r.startDate), e = new Date(r.endDate);
        return s <= to && e >= from;
      }));
    });
  }, [year, month]);

  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7; // Monday-first
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = Array(startOffset).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [year, month]);

  function rentalsForDay(day: Date) {
    return rentals.filter((r) => {
      const s = new Date(r.startDate), e = new Date(r.endDate);
      const d0 = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      return d0 >= new Date(s.getFullYear(), s.getMonth(), s.getDate()) && d0 <= new Date(e.getFullYear(), e.getMonth(), e.getDate());
    });
  }

  return (
    <div>
      <PageHeader
        title="Calendrier"
        subtitle="Locations, réservations et retours"
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setCursor(new Date(year, month - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="w-36 text-center text-sm font-medium">{cursor.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
            <Button size="sm" variant="outline" onClick={() => setCursor(new Date(year, month + 1, 1))}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        }
      />

      <Card className="overflow-hidden">
        <div className="grid grid-cols-7 bg-slate-50 text-center text-xs font-semibold uppercase text-slate-500">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => <div key={d} className="py-2">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day, i) => (
            <div key={i} className={cn('min-h-[100px] border-b border-r border-slate-100 p-1.5', !day && 'bg-slate-50')}>
              {day && (
                <>
                  <div className="mb-1 text-xs font-medium text-slate-500">{day.getDate()}</div>
                  <div className="space-y-1">
                    {rentalsForDay(day).slice(0, 3).map((r) => (
                      <button
                        key={r._id}
                        onClick={() => setSelected(r)}
                        className={cn('block w-full truncate rounded px-1.5 py-0.5 text-left text-[10px] font-medium', statusColor[r.status])}
                      >
                        {r.vehicle?.brand} {r.vehicle?.model}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Détails de la location" size="sm">
        {selected && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">N°</span><span className="font-medium">{selected.rentalNumber}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Client</span><span>{selected.client?.firstName} {selected.client?.lastName}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Véhicule</span><span>{selected.vehicle?.brand} {selected.vehicle?.model}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Période</span><span>{formatDate(selected.startDate)} → {formatDate(selected.endDate)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Total</span><span>{formatCurrency(selected.totalAmount)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Statut</span><RentalStatusBadge status={selected.status} /></div>
          </div>
        )}
      </Modal>
    </div>
  );
}
