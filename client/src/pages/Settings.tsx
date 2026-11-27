import { useEffect, useState } from 'react';
import { api, apiErrorMessage } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Field } from '../components/ui/Input';
import { useToast } from '../hooks/useToast';
import { CompanySettings } from '../types';

export default function Settings() {
  const { push } = useToast();
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.get('/settings').then((res) => setSettings(res.data)); }, []);

  async function save() {
    if (!settings) return;
    setSaving(true);
    try {
      await api.put('/settings', settings);
      push('success', 'Paramètres enregistrés');
    } catch (err) {
      push('error', apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (!settings) return <div className="text-slate-400">Chargement...</div>;

  return (
    <div>
      <PageHeader title="Paramètres" subtitle="Configuration de l'entreprise et des règles de location" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Entreprise</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Field label="Nom"><Input value={settings.name} onChange={(e) => setSettings({ ...settings, name: e.target.value })} /></Field>
            <Field label="Téléphone"><Input value={settings.phone || ''} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} /></Field>
            <Field label="Email"><Input value={settings.email || ''} onChange={(e) => setSettings({ ...settings, email: e.target.value })} /></Field>
            <Field label="Adresse"><Input value={settings.address || ''} onChange={(e) => setSettings({ ...settings, address: e.target.value })} /></Field>
            <Field label="Devise"><Input value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value })} /></Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Règles de location</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Field label="Durée minimale (jours)"><Input type="number" value={settings.minRentalDays} onChange={(e) => setSettings({ ...settings, minRentalDays: Number(e.target.value) })} /></Field>
            <Field label="Caution par défaut (FCFA)"><Input type="number" value={settings.defaultDeposit} onChange={(e) => setSettings({ ...settings, defaultDeposit: Number(e.target.value) })} /></Field>
            <Field label="Frais de retard / jour (FCFA)"><Input type="number" value={settings.lateFeePerDay} onChange={(e) => setSettings({ ...settings, lateFeePerDay: Number(e.target.value) })} /></Field>
            <Field label="Modes de paiement">
              <Input value={(settings.paymentMethods || []).join(', ')} onChange={(e) => setSettings({ ...settings, paymentMethods: e.target.value.split(',').map((value) => value.trim()).filter(Boolean) })} placeholder="Espèces, Mobile Money, Virement" />
              <p className="mt-1 text-xs text-slate-400">Séparez les modes par des virgules.</p>
            </Field>
          </CardContent>
        </Card>
      </div>

      <Button className="mt-4" onClick={save} loading={saving}>Enregistrer les paramètres</Button>
    </div>
  );
}
