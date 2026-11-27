import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Car } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { VehicleStatusBadge } from '../components/ui/Badge';
import { formatCurrency } from '../utils/format';
import { DollarSign, TrendingDown, TrendingUp } from 'lucide-react';

export default function ParkDetail() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get(`/parks/${id}`).then((res) => setData(res.data));
  }, [id]);

  if (!data) return <div className="text-slate-400">Chargement...</div>;

  return (
    <div>
      <Link to="/parcs" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Retour aux parcs
      </Link>
      <PageHeader title={data.name} subtitle={data.location} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Chiffre d'affaires" value={formatCurrency(data.summary.revenue)} icon={DollarSign} tone="brand" />
        <StatCard label="Dépenses" value={formatCurrency(data.summary.expensesTotal)} icon={TrendingDown} tone="red" />
        <StatCard label="Bénéfice net" value={formatCurrency(data.summary.netProfit)} icon={TrendingUp} tone="green" />
        <StatCard label="Véhicules" value={String(data.vehicles.length)} icon={Car} tone="blue" />
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>Véhicules du parc</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.vehicles.map((v: any) => (
            <Link to={`/vehicules/${v._id}`} key={v._id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 hover:border-brand-300">
              <div>
                <div className="text-sm font-semibold text-slate-800">{v.brand} {v.model}</div>
                <div className="text-xs text-slate-400">{v.plateNumber}</div>
              </div>
              <VehicleStatusBadge status={v.status} />
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
