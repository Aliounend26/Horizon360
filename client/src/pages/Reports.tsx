import { useEffect, useState } from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import { api, apiErrorMessage } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Field, Input, Select } from '../components/ui/Input';
import { useToast } from '../hooks/useToast';
import { Park, Vehicle } from '../types';

export default function Reports() {
  const { push } = useToast();
  const [parks, setParks] = useState<Park[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [park, setPark] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api.get('/parks').then((res) => setParks(res.data));
    api.get('/vehicles').then((res) => setVehicles(res.data));
  }, []);

  async function download() {
    setDownloading(true);
    try {
      const params: any = {};
      if (from) params.from = from;
      if (to) params.to = to;
      if (park) params.park = park;
      if (vehicle) params.vehicle = vehicle;
      const res = await api.get('/reports/financial/excel', { params, responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `Rapport_Financier_Horizon360_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      push('success', 'Rapport téléchargé');
    } catch (err) {
      push('error', apiErrorMessage(err));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div>
      <PageHeader title="Rapports" subtitle="Rapport financier complet — Résumé, Locations, Dépenses, Véhicules, Rentabilité" />

      <Card className="max-w-2xl">
        <CardHeader><CardTitle className="flex items-center gap-2"><FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Rapport financier Excel</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Du"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
            <Field label="Au"><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Parc">
              <Select value={park} onChange={(e) => setPark(e.target.value)}>
                <option value="">Tous les parcs</option>
                {parks.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
              </Select>
            </Field>
            <Field label="Véhicule">
              <Select value={vehicle} onChange={(e) => setVehicle(e.target.value)}>
                <option value="">Tous les véhicules</option>
                {vehicles.map((v) => <option key={v._id} value={v._id}>{v.brand} {v.model}</option>)}
              </Select>
            </Field>
          </div>
          <Button onClick={download} loading={downloading}><Download className="h-4 w-4" /> Télécharger le rapport Excel</Button>
        </CardContent>
      </Card>
    </div>
  );
}
