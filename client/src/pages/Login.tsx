import { useState, FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input, Field } from '../components/ui/Input';
import { AlertCircle } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      const dest = (location.state as any)?.from || '/';
      navigate(dest, { replace: true });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(u: string, p: string) {
    setUsername(u);
    setPassword(p);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f7fa] px-4 py-10 sm:px-6">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(16,24,40,0.12)] lg:grid-cols-[0.9fr_1.1fr]">
        <section className="relative hidden min-h-[620px] flex-col justify-between overflow-hidden bg-[#15284d] p-10 text-white lg:flex xl:p-12">
          <div className="absolute -right-28 -top-20 h-96 w-96 rounded-full border border-white/10" />
          <div className="absolute -right-12 -top-4 h-64 w-64 rounded-full border border-white/10" />
          <div className="relative flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-bold text-brand-800">H</div>
            <div><div className="text-sm font-bold">Horizon360</div><div className="text-xs text-blue-100/70">Gestion de flotte</div></div>
          </div>
          <div className="relative max-w-sm">
            <div className="mb-5 h-1 w-12 rounded-full bg-[#8ec5b5]" />
            <p className="text-sm font-medium text-blue-100/70">UNE FLOTTE, UNE VISION</p>
            <h1 className="mt-3 text-4xl font-semibold leading-[1.12] tracking-[-0.04em] xl:text-5xl">Chaque véhicule à sa juste place.</h1>
            <p className="mt-5 max-w-xs text-sm leading-6 text-blue-100/75">Locations, parc et rentabilité réunis dans un espace clair pour piloter votre activité.</p>
          </div>
          <p className="relative text-xs text-blue-100/50">Horizon360 · Gestion intelligente de votre parc automobile</p>
        </section>
        <section className="flex items-center justify-center px-6 py-10 sm:px-12 lg:px-14">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-700 text-sm font-bold text-white">H</div>
            <h1 className="text-xl font-bold tracking-tight text-slate-950">Horizon360</h1>
            <p className="mt-1 text-sm text-slate-500">Gestion intelligente de votre parc automobile</p>
          </div>
          <div className="mb-7">
            <h2 className="text-2xl font-bold tracking-[-0.035em] text-slate-950">Ravi de vous retrouver</h2>
            <p className="mt-2 text-sm text-slate-500">Connectez-vous pour accéder à votre espace de gestion.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Identifiant">
              <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ex: admin" autoFocus required />
            </Field>
            <Field label="Mot de passe">
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </Field>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
              </div>
            )}

            <Button type="submit" className="w-full" loading={loading}>
              Se connecter
            </Button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-4">
            <p className="mb-2 text-xs font-medium text-slate-400">Comptes de démonstration</p>
            <div className="grid grid-cols-3 gap-2">
              <button type="button" onClick={() => fillDemo('superadmin', 'SuperAdmin123!')} className="min-h-10 rounded-xl border border-slate-200 px-2 py-2 text-xs font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50">
                SuperAdmin
              </button>
              <button type="button" onClick={() => fillDemo('admin', 'Admin123!')} className="min-h-10 rounded-xl border border-slate-200 px-2 py-2 text-xs font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50">
                Admin
              </button>
              <button type="button" onClick={() => fillDemo('user', 'User123!')} className="min-h-10 rounded-xl border border-slate-200 px-2 py-2 text-xs font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50">
                Utilisateur
              </button>
            </div>
          </div>
        </div>
        </section>
      </div>
    </div>
  );
}
