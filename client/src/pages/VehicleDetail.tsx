import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Car as CarIcon, Camera, DollarSign, TrendingDown, TrendingUp, Gauge as GaugeIcon } from 'lucide-react';
import { api, apiErrorMessage } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { VehicleStatusBadge, RentalStatusBadge, MaintenanceStatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { formatCurrency, formatDate } from '../utils/format';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';

export default function VehicleDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { push } = useToast();
  const [data, setData] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const canManage = user?.role === 'superadmin' || user?.role === 'admin';

  async function load() {
    const res = await api.get(`/vehicles/${id}`);
    setData(res.data);
  }

  useEffect(() => { load(); }, [id]);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('photo', file);
    try {
      await api.post(`/vehicles/${id}/photo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      push('success', 'Photo mise à jour');
      load();
    } catch (err) {
      push('error', apiErrorMessage(err));
    }
  }

  if (!data) return <div className="text-slate-400">Chargement...</div>;
  const { summary } = data;

  return (
    <div>
      <Link to="/vehicules" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Retour aux véhicules
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative h-28 w-40 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
          {data.photoUrl ? (
            <img src={data.photoUrl} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center"><CarIcon className="h-10 w-10 text-slate-300" /></div>
          )}
          {canManage && (
            <button onClick={() => fileRef.current?.click()} className="absolute bottom-1 right-1 rounded-full bg-white p-1.5 shadow hover:bg-slate-50">
              <Camera className="h-4 w-4 text-slate-600" />
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">{data.brand} {data.model}</h1>
            <VehicleStatusBadge status={data.status} />
          </div>
          <p className="text-sm text-slate-500">{data.plateNumber} • {data.year} • {data.park?.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Chiffre d'affaires" value={formatCurrency(summary.revenue)} icon={DollarSign} tone="brand" />
        <StatCard label="Dépenses" value={formatCurrency(summary.expensesTotal)} icon={TrendingDown} tone="red" />
        <StatCard label="Bénéfice" value={formatCurrency(summary.netProfit)} icon={TrendingUp} tone="green" />
        <StatCard label="Kilométrage" value={`${data.mileage.toLocaleString('fr-FR')} km`} icon={GaugeIcon} tone="blue" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Historique des locations</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.rentals.length === 0 ? (
              <p className="text-sm text-slate-400">Aucune location</p>
            ) : data.rentals.map((r: any) => (
              <Link to={`/locations/${r._id}`} key={r._id} className="flex items-center justify-between rounded-lg border border-slate-100 p-2.5 hover:border-brand-200">
                <div>
                  <div className="text-sm font-medium text-slate-800">{r.client?.firstName} {r.client?.lastName}</div>
                  <div className="text-xs text-slate-400">{formatDate(r.startDate)} → {formatDate(r.endDate)}</div>
                </div>
                <RentalStatusBadge status={r.status} />
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Entretiens</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.maintenances.length === 0 ? (
              <p className="text-sm text-slate-400">Aucun entretien programmé</p>
            ) : data.maintenances.map((m: any) => (
              <div key={m._id} className="flex items-center justify-between rounded-lg border border-slate-100 p-2.5">
                <div>
                  <div className="text-sm font-medium text-slate-800">{m.type?.name}</div>
                  <div className="text-xs text-slate-400">
                    {m.nextDueMileage ? `Prochain: ${m.nextDueMileage.toLocaleString('fr-FR')} km` : ''}
                    {m.nextDueDate ? ` • ${formatDate(m.nextDueDate)}` : ''}
                  </div>
                </div>
                <MaintenanceStatusBadge status={m.status} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader><CardTitle>Dernières dépenses</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {data.expenses.length === 0 ? (
            <p className="text-sm text-slate-400">Aucune dépense enregistrée</p>
          ) : data.expenses.map((e: any) => (
            <div key={e._id} className="flex items-center justify-between rounded-lg border border-slate-100 p-2.5 text-sm">
              <span className="text-slate-700">{e.category} — {e.description}</span>
              <span className="font-medium text-slate-800">{formatCurrency(e.amount)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
