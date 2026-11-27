import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { api, apiErrorMessage } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Input, Field } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Table, THead, TBody, Tr, Th, Td, EmptyState } from '../components/ui/Table';
import { useToast } from '../hooks/useToast';
import { formatCurrency } from '../utils/format';
import { Client } from '../types';

export default function Clients() {
  const { push } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<Partial<Client>>({});
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/clients', { params: search ? { search } : {} });
      setClients(res.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [search]);

  async function handleSave() {
    setSaving(true);
    try {
      await api.post('/clients', form);
      push('success', 'Client créé');
      setModalOpen(false);
      setForm({});
      load();
    } catch (err) {
      push('error', apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle="Gestion de la clientèle"
        actions={<Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> Nouveau client</Button>}
      />

      <div className="relative mb-4 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input className="pl-9" placeholder="Rechercher un client..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Table>
        <THead>
          <Tr><Th>Client</Th><Th>Téléphone</Th><Th>Email</Th><Th>Locations</Th><Th>Total dépensé</Th></Tr>
        </THead>
        <TBody>
          {clients.map((c) => (
            <Tr key={c._id}>
              <Td><Link to={`/clients/${c._id}`} className="font-medium text-slate-800 hover:text-brand-700">{c.firstName} {c.lastName}</Link></Td>
              <Td>{c.phone}</Td>
              <Td>{c.email || '—'}</Td>
              <Td>{c.rentalsCount ?? 0}</Td>
              <Td>{formatCurrency(c.totalSpent || 0)}</Td>
            </Tr>
          ))}
        </TBody>
      </Table>
      {!loading && clients.length === 0 && <EmptyState message="Aucun client trouvé" />}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nouveau client">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Prénom"><Input value={form.firstName || ''} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></Field>
          <Field label="Nom"><Input value={form.lastName || ''} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></Field>
          <Field label="Téléphone"><Input value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Email"><Input type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Nationalité"><Input value={form.nationality || ''} onChange={(e) => setForm({ ...form, nationality: e.target.value })} /></Field>
          <Field label="N° CNI / Passeport"><Input value={form.idNumber || ''} onChange={(e) => setForm({ ...form, idNumber: e.target.value })} /></Field>
          <Field label="N° Permis"><Input value={form.licenseNumber || ''} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} /></Field>
          <Field label="Adresse"><Input value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
          <Button onClick={handleSave} loading={saving} disabled={!form.firstName || !form.lastName || !form.phone}>Créer</Button>
        </div>
      </Modal>
    </div>
  );
}
