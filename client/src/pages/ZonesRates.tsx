import { useEffect, useState } from 'react';
import { Plus, Trash2, MapPin } from 'lucide-react';
import { api, apiErrorMessage } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Field, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Table, THead, TBody, Tr, Th, Td, EmptyState } from '../components/ui/Table';
import { useToast } from '../hooks/useToast';
import { formatCurrency } from '../utils/format';
import { Zone, Vehicle, VehicleRate } from '../types';

export default function ZonesRates() {
  const { push } = useToast();
  const [zones, setZones] = useState<Zone[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [rates, setRates] = useState<VehicleRate[]>([]);
  const [zoneModal, setZoneModal] = useState(false);
  const [zoneForm, setZoneForm] = useState<Partial<Zone>>({});
  const [rateModal, setRateModal] = useState(false);
  const [rateForm, setRateForm] = useState<any>({});

  async function loadAll() {
    const [z, v, r] = await Promise.all([
      api.get('/zones'),
      api.get('/vehicles'),
      api.get('/zones/rates/all'),
    ]);
    setZones(z.data);
    setVehicles(v.data);
    setRates(r.data);
  }

  useEffect(() => { loadAll(); }, []);

  async function saveZone() {
    try {
      await api.post('/zones', zoneForm);
      push('success', 'Zone créée');
      setZoneModal(false);
      setZoneForm({});
      loadAll();
    } catch (err) { push('error', apiErrorMessage(err)); }
  }

  async function deleteZone(z: Zone) {
    if (!confirm(`Supprimer la zone "${z.name}" ?`)) return;
    try {
      await api.delete(`/zones/${z._id}`);
      push('success', 'Zone supprimée');
      loadAll();
    } catch (err) { push('error', apiErrorMessage(err)); }
  }

  async function saveRate() {
    try {
      await api.post('/zones/rates', rateForm);
      push('success', 'Tarif enregistré');
      setRateModal(false);
      setRateForm({});
      loadAll();
    } catch (err) { push('error', apiErrorMessage(err)); }
  }

  async function deleteRate(r: VehicleRate) {
    if (!confirm('Supprimer ce tarif ?')) return;
    try {
      await api.delete(`/zones/rates/${r._id}`);
      push('success', 'Tarif supprimé');
      loadAll();
    } catch (err) { push('error', apiErrorMessage(err)); }
  }

  return (
    <div>
      <PageHeader title="Zones & Tarifs" subtitle="Tarification par véhicule et par zone" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Zones</CardTitle>
            <Button size="sm" onClick={() => setZoneModal(true)}><Plus className="h-4 w-4" /> Ajouter</Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {zones.map((z) => (
              <div key={z._id} className="flex items-center justify-between rounded-lg border border-slate-100 p-2.5">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-brand-600" />
                  <div>
                    <div className="text-sm font-medium text-slate-800">{z.name}</div>
                    {z.defaultPricePerDay ? <div className="text-xs text-slate-400">Défaut: {formatCurrency(z.defaultPricePerDay)}/j</div> : null}
                  </div>
                </div>
                <button onClick={() => deleteZone(z)} className="text-slate-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
            {zones.length === 0 && <p className="text-sm text-slate-400">Aucune zone</p>}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tarifs par véhicule et zone</CardTitle>
            <Button size="sm" onClick={() => setRateModal(true)}><Plus className="h-4 w-4" /> Nouveau tarif</Button>
          </CardHeader>
          <Table>
            <THead>
              <Tr><Th>Véhicule</Th><Th>Zone</Th><Th>Prix/jour</Th><Th>Caution</Th><Th /></Tr>
            </THead>
            <TBody>
              {rates.map((r: any) => (
                <Tr key={r._id}>
                  <Td>{r.vehicle?.brand} {r.vehicle?.model}</Td>
                  <Td>{r.zone?.name}</Td>
                  <Td className="font-medium">{formatCurrency(r.pricePerDay)}</Td>
                  <Td>{formatCurrency(r.deposit || 0)}</Td>
                  <Td><button onClick={() => deleteRate(r)} className="text-slate-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button></Td>
                </Tr>
              ))}
            </TBody>
          </Table>
          {rates.length === 0 && <EmptyState message="Aucun tarif configuré" />}
        </Card>
      </div>

      <Modal open={zoneModal} onClose={() => setZoneModal(false)} title="Nouvelle zone">
        <div className="space-y-4">
          <Field label="Nom"><Input value={zoneForm.name || ''} onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })} /></Field>
          <Field label="Prix par défaut / jour"><Input type="number" value={zoneForm.defaultPricePerDay || ''} onChange={(e) => setZoneForm({ ...zoneForm, defaultPricePerDay: Number(e.target.value) })} /></Field>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setZoneModal(false)}>Annuler</Button><Button onClick={saveZone} disabled={!zoneForm.name}>Créer</Button></div>
        </div>
      </Modal>

      <Modal open={rateModal} onClose={() => setRateModal(false)} title="Nouveau tarif">
        <div className="space-y-4">
          <Field label="Véhicule">
            <Select value={rateForm.vehicle || ''} onChange={(e) => setRateForm({ ...rateForm, vehicle: e.target.value })}>
              <option value="">Sélectionner...</option>
              {vehicles.map((v) => <option key={v._id} value={v._id}>{v.brand} {v.model} ({v.plateNumber})</option>)}
            </Select>
          </Field>
          <Field label="Zone">
            <Select value={rateForm.zone || ''} onChange={(e) => setRateForm({ ...rateForm, zone: e.target.value })}>
              <option value="">Sélectionner...</option>
              {zones.map((z) => <option key={z._id} value={z._id}>{z.name}</option>)}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Prix / jour"><Input type="number" value={rateForm.pricePerDay || ''} onChange={(e) => setRateForm({ ...rateForm, pricePerDay: Number(e.target.value) })} /></Field>
            <Field label="Caution"><Input type="number" value={rateForm.deposit || ''} onChange={(e) => setRateForm({ ...rateForm, deposit: Number(e.target.value) })} /></Field>
          </div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setRateModal(false)}>Annuler</Button><Button onClick={saveRate} disabled={!rateForm.vehicle || !rateForm.zone || !rateForm.pricePerDay}>Enregistrer</Button></div>
        </div>
      </Modal>
    </div>
  );
}
