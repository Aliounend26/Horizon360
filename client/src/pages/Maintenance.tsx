import { useEffect, useState } from 'react';
import { Plus, Wrench } from 'lucide-react';
import { api, apiErrorMessage } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Input, Field, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Table, THead, TBody, Tr, Th, Td, EmptyState } from '../components/ui/Table';
import { MaintenanceStatusBadge } from '../components/ui/Badge';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import { formatDate, toInputDate } from '../utils/format';
import { Maintenance as MaintenanceItem, MaintenanceType, Vehicle } from '../types';

export default function Maintenance() {
  const { user } = useAuth();
  const { push } = useToast();
  const [items, setItems] = useState<MaintenanceItem[]>([]);
  const [types, setTypes] = useState<MaintenanceType[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [completeItem, setCompleteItem] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [typeForm, setTypeForm] = useState<any>({});
  const [completeForm, setCompleteForm] = useState<any>({ serviceDate: toInputDate(new Date()) });
  const canManage = user?.role === 'superadmin' || user?.role === 'admin';

  async function load() {
    const [m, t, v] = await Promise.all([api.get('/maintenance'), api.get('/maintenance/types'), api.get('/vehicles')]);
    setItems(m.data);
    setTypes(t.data);
    setVehicles(v.data);
  }
  useEffect(() => { load(); }, []);

  async function handleSave() {
    try {
      await api.post('/maintenance', form);
      push('success', 'Entretien programmé');
      setModalOpen(false);
      setForm({});
      load();
    } catch (err) { push('error', apiErrorMessage(err)); }
  }

  async function saveType() {
    try {
      await api.post('/maintenance/types', typeForm);
      push('success', "Type d'entretien créé");
      setTypeModalOpen(false);
      setTypeForm({});
      load();
    } catch (err) { push('error', apiErrorMessage(err)); }
  }

  async function handleComplete() {
    try {
      await api.post(`/maintenance/${completeItem._id}/complete`, completeForm);
      push('success', 'Entretien marqué comme effectué');
      setCompleteItem(null);
      load();
    } catch (err) { push('error', apiErrorMessage(err)); }
  }

  return (
    <div>
      <PageHeader
        title="Entretiens"
        subtitle="Suivi préventif basé sur le kilométrage et la date"
        actions={
          canManage ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setTypeModalOpen(true)}>Types d'entretien</Button>
              <Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> Programmer</Button>
            </div>
          ) : undefined
        }
      />

      <Table>
        <THead><Tr><Th>Véhicule</Th><Th>Type</Th><Th>Dernier service</Th><Th>Prochain (km)</Th><Th>Prochain (date)</Th><Th>Statut</Th><Th /></Tr></THead>
        <TBody>
          {items.map((m: any) => (
            <Tr key={m._id}>
              <Td>{m.vehicle?.brand} {m.vehicle?.model}</Td>
              <Td>{m.type?.name}</Td>
              <Td>{formatDate(m.lastServiceDate)}</Td>
              <Td>{m.nextDueMileage ? `${m.nextDueMileage.toLocaleString('fr-FR')} km` : '—'}</Td>
              <Td>{m.nextDueDate ? formatDate(m.nextDueDate) : '—'}</Td>
              <Td><MaintenanceStatusBadge status={m.status} /></Td>
              <Td>
                {canManage && (
                  <Button size="sm" variant="secondary" onClick={() => { setCompleteItem(m); setCompleteForm({ serviceDate: toInputDate(new Date()), mileage: m.vehicle?.mileage }); }}>
                    <Wrench className="h-3.5 w-3.5" /> Effectué
                  </Button>
                )}
              </Td>
            </Tr>
          ))}
        </TBody>
      </Table>
      {items.length === 0 && <EmptyState message="Aucun entretien programmé" />}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Programmer un entretien">
        <div className="space-y-4">
          <Field label="Véhicule">
            <Select value={form.vehicle || ''} onChange={(e) => setForm({ ...form, vehicle: e.target.value })}>
              <option value="">Sélectionner...</option>
              {vehicles.map((v) => <option key={v._id} value={v._id}>{v.brand} {v.model}</option>)}
            </Select>
          </Field>
          <Field label="Type d'entretien">
            <Select value={form.type || ''} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="">Sélectionner...</option>
              {types.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Dernier service (date)"><Input type="date" value={form.lastServiceDate || ''} onChange={(e) => setForm({ ...form, lastServiceDate: e.target.value })} /></Field>
            <Field label="Kilométrage au dernier service"><Input type="number" value={form.lastServiceMileage || ''} onChange={(e) => setForm({ ...form, lastServiceMileage: Number(e.target.value) })} /></Field>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={!form.vehicle || !form.type}>Programmer</Button>
          </div>
        </div>
      </Modal>

      <Modal open={typeModalOpen} onClose={() => setTypeModalOpen(false)} title="Types d'entretien">
        <div className="mb-4 space-y-2">
          {types.map((t) => (
            <div key={t._id} className="flex items-center justify-between rounded-lg border border-slate-100 p-2.5 text-sm">
              <span className="font-medium">{t.name}</span>
              <span className="text-xs text-slate-400">
                {t.mileageInterval ? `${t.mileageInterval.toLocaleString('fr-FR')} km` : ''}
                {t.mileageInterval && t.timeIntervalMonths ? ' • ' : ''}
                {t.timeIntervalMonths ? `${t.timeIntervalMonths} mois` : ''}
              </span>
            </div>
          ))}
        </div>
        <div className="space-y-3 border-t border-slate-100 pt-3">
          <Field label="Nom"><Input value={typeForm.name || ''} onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Intervalle kilométrique"><Input type="number" value={typeForm.mileageInterval || ''} onChange={(e) => setTypeForm({ ...typeForm, mileageInterval: Number(e.target.value) })} /></Field>
            <Field label="Intervalle (mois)"><Input type="number" value={typeForm.timeIntervalMonths || ''} onChange={(e) => setTypeForm({ ...typeForm, timeIntervalMonths: Number(e.target.value) })} /></Field>
          </div>
          <div className="flex justify-end"><Button size="sm" onClick={saveType} disabled={!typeForm.name}>Ajouter</Button></div>
        </div>
      </Modal>

      <Modal open={!!completeItem} onClose={() => setCompleteItem(null)} title="Marquer comme effectué" size="sm">
        <div className="space-y-4">
          <Field label="Date"><Input type="date" value={completeForm.serviceDate} onChange={(e) => setCompleteForm({ ...completeForm, serviceDate: e.target.value })} /></Field>
          <Field label="Kilométrage"><Input type="number" value={completeForm.mileage || ''} onChange={(e) => setCompleteForm({ ...completeForm, mileage: Number(e.target.value) })} /></Field>
          <Field label="Coût (FCFA)"><Input type="number" value={completeForm.cost || ''} onChange={(e) => setCompleteForm({ ...completeForm, cost: Number(e.target.value) })} /></Field>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setCompleteItem(null)}>Annuler</Button><Button onClick={handleComplete}>Confirmer</Button></div>
        </div>
      </Modal>
    </div>
  );
}
