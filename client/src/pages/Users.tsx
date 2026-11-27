import { useEffect, useState } from 'react';
import { Plus, KeyRound } from 'lucide-react';
import { api, apiErrorMessage } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Input, Field, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Table, THead, TBody, Tr, Th, Td, EmptyState } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import { User } from '../types';

const roleLabel: Record<string, string> = { superadmin: 'SuperAdmin', admin: 'Admin', user: 'Utilisateur' };

export default function Users() {
  const { user: me } = useAuth();
  const { push } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [resetModal, setResetModal] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [form, setForm] = useState<any>({ role: 'user', status: 'active' });
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await api.get('/users');
    setUsers(res.data);
  }
  useEffect(() => { load(); }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await api.post('/users', form);
      push('success', 'Utilisateur créé — mot de passe temporaire à communiquer');
      setModalOpen(false);
      setForm({ role: 'user', status: 'active' });
      load();
    } catch (err) {
      push('error', apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(u: User) {
    try {
      await api.put(`/users/${u._id}`, { status: u.status === 'active' ? 'inactive' : 'active' });
      push('success', 'Statut mis à jour');
      load();
    } catch (err) { push('error', apiErrorMessage(err)); }
  }

  async function resetPassword() {
    if (!resetModal) return;
    try {
      await api.put(`/users/${resetModal._id}`, { password: newPassword });
      push('success', 'Mot de passe réinitialisé');
      setResetModal(null);
      setNewPassword('');
    } catch (err) { push('error', apiErrorMessage(err)); }
  }

  return (
    <div>
      <PageHeader
        title="Utilisateurs"
        subtitle="Gestion des comptes et des rôles"
        actions={<Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> Nouvel utilisateur</Button>}
      />

      <Table>
        <THead><Tr><Th>Nom</Th><Th>Identifiant</Th><Th>Rôle</Th><Th>Statut</Th><Th /></Tr></THead>
        <TBody>
          {users.map((u) => (
            <Tr key={u._id}>
              <Td>{u.firstName} {u.lastName}</Td>
              <Td>{u.username}</Td>
              <Td><Badge tone={u.role === 'superadmin' ? 'purple' : u.role === 'admin' ? 'blue' : 'slate'}>{roleLabel[u.role]}</Badge></Td>
              <Td>
                <button onClick={() => toggleStatus(u)} disabled={u._id === me?._id}>
                  <Badge tone={u.status === 'active' ? 'green' : 'red'}>{u.status === 'active' ? 'Actif' : 'Inactif'}</Badge>
                </button>
              </Td>
              <Td>
                <button onClick={() => setResetModal(u)} className="text-slate-400 hover:text-brand-700" title="Réinitialiser le mot de passe">
                  <KeyRound className="h-4 w-4" />
                </button>
              </Td>
            </Tr>
          ))}
        </TBody>
      </Table>
      {users.length === 0 && <EmptyState message="Aucun utilisateur" />}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nouvel utilisateur">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Prénom"><Input value={form.firstName || ''} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></Field>
          <Field label="Nom"><Input value={form.lastName || ''} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></Field>
          <Field label="Identifiant"><Input value={form.username || ''} onChange={(e) => setForm({ ...form, username: e.target.value })} /></Field>
          <Field label="Email"><Input type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Mot de passe temporaire"><Input type="text" value={form.password || ''} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
          <Field label="Rôle">
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="user">Utilisateur</option>
              {me?.role === 'superadmin' && <option value="admin">Admin</option>}
              {me?.role === 'superadmin' && <option value="superadmin">SuperAdmin</option>}
            </Select>
          </Field>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
          <Button onClick={handleSave} loading={saving} disabled={!form.firstName || !form.lastName || !form.username || !form.password}>Créer</Button>
        </div>
      </Modal>

      <Modal open={!!resetModal} onClose={() => setResetModal(null)} title="Réinitialiser le mot de passe" size="sm">
        <Field label="Nouveau mot de passe"><Input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></Field>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setResetModal(null)}>Annuler</Button>
          <Button onClick={resetPassword} disabled={newPassword.length < 6}>Réinitialiser</Button>
        </div>
      </Modal>
    </div>
  );
}
