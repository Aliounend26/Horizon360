import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { DollarSign, TrendingDown, TrendingUp, Car, ClipboardList, AlertTriangle, Wrench, Clock } from 'lucide-react';
import { api } from '../services/api';
import { StatCard } from '../components/ui/StatCard';
import { Gauge } from '../components/ui/Gauge';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Select, Field } from '../components/ui/Input';
import { PageHeader } from '../components/ui/PageHeader';
import { formatCurrency, formatDate } from '../utils/format';
import { DashboardSummary, Park, Vehicle, Zone } from '../types';
import { Link } from 'react-router-dom';
import { VehicleStatusBadge, RentalStatusBadge } from '../components/ui/Badge';

const COLORS = ['#3157bd', '#2c8a74', '#c68a35', '#8b6fc1', '#d56b65', '#5d87a8', '#7d8b65', '#d27e4d', '#5375b9', '#64748b', '#bc6f99', '#4d9a9a'];

type Period = 'today' | 'week' | 'month' | 'year' | 'all';

function getRange(period: Period): { from?: string; to?: string } {
  const now = new Date();
  const to = now.toISOString();
  if (period === 'all') return {};
  if (period === 'today') {
    const from = new Date(now);
    from.setHours(0, 0, 0, 0);
    return { from: from.toISOString(), to };
  }
  if (period === 'week') {
    const from = new Date(now);
    from.setDate(from.getDate() - 7);
    return { from: from.toISOString(), to };
  }
  if (period === 'month') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: from.toISOString(), to };
  }
  const from = new Date(now.getFullYear(), 0, 1);
  return { from: from.toISOString(), to };
}

