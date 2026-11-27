import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { api, apiErrorMessage } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Input, Field, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Table, THead, TBody, Tr, Th, Td, EmptyState } from '../components/ui/Table';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency, formatDate, toInputDate } from '../utils/format';
import { Expense, Vehicle } from '../types';

const CATEGORIES = ['Carburant', 'Lavage', 'Vidange', 'Pneumatiques', 'Batterie', 'Assurance', 'Réparation', 'Entretien', 'Pièces détachées', 'Contrôle technique', 'Péage', 'Autres'];

export default function Expenses() {
  const { user } = useAuth();
  const { push } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [category, setCategory] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<any>({ date: toInputDate(new Date()), category: 'Carburant', paymentMethod: 'Espèces' });
  const [saving, setSaving] = useState(false);
  const canManage = user?.role === 'superadmin' || user?.role === 'admin';

  async function load() {
    const res = await api.get('/expenses', { params: category ? { category } : {} });
    setExpenses(res.data);
  }
  useEffect(() => { load(); api.get('/vehicles').then((r) => setVehicles(r.data)); }, [category]);

  async function handleSave() {
    setSaving(true);
    try {
      await api.post('/expenses', form);
      push('success', 'Dépense enregistrée');
      setModalOpen(false);
      load();
    } catch (err) {
      push('error', apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div>
      <PageHeader
        title="Dépenses"
        subtitle={`Total: ${formatCurrency(total)}`}
        actions={canManage ? <Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> Nouvelle dépense</Button> : undefined}
      />

      <div className="mb-4">
        <Select className="w-52" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Toutes catégories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
      </div>

      <Table>
        <THead><Tr><Th>Date</Th><Th>Véhicule</Th><Th>Catégorie</Th><Th>Description</Th><Th>Montant</Th><Th>Fournisseur</Th></Tr></THead>
        <TBody>
          {expenses.map((e: any) => (
            <Tr key={e._id}>
              <Td>{formatDate(e.date)}</Td>
              <Td>{e.vehicle ? `${e.vehicle.brand} ${e.vehicle.model}` : '—'}</Td>
              <Td>{e.category}</Td>
              <Td>{e.description || '—'}</Td>
              <Td className="font-medium">{formatCurrency(e.amount)}</Td>
              <Td>{e.supplier || '—'}</Td>
            </Tr>
          ))}
        </TBody>
      </Table>
      {expenses.length === 0 && <EmptyState message="Aucune dépense enregistrée" />}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nouvelle dépense">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Date"><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          <Field label="Catégorie">
            <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Véhicule">
            <Select value={form.vehicle || ''} onChange={(e) => setForm({ ...form, vehicle: e.target.value })}>
              <option value="">Aucun (dépense générale)</option>
              {vehicles.map((v) => <option key={v._id} value={v._id}>{v.brand} {v.model}</option>)}
            </Select>
          </Field>
          <Field label="Montant (FCFA)"><Input type="number" value={form.amount || ''} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} /></Field>
          <Field label="Mode de paiement">
            <Select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
              <option>Espèces</option><option>Mobile Money</option><option>Virement</option><option>Carte bancaire</option>
            </Select>
          </Field>
          <Field label="Fournisseur"><Input value={form.supplier || ''} onChange={(e) => setForm({ ...form, supplier: e.target.value })} /></Field>
          <Field label="Description" hint="col-span-2"><Input value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
          <Button onClick={handleSave} loading={saving} disabled={!form.amount || !form.category}>Enregistrer</Button>
        </div>
      </Modal>
    </div>
  );
}
