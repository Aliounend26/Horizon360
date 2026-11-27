import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Plus, Pencil, Trash2 } from 'lucide-react';
import { api, apiErrorMessage } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Field, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { RentalStatusBadge } from '../components/ui/Badge';
import { formatCurrency, formatDate, formatDateTime } from '../utils/format';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';

export default function RentalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { push } = useToast();
  const [data, setData] = useState<any>(null);
  const [payModal, setPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState(0);
  const [mileageModal, setMileageModal] = useState<'ongoing' | 'completed' | null>(null);
  const [mileage, setMileage] = useState(0);
  const [busy, setBusy] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [paymentMethods, setPaymentMethods] = useState<string[]>(['Espèces']);

  async function load() {
    const res = await api.get(`/rentals/${id}`);
    setData(res.data);
    setEditForm({ startDate: res.data.startDate?.slice(0, 10), endDate: res.data.endDate?.slice(0, 10), discount: res.data.discount, extraFees: res.data.extraFees, deposit: res.data.deposit, observations: res.data.observations || '', paymentMethod: res.data.paymentMethod || 'Espèces' });
  }
  useEffect(() => { load(); }, [id]);
  useEffect(() => { api.get('/settings').then((res) => setPaymentMethods(res.data.paymentMethods || ['Espèces'])); }, []);

  async function changeStatus(status: string, extra: any = {}) {
    setBusy(true);
    try {
      await api.post(`/rentals/${id}/status`, { status, ...extra });
      push('success', 'Statut mis à jour');
      load();
    } catch (err) {
      push('error', apiErrorMessage(err));
    } finally {
      setBusy(false);
      setMileageModal(null);
    }
  }

  async function addPayment() {
    setBusy(true);
    try {
      await api.post(`/rentals/${id}/payments`, { amount: payAmount, method: 'Espèces' });
      push('success', 'Paiement enregistré');
      setPayModal(false);
      setPayAmount(0);
      load();
    } catch (err) {
      push('error', apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function downloadInvoice() {
    try {
      const res = await api.get(`/reports/rentals/${id}/invoice`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `Recu_${data.rentalNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      push('error', apiErrorMessage(err));
    }
  }

  async function saveEdit() {
    setBusy(true);
    try { await api.put(`/rentals/${id}`, editForm); push('success', 'Location modifiée'); setEditModal(false); load(); }
    catch (err) { push('error', apiErrorMessage(err)); } finally { setBusy(false); }
  }

  async function deleteRental() {
    if (!confirm('Supprimer cette location ? Cette action est irréversible.')) return;
    setBusy(true);
    try { await api.delete(`/rentals/${id}`); push('success', 'Location supprimée'); navigate('/locations'); }
    catch (err) { push('error', apiErrorMessage(err)); } finally { setBusy(false); }
  }

  if (!data) return <div className="text-slate-400">Chargement...</div>;

  return (
    <div>
      <Link to="/locations" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Retour aux locations
      </Link>

      <PageHeader
        title={data.rentalNumber}
        subtitle={`${data.vehicle?.brand} ${data.vehicle?.model} — ${data.client?.firstName} ${data.client?.lastName}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadInvoice}><Download className="h-4 w-4" /> Reçu PDF</Button>
            {(user?.role === 'superadmin' || user?.role === 'admin') && <Button variant="outline" onClick={() => setEditModal(true)}><Pencil className="h-4 w-4" /> Modifier</Button>}
            {(user?.role === 'superadmin' || user?.role === 'admin') && !['ongoing', 'completed'].includes(data.status) && <Button variant="danger" onClick={deleteRental} disabled={busy}><Trash2 className="h-4 w-4" /> Supprimer</Button>}
            <RentalStatusBadge status={data.status} />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Détails de la location</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <div><div className="text-xs text-slate-400">Départ</div><div className="font-medium">{formatDate(data.startDate)}</div></div>
            <div><div className="text-xs text-slate-400">Retour prévu</div><div className="font-medium">{formatDate(data.endDate)}</div></div>
            <div><div className="text-xs text-slate-400">Jours</div><div className="font-medium">{data.days}</div></div>
            <div><div className="text-xs text-slate-400">Zone</div><div className="font-medium">{data.zone?.name}</div></div>
            <div><div className="text-xs text-slate-400">Tarif/jour</div><div className="font-medium">{formatCurrency(data.ratePerDay)}</div></div>
            <div><div className="text-xs text-slate-400">Caution</div><div className="font-medium">{formatCurrency(data.deposit)}</div></div>
            <div><div className="text-xs text-slate-400">Km départ</div><div className="font-medium">{data.mileageStart ?? '—'}</div></div>
            <div><div className="text-xs text-slate-400">Km retour</div><div className="font-medium">{data.mileageEnd ?? '—'}</div></div>
            <div><div className="text-xs text-slate-400">Km parcourus</div><div className="font-medium">{data.kmDriven ?? '—'}</div></div>
            {data.observations && <div className="col-span-full"><div className="text-xs text-slate-400">Observations</div><div className="font-medium">{data.observations}</div></div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Paiement</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Montant brut</span><span>{formatCurrency(data.grossAmount)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Réduction</span><span>-{formatCurrency(data.discount)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Frais suppl.</span><span>+{formatCurrency(data.extraFees)}</span></div>
            <div className="flex justify-between border-t border-slate-100 pt-2 font-semibold"><span>Total</span><span>{formatCurrency(data.totalAmount)}</span></div>
            <div className="flex justify-between text-emerald-600"><span>Payé</span><span>{formatCurrency(data.paidAmount)}</span></div>
            <div className="flex justify-between font-semibold text-amber-600"><span>Reste à payer</span><span>{formatCurrency(data.balanceDue)}</span></div>
            {data.balanceDue > 0 && (
              <Button size="sm" className="mt-2 w-full" onClick={() => { setPayAmount(data.balanceDue); setPayModal(true); }}>
                <Plus className="h-4 w-4" /> Ajouter un paiement
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {data.status === 'reservation' && <Button size="sm" variant="secondary" onClick={() => changeStatus('confirmed')} disabled={busy}>Confirmer</Button>}
          {(data.status === 'reservation' || data.status === 'confirmed') && (
            <Button size="sm" onClick={() => { setMileage(0); setMileageModal('ongoing'); }} disabled={busy}>Démarrer la location</Button>
          )}
          {data.status === 'ongoing' && (
            <Button size="sm" onClick={() => { setMileage(data.mileageStart || 0); setMileageModal('completed'); }} disabled={busy}>Clôturer la location</Button>
          )}
          {['reservation', 'confirmed'].includes(data.status) && (
            <Button size="sm" variant="danger" onClick={() => changeStatus('cancelled')} disabled={busy}>Annuler</Button>
          )}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader><CardTitle>Historique des paiements</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {data.payments?.length === 0 ? (
            <p className="text-sm text-slate-400">Aucun paiement enregistré</p>
          ) : data.payments?.map((p: any) => (
            <div key={p._id} className="flex items-center justify-between rounded-lg border border-slate-100 p-2.5 text-sm">
              <span>{formatDateTime(p.date)} — {p.method}</span>
              <span className="font-medium text-emerald-600">{formatCurrency(p.amount)}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Modal open={payModal} onClose={() => setPayModal(false)} title="Enregistrer un paiement" size="sm">
        <Field label="Montant"><Input type="number" value={payAmount} onChange={(e) => setPayAmount(Number(e.target.value))} max={data.balanceDue} /></Field>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setPayModal(false)}>Annuler</Button>
          <Button onClick={addPayment} loading={busy} disabled={payAmount <= 0 || payAmount > data.balanceDue}>Enregistrer</Button>
        </div>
      </Modal>

      <Modal open={mileageModal !== null} onClose={() => setMileageModal(null)} title={mileageModal === 'ongoing' ? 'Démarrer la location' : 'Clôturer la location'} size="sm">
        <Field label={mileageModal === 'ongoing' ? 'Kilométrage de départ' : 'Kilométrage de retour'}>
          <Input type="number" value={mileage} onChange={(e) => setMileage(Number(e.target.value))} min={data.mileageStart || 0} />
        </Field>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setMileageModal(null)}>Annuler</Button>
          <Button
            onClick={() => changeStatus(mileageModal!, mileageModal === 'ongoing' ? { mileageStart: mileage } : { mileageEnd: mileage })}
            loading={busy}
          >
            Confirmer
          </Button>
        </div>
      </Modal>
      <Modal open={editModal} onClose={() => setEditModal(false)} title="Modifier la location" size="lg">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Date de départ"><Input type="date" value={editForm.startDate || ''} onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })} /></Field>
          <Field label="Date de retour"><Input type="date" value={editForm.endDate || ''} onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })} /></Field>
          <Field label="Réduction"><Input type="number" value={editForm.discount ?? 0} onChange={(e) => setEditForm({ ...editForm, discount: Number(e.target.value) })} /></Field>
          <Field label="Frais supplémentaires"><Input type="number" value={editForm.extraFees ?? 0} onChange={(e) => setEditForm({ ...editForm, extraFees: Number(e.target.value) })} /></Field>
          <Field label="Caution (0 = aucune)"><Input type="number" min="0" value={editForm.deposit ?? 0} onChange={(e) => setEditForm({ ...editForm, deposit: Number(e.target.value) })} /></Field>
          <Field label="Mode de paiement"><Select value={editForm.paymentMethod || paymentMethods[0]} onChange={(e) => setEditForm({ ...editForm, paymentMethod: e.target.value })}>{paymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}</Select></Field>
        </div>
        <div className="mt-4"><Field label="Observations"><Input value={editForm.observations || ''} onChange={(e) => setEditForm({ ...editForm, observations: e.target.value })} /></Field></div>
        <div className="mt-4 flex justify-end gap-2"><Button variant="outline" onClick={() => setEditModal(false)}>Annuler</Button><Button onClick={saveEdit} loading={busy}>Enregistrer</Button></div>
      </Modal>
    </div>
  );
}