export default function Dashboard() {
  const [period, setPeriod] = useState<Period>('month');
  const [park, setPark] = useState('');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [vehiclePerf, setVehiclePerf] = useState<any[]>([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any>({ upcomingMaintenance: [], upcomingReturns: [], lateRentals: [], unpaidRentals: [] });
  const [parks, setParks] = useState<Park[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/parks').then((res) => setParks(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const range = getRange(period);
    const params: any = { ...range };
    if (park) params.park = park;

    Promise.all([
      api.get('/dashboard/summary', { params }),
      api.get('/dashboard/revenue-trend', { params: { ...params, granularity: period === 'year' ? 'month' : 'day' } }),
      api.get('/dashboard/vehicle-performance', { params }),
      api.get('/dashboard/expense-breakdown', { params }),
      api.get('/dashboard/alerts'),
    ])
      .then(([s, t, vp, eb, al]) => {
        setSummary(s.data);
        setTrend(t.data);
        setVehiclePerf(vp.data);
        setExpenseBreakdown(eb.data);
        setAlerts(al.data);
      })
      .finally(() => setLoading(false));
  }, [period, park]);

  const totalAlerts = (alerts.upcomingMaintenance?.length || 0) + (alerts.lateRentals?.length || 0);

  if (loading && !summary) {
    return <div className="flex h-64 items-center justify-center text-slate-400">Chargement du tableau de bord...</div>;
  }

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        subtitle="Vue synthétique de la performance financière et de l'activité de location"
        actions={
          <div className="liquid-glass-tools flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Select aria-label="Période" value={period} onChange={(e) => setPeriod(e.target.value as Period)} className="w-full sm:w-40">
              <option value="today">Aujourd'hui</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
              <option value="year">Cette année</option>
              <option value="all">Tout</option>
            </Select>
            <Select aria-label="Parc" value={park} onChange={(e) => setPark(e.target.value)} className="w-full sm:w-44">
              <option value="">Tous les parcs</option>
              {parks.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </Select>
          </div>
        }
      />

      {summary && (
        <>
          <section aria-labelledby="financial-overview">
          <div className="mb-3 flex items-center gap-3">
            <h2 id="financial-overview" className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Vue financière</h2>
            <div className="h-px flex-1 bg-slate-200/80" />
          </div>
          <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Chiffre d'affaires" value={formatCurrency(summary.revenue)} icon={DollarSign} tone="brand" />
            <StatCard label="Dépenses" value={formatCurrency(summary.expensesTotal)} icon={TrendingDown} tone="red" />
            <StatCard label="Bénéfice net" value={formatCurrency(summary.netProfit)} icon={TrendingUp} tone="green" subtitle={`Marge ${summary.margin.toFixed(1)}%`} />
            <StatCard label="Total locations" value={String(summary.totalRentals)} icon={ClipboardList} tone="blue" subtitle={`${summary.ongoingRentals} en cours`} />
          </div>

          </section>
          <section aria-labelledby="fleet-overview" className="mt-7">
          <div className="mb-3 flex items-center gap-3">
            <h2 id="fleet-overview" className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">État du parc</h2>
            <div className="h-px flex-1 bg-slate-200/80" />
          </div>
          <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Véhicules" value={String(summary.totalVehicles)} icon={Car} tone="brand" />
            <StatCard label="Disponibles" value={String(summary.availableVehicles)} icon={Car} tone="green" />
            <StatCard label="Loués" value={String(summary.rentedVehicles)} icon={Car} tone="blue" />
            <StatCard label="En maintenance" value={String(summary.maintenanceVehicles)} icon={Wrench} tone="amber" />
          </div>

          </section>
          <div className="mt-7 grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader><CardTitle>Évolution du chiffre d'affaires vs dépenses</CardTitle></CardHeader>
              <CardContent>
                {trend.length === 0 ? (
                  <div className="flex h-64 items-center justify-center text-sm text-slate-400">Aucune donnée pour cette période</div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={trend}>
                      <defs>
                        <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3862f0" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#3862f0" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="period" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Area type="monotone" dataKey="revenue" name="Revenus" stroke="#3862f0" fill="url(#rev)" strokeWidth={2} />
                      <Area type="monotone" dataKey="expenses" name="Dépenses" stroke="#ef4444" fill="url(#exp)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Indicateurs clés</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap justify-around gap-4">
                <Gauge label="Taux d'utilisation" value={summary.utilizationRate} />
                <Gauge label="Disponibilité" value={summary.totalVehicles ? (summary.availableVehicles / summary.totalVehicles) * 100 : 0} />
                <Gauge label="Entretien à jour" value={summary.maintenanceReadiness} />
              </CardContent>
            </Card>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader><CardTitle>Performance des véhicules</CardTitle></CardHeader>
              <CardContent>
                {vehiclePerf.length === 0 ? (
                  <div className="flex h-56 items-center justify-center text-sm text-slate-400">Aucune donnée</div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={vehiclePerf.slice(0, 8)}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="vehicleName" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="revenue" name="CA" fill="#3862f0" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="profit" name="Bénéfice" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Dépenses par catégorie</CardTitle></CardHeader>
              <CardContent>
                {expenseBreakdown.length === 0 ? (
                  <div className="flex h-56 items-center justify-center text-sm text-slate-400">Aucune dépense</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={expenseBreakdown} dataKey="total" nameKey="category" innerRadius={45} outerRadius={80} paddingAngle={2}>
                        {expenseBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                  {expenseBreakdown.slice(0, 6).map((e, i) => (
                    <div key={e.category} className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      {e.category}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" /> Alertes entretien</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {alerts.upcomingMaintenance.length === 0 ? (
                  <p className="text-sm text-slate-400">Aucun entretien à prévoir</p>
                ) : (
                  alerts.upcomingMaintenance.slice(0, 6).map((m: any) => (
                    <div key={m._id} className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 text-sm">
                      <span className="text-slate-700">{m.vehicle?.brand} {m.vehicle?.model} — {m.type?.name}</span>
                      <span className="text-xs font-medium text-amber-700">
                        {m.nextDueMileage ? `${Math.max(0, m.nextDueMileage - (m.vehicle?.mileage || 0))} km restants` : m.nextDueDate ? formatDate(m.nextDueDate) : ''}
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Clock className="h-4 w-4 text-red-500" /> Locations en cours / retours proches</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {alerts.upcomingReturns.length === 0 && alerts.lateRentals.length === 0 ? (
                  <p className="text-sm text-slate-400">Aucune location à surveiller</p>
                ) : (
                  <>
                    {alerts.lateRentals.slice(0, 4).map((r: any) => (
                      <div key={r._id} className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2 text-sm">
                        <span className="text-slate-700">{r.vehicle?.brand} {r.vehicle?.model} — {r.client?.firstName} {r.client?.lastName}</span>
                        <RentalStatusBadge status="late" />
                      </div>
                    ))}
                    {alerts.upcomingReturns.slice(0, 4).map((r: any) => (
                      <div key={r._id} className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2 text-sm">
                        <span className="text-slate-700">{r.vehicle?.brand} {r.vehicle?.model} — retour le {formatDate(r.endDate)}</span>
                        <RentalStatusBadge status={r.status} />
                      </div>
                    ))}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
