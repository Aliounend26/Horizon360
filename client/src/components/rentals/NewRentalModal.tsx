import { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Field, Input, Select } from '../ui/Input';
import { Button } from '../ui/Button';
import { api, apiErrorMessage } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { Client, Vehicle, Zone, CompanySettings } from '../../types';
import { formatCurrency, toInputDate } from '../../utils/format';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function NewRentalModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { push } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<string[]>(['Espèces']);

  const [client, setClient] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [zone, setZone] = useState('');
  const [startDate, setStartDate] = useState(toInputDate(new Date()));
  const [endDate, setEndDate] = useState('');
  const [discount, setDiscount] = useState(0);
  const [extraFees, setExtraFees] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [hasDeposit, setHasDeposit] = useState(false);
  const [deposit, setDeposit] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Espèces');
  const [observations, setObservations] = useState('');

  const [availability, setAvailability] = useState<{ available: boolean; reason?: string } | null>(null);
  const [quote, setQuote] = useState<any>(null);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    api.get('/clients').then((res) => setClients(res.data));
    api.get('/vehicles', { params: { status: 'available' } }).then((res) => setVehicles(res.data));
    api.get('/zones').then((res) => setZones(res.data));
    api.get<CompanySettings>('/settings').then((res) => {
      const methods = res.data.paymentMethods?.length ? res.data.paymentMethods : ['Espèces'];
      setPaymentMethods(methods);
      setPaymentMethod(methods[0]);
    });
  }, [open]);

  useEffect(() => {
    setAvailability(null);
    setQuote(null);
    if (!vehicle || !zone || !startDate || !endDate) return;
    if (new Date(endDate) <= new Date(startDate)) return;

    setChecking(true);
    const t = setTimeout(async () => {
      try {
        const [avail, q] = await Promise.all([
          api.get('/rentals/availability', { params: { vehicle, start: startDate, end: endDate } }),
          api.get('/rentals/quote', { params: { vehicle, zone, start: startDate, end: endDate, discount, extraFees } }),
        ]);
        setAvailability(avail.data);
        setQuote(q.data);
      } catch (err: any) {
        setAvailability({ available: false, reason: apiErrorMessage(err) });
      } finally {
        setChecking(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [vehicle, zone, startDate, endDate, discount, extraFees]);

  function reset() {
    setClient(''); setVehicle(''); setZone(''); setStartDate(toInputDate(new Date())); setEndDate('');
    setDiscount(0); setExtraFees(0); setPaidAmount(0); setHasDeposit(false); setDeposit(0); setObservations(''); setAvailability(null); setQuote(null);
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await api.post('/rentals', {
        client, vehicle, zone, startDate, endDate, discount, extraFees, paidAmount, paymentMethod, deposit: hasDeposit ? deposit : 0, observations,
      });
      push('success', 'Location créée avec succès');
      reset();
      onClose();
      onCreated();
    } catch (err) {
      push('error', apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = client && vehicle && zone && startDate && endDate && availability?.available && quote;

  return (
    <Modal open={open} onClose={onClose} title="Nouvelle location" size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Client">
            <Select value={client} onChange={(e) => setClient(e.target.value)}>
              <option value="">Sélectionner un client...</option>
              {clients.map((c) => <option key={c._id} value={c._id}>{c.firstName} {c.lastName} — {c.phone}</option>)}
            </Select>
          </Field>
          <Field label="Véhicule">
            <Select value={vehicle} onChange={(e) => setVehicle(e.target.value)}>
              <option value="">Sélectionner un véhicule...</option>
              {vehicles.map((v) => <option key={v._id} value={v._id}>{v.brand} {v.model} ({v.plateNumber})</option>)}
            </Select>
          </Field>
          <Field label="Zone">
            <Select value={zone} onChange={(e) => setZone(e.target.value)}>
              <option value="">Sélectionner une zone...</option>
              {zones.map((z) => <option key={z._id} value={z._id}>{z.name}</option>)}
            </Select>
          </Field>
          <Field label="Mode de paiement">
            <Select className="hidden" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option>Espèces</option><option>Mobile Money</option><option>Virement</option><option>Carte bancaire</option>
            </Select>
            <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              {paymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}
            </Select>
          </Field>
          <Field label="Date de départ"><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></Field>
          <Field label="Date de retour"><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></Field>
          <Field label="Réduction (FCFA)"><Input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} /></Field>
          <Field label="Frais supplémentaires (FCFA)"><Input type="number" value={extraFees} onChange={(e) => setExtraFees(Number(e.target.value))} /></Field>
        </div>

        {checking && <p className="text-sm text-slate-400">Vérification de la disponibilité...</p>}

        {availability && !availability.available && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" /> {availability.reason}
          </div>
        )}

        {availability?.available && quote && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> Véhicule disponible
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              <div><div className="text-xs text-slate-500">Jours</div><div className="font-semibold">{quote.days}</div></div>
              <div><div className="text-xs text-slate-500">Tarif/jour</div><div className="font-semibold">{formatCurrency(quote.ratePerDay)}</div></div>
              <div><div className="text-xs text-slate-500">Caution</div><div className="font-semibold">{formatCurrency(quote.deposit)}</div></div>
              <div><div className="text-xs text-slate-500">Total</div><div className="font-semibold text-brand-800">{formatCurrency(quote.totalAmount)}</div></div>
            </div>
          </div>
        )}

        <Field label="Montant payé à la réservation"><Input type="number" value={paidAmount} onChange={(e) => setPaidAmount(Number(e.target.value))} max={quote?.totalAmount} /></Field>
        <div className="rounded-lg border border-slate-200 p-3">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={hasDeposit} onChange={(e) => { setHasDeposit(e.target.checked); if (e.target.checked && deposit === 0) setDeposit(quote?.deposit || 0); }} />
            Demander une caution
          </label>
          {hasDeposit && <div className="mt-3"><Field label="Montant de la caution (FCFA)"><Input type="number" min="0" value={deposit} onChange={(e) => setDeposit(Number(e.target.value))} /></Field></div>}
        </div>
        <Field label="Observations"><Input value={observations} onChange={(e) => setObservations(e.target.value)} /></Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSubmit} loading={submitting} disabled={!canSubmit}>Confirmer la location</Button>
        </div>
      </div>
    </Modal>
  );
}
