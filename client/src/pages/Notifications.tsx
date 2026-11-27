import { useEffect, useState } from 'react';
import { AlertTriangle, Bell, CheckCheck, Info, XCircle } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { formatDateTime } from '../utils/format';
import { cn } from '../utils/cn';

const severityIcon: Record<string, any> = { info: Info, warning: AlertTriangle, critical: XCircle };
const severityColor: Record<string, string> = { info: 'text-blue-500 bg-blue-50', warning: 'text-amber-500 bg-amber-50', critical: 'text-red-500 bg-red-50' };

export default function Notifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await api.get('/notifications');
    setNotifications(res.data.notifications);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function markRead(id: string) {
    await api.post(`/notifications/${id}/read`);
    load();
  }
  async function markAllRead() {
    await api.post('/notifications/read-all');
    load();
  }

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Alertes entretien, assurance, contrôle technique et locations"
        actions={<Button variant="outline" onClick={markAllRead}><CheckCheck className="h-4 w-4" /> Tout marquer comme lu</Button>}
      />

      {loading ? (
        <div className="flex h-40 items-center justify-center text-slate-400">Chargement...</div>
      ) : notifications.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-slate-400">
          <Bell className="mb-2 h-8 w-8" /> Aucune notification
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const Icon = severityIcon[n.severity];
            return (
              <Card key={n._id} className={cn('flex items-start gap-3 p-4', !n.read && 'border-brand-200 bg-brand-50/30')}>
                <div className={cn('rounded-lg p-2', severityColor[n.severity])}><Icon className="h-4 w-4" /></div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-slate-800">{n.title}</div>
                  <div className="text-sm text-slate-500">{n.message}</div>
                  <div className="mt-1 text-xs text-slate-400">{formatDateTime(n.createdAt)}</div>
                </div>
                {!n.read && (
                  <button onClick={() => markRead(n._id)} className="text-xs font-medium text-brand-700 hover:underline">Marquer lu</button>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
