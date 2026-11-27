import { useEffect, useState } from 'react';
import { Building2, Plus, Pencil, Trash2, MapPin, Phone } from 'lucide-react';
import { api, apiErrorMessage } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input, Field, Textarea, Select } from '../components/ui/Input';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency } from '../utils/format';
import { Park, User } from '../types';
import { Link } from 'react-router-dom';

export default function Parks() {
  const { user } = useAuth();
  const { push } = useToast();
  const [parks, setParks] = useState<Park[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Park | null>(null);
  const [form, setForm] = useState<Partial<Park>>({});
  const [saving, setSaving] = useState(false);

  const canManage = user?.role === 'superadmin' || user?.role === 'admin';

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/parks');
      setParks(res.data);
    } catch (err) {
      push('error', apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    if (canManage) api.get('/users').then((res) => setUsers(res.data)).catch(() => undefined);
  }, []);

  function openCreate() {
    setEditing(null);
    setForm({ status: 'active' });
    setModalOpen(true);
  }
  function openEdit(p: Park) {
    setEditing(p);
    setForm({ ...p, assignedUsers: (p.assignedUsers || []).map((u: any) => typeof u === 'string' ? u : u._id) });
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/parks/${editing._id}`, form);
        push('success', 'Parc mis à jour');
      } else {
        await api.post('/parks', form);
        push('success', 'Parc créé');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      push('error', apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p: Park) {
    if (!confirm(`Supprimer le parc "${p.name}" et ses ${p.vehicleCount ?? 0} véhicule(s) ? Cette action est irréversible.`)) return;
    try {
      await api.delete(`/parks/${p._id}`);
      push('success', 'Parc supprimé');
      load();
    } catch (err) {
      push('error', apiErrorMessage(err));
    }
  }

  return (
    <div>
      <PageHeader
        title="Parcs"
        subtitle="Gestion des parcs automobiles"
        actions={canManage ? <Button onClick={openCreate}><Plus className="h-4 w-4" /> Nouveau parc</Button> : undefined}
      />

      {loading ? (
        <div className="flex h-40 items-center justify-center text-slate-400">Chargement...</div>
      ) : parks.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-slate-400">Aucun parc pour le moment</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {parks.map((p) => (
            <Card key={p._id}>
              <CardContent>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <Link to={`/parcs/${p._id}`} className="font-semibold text-slate-900 hover:text-brand-700">{p.name}</Link>
                      <div className="text-xs text-slate-400">{p.vehicleCount ?? 0} véhicules</div>
                    </div>
                  </div>
                  {canManage && (
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(p)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><Pencil className="h-3.5 w-3.5" /></button>
                      {user?.role === 'superadmin' && (
                        <button onClick={() => handleDelete(p)} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                      )}
                    </div>
                  )}
                </div>

                {p.location && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500"><MapPin className="h-3.5 w-3.5" /> {p.location}</div>
                )}
                {p.phone && (
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><Phone className="h-3.5 w-3.5" /> {p.phone}</div>
                )}
                <div className="mt-3 text-xs text-slate-500">
                  Utilisateurs attribués : <span className="font-medium text-slate-700">{(p.assignedUsers || []).length}</span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-3 text-center">
                  <div>
                    <div className="text-xs text-slate-400">CA</div>
                    <div className="text-sm font-semibold text-slate-800">{formatCurrency(p.revenue || 0)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Dépenses</div>
                    <div className="text-sm font-semibold text-slate-800">{formatCurrency(p.expenses || 0)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Bénéfice</div>
                    <div className="text-sm font-semibold text-emerald-600">{formatCurrency(p.netProfit || 0)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Modifier le parc' : 'Nouveau parc'}>
        <div className="space-y-4">
          <Field label="Nom du parc">
            <Input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <Field label="Description">
            <Textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          </Field>
          <Field label="Localisation">
            <Input value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Responsable">
              <Input value={form.manager || ''} onChange={(e) => setForm({ ...form, manager: e.target.value })} />
            </Field>
            <Field label="Téléphone">
              <Input value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
          </div>
          {canManage && (
            <Field label="Utilisateurs attribués">
              <Select multiple value={(form.assignedUsers as string[]) || []} onChange={(e) => setForm({ ...form, assignedUsers: Array.from(e.target.selectedOptions, (option) => option.value) })} className="h-32">
                {users.filter((u) => u.status === 'active').map((u) => <option key={u._id} value={u._id}>{u.firstName} {u.lastName} — {u.username}</option>)}
              </Select>
              <p className="mt-1 text-xs text-slate-400">Utilisez Ctrl/Cmd pour sélectionner plusieurs utilisateurs.</p>
            </Field>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Email">
              <Input type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Statut">
              <Select value={form.status || 'active'} onChange={(e) => setForm({ ...form, status: e.target.value as any })}>
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
              </Select>
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} loading={saving} disabled={!form.name}>Enregistrer</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
