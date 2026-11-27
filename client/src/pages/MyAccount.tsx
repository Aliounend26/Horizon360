import { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Field } from '../components/ui/Input';
import { api, apiErrorMessage } from '../services/api';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';

export default function MyAccount() {
  const { user } = useAuth();
  const { push } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  async function changePassword() {
    setSaving(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      push('success', 'Mot de passe modifié avec succès');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      push('error', apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title="Mon compte" subtitle={`${user?.firstName} ${user?.lastName} — ${user?.username}`} />
      <Card className="max-w-md">
        <CardHeader><CardTitle>Changer le mot de passe</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Field label="Mot de passe actuel"><Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} /></Field>
          <Field label="Nouveau mot de passe"><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></Field>
          <Button onClick={changePassword} loading={saving} disabled={newPassword.length < 6}>Modifier</Button>
        </CardContent>
      </Card>
    </div>
  );
}
