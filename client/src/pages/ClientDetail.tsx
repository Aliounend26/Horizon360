import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { RentalStatusBadge } from '../components/ui/Badge';
import { formatCurrency, formatDate } from '../utils/format';
import { DollarSign, ClipboardList } from 'lucide-react';

export default function ClientDetail() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);

  useEffect(() => { api.get(`/clients/${id}`).then((res) => setData(res.data)); }, [id]);

  if (!data) return <div className="text-slate-400">Chargement...</div>;

  return (
    <div>
      <Link to="/clients" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Retour aux clients
      </Link>
      <PageHeader title={`${data.firstName} ${data.lastName}`} subtitle={data.phone} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
        <StatCard label="Total dépensé" value={formatCurrency(data.totalSpent)} icon={DollarSign} tone="brand" />
        <StatCard label="Nombre de locations" value={String(data.rentalsCount)} icon={ClipboardList} tone="blue" />
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>Historique des locations</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {data.rentals.length === 0 ? (
            <p className="text-sm text-slate-400">Aucune location</p>
          ) : data.rentals.map((r: any) => (
            <Link to={`/locations/${r._id}`} key={r._id} className="flex items-center justify-between rounded-lg border border-slate-100 p-2.5 hover:border-brand-200">
              <div>
                <div className="text-sm font-medium text-slate-800">{r.vehicle?.brand} {r.vehicle?.model}</div>
                <div className="text-xs text-slate-400">{formatDate(r.startDate)} → {formatDate(r.endDate)} • {formatCurrency(r.totalAmount)}</div>
              </div>
              <RentalStatusBadge status={r.status} />
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
