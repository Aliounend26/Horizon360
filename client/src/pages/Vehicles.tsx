import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Car as CarIcon, Trash2 } from 'lucide-react';
import { api, apiErrorMessage } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Field, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { VehicleStatusBadge } from '../components/ui/Badge';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import { Vehicle, Park } from '../types';

const emptyForm: Partial<Vehicle> = { status: 'available', gallery: [] };

export default function Vehicles() {
  const { user } = useAuth();
  const { push } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [parks, setParks] = useState<Park[]>([]);
  const [search, setSearch] = useState('');
  const [parkFilter, setParkFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<Partial<Vehicle>>(emptyForm);
  const [saving, setSaving] = useState(false);

  const canManage = user?.role === 'superadmin' || user?.role === 'admin';

  async function load() {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (parkFilter) params.park = parkFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/vehicles', { params });
      setVehicles(res.data);
    } catch (err) {
      push('error', apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { api.get('/parks').then((res) => setParks(res.data)); }, []);
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [search, parkFilter, statusFilter]);

  function openCreate() {
    setForm({ ...emptyForm, park: parks[0]?._id });
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.post('/vehicles', form);
      push('success', 'Véhicule créé');
      setModalOpen(false);
      load();
    } catch (err) {
      push('error', apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(vehicle: Vehicle) {
    if (!confirm(`Supprimer le véhicule "${vehicle.brand} ${vehicle.model}" ?`)) return;
    try {
      await api.delete(`/vehicles/${vehicle._id}`);
      push('success', 'Véhicule supprimé');
      load();
    } catch (err) {
      push('error', apiErrorMessage(err));
    }
  }

  return (
    <div>
      <PageHeader
        title="Véhicules"
        subtitle="Gestion du parc automobile"
        actions={canManage ? <Button onClick={openCreate}><Plus className="h-4 w-4" /> Nouveau véhicule</Button> : undefined}
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input className="pl-9" placeholder="Rechercher (marque, modèle, immatriculation)..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select className="sm:w-48" value={parkFilter} onChange={(e) => setParkFilter(e.target.value)}>
          <option value="">Tous les parcs</option>
          {parks.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </Select>
        <Select className="sm:w-48" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="available">Disponible</option>
          <option value="rented">Loué</option>
          <option value="maintenance">En maintenance</option>
          <option value="unavailable">Indisponible</option>
        </Select>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-slate-400">Chargement...</div>
      ) : vehicles.length === 0 ? (
        <Card className="py-12 text-center text-slate-400">Aucun véhicule trouvé</Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {vehicles.map((v) => (
            <Card key={v._id} className="relative overflow-hidden hover:border-brand-300 transition-colors h-full">
              {user?.role === 'superadmin' && (
                <button onClick={() => handleDelete(v)} className="absolute right-2 top-2 z-10 rounded bg-white/90 p-1.5 text-slate-400 shadow hover:bg-red-50 hover:text-red-600" title="Supprimer le véhicule">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <Link to={`/vehicules/${v._id}`}>
                <div className="flex h-36 items-center justify-center bg-slate-100">
                  {v.photoUrl ? (
                    <img src={v.photoUrl} alt={v.brand} className="h-full w-full object-cover" />
                  ) : (
                    <CarIcon className="h-12 w-12 text-slate-300" />
                  )}
                </div>
                <div className="p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{v.brand} {v.model}</div>
                      <div className="text-xs text-slate-400">{v.plateNumber} {v.year ? `• ${v.year}` : ''}</div>
                    </div>
                    <VehicleStatusBadge status={v.status} />
                  </div>
                  <div className="mt-2 text-xs text-slate-500">{v.mileage.toLocaleString('fr-FR')} km</div>
                </div>
              </Link>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nouveau véhicule" size="lg">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Parc">
            <Select value={form.park as string || ''} onChange={(e) => setForm({ ...form, park: e.target.value })}>
              {parks.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </Select>
          </Field>
          <Field label="Statut">
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}>
              <option value="available">Disponible</option>
              <option value="maintenance">En maintenance</option>
              <option value="unavailable">Indisponible</option>
            </Select>
          </Field>
          <Field label="Marque"><Input value={form.brand || ''} onChange={(e) => setForm({ ...form, brand: e.target.value })} required /></Field>
          <Field label="Modèle"><Input value={form.model || ''} onChange={(e) => setForm({ ...form, model: e.target.value })} required /></Field>
          <Field label="Année"><Input type="number" value={form.year || ''} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} /></Field>
          <Field label="Immatriculation"><Input value={form.plateNumber || ''} onChange={(e) => setForm({ ...form, plateNumber: e.target.value })} required /></Field>
          <Field label="Couleur"><Input value={form.color || ''} onChange={(e) => setForm({ ...form, color: e.target.value })} /></Field>
          <Field label="Carburant"><Input value={form.fuelType || ''} onChange={(e) => setForm({ ...form, fuelType: e.target.value })} /></Field>
          <Field label="Transmission"><Input value={form.transmission || ''} onChange={(e) => setForm({ ...form, transmission: e.target.value })} /></Field>
          <Field label="Places"><Input type="number" value={form.seats || ''} onChange={(e) => setForm({ ...form, seats: Number(e.target.value) })} /></Field>
          <Field label="Kilométrage actuel"><Input type="number" value={form.mileage ?? ''} onChange={(e) => setForm({ ...form, mileage: Number(e.target.value) })} /></Field>
          <Field label="VIN / Châssis"><Input value={form.vin || ''} onChange={(e) => setForm({ ...form, vin: e.target.value })} /></Field>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
          <Button onClick={handleSave} loading={saving} disabled={!form.brand || !form.model || !form.plateNumber || !form.park}>Créer</Button>
        </div>
      </Modal>
    </div>
  );
}
