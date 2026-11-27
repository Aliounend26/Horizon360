import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Car, ClipboardList, Users, Calendar, Wrench,
  Receipt, TrendingUp, FileBarChart, Bell, UserCog, Settings, Menu, X, LogOut, ChevronDown,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { cn } from '../utils/cn';

const navItems = [
  { to: '/', label: 'Tableau de bord', icon: LayoutDashboard, roles: ['superadmin', 'admin', 'user'] },
  { to: '/parcs', label: 'Parcs', icon: Building2, roles: ['superadmin', 'admin', 'user'] },
  { to: '/vehicules', label: 'Véhicules', icon: Car, roles: ['superadmin', 'admin', 'user'] },
  { to: '/locations', label: 'Locations', icon: ClipboardList, roles: ['superadmin', 'admin', 'user'] },
  { to: '/clients', label: 'Clients', icon: Users, roles: ['superadmin', 'admin', 'user'] },
  { to: '/calendrier', label: 'Calendrier', icon: Calendar, roles: ['superadmin', 'admin', 'user'] },
  { to: '/entretiens', label: 'Entretiens', icon: Wrench, roles: ['superadmin', 'admin', 'user'] },
  { to: '/depenses', label: 'Dépenses', icon: Receipt, roles: ['superadmin', 'admin'] },
  { to: '/zones-tarifs', label: 'Zones & Tarifs', icon: TrendingUp, roles: ['superadmin', 'admin'] },
  { to: '/rapports', label: 'Rapports', icon: FileBarChart, roles: ['superadmin', 'admin'] },
  { to: '/notifications', label: 'Notifications', icon: Bell, roles: ['superadmin', 'admin', 'user'] },
  { to: '/utilisateurs', label: 'Utilisateurs', icon: UserCog, roles: ['superadmin', 'admin'] },
  { to: '/parametres', label: 'Paramètres', icon: Settings, roles: ['superadmin'] },
];

const roleLabel: Record<string, string> = { superadmin: 'Super Administrateur', admin: 'Administrateur', user: 'Utilisateur' };

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function fetchUnread() {
      try {
        const res = await api.get('/notifications', { params: { unreadOnly: true } });
        if (mounted) setUnread(res.data.unreadCount);
      } catch {
        // ignore
      }
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const items = navItems.filter((n) => user && n.roles.includes(user.role));

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="dashboard-shell flex min-h-screen">
      {mobileOpen && (
        <button aria-label="Fermer le menu" className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[2px] lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[264px] transform border-r border-slate-200 bg-white text-slate-900 shadow-2xl shadow-slate-950/10 transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:translate-x-0 lg:shadow-none',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-[18px]">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 text-sm font-bold text-white shadow-sm shadow-brand-900/20">H</div>
            <div>
              <div className="text-sm font-bold leading-tight tracking-tight text-slate-900">Horizon360</div>
              <div className="mt-0.5 text-[11px] text-slate-500">Gestion de flotte</div>
            </div>
          </div>
          <button aria-label="Fermer le menu" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden" onClick={() => setMobileOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav aria-label="Navigation principale" className="mt-1 flex flex-col gap-0.5 px-3 py-3">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  'relative flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-colors',
                  isActive ? 'bg-brand-50 text-brand-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )
              }
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
              {item.label}
              {item.to === '/notifications' && unread > 0 && (
                <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold">{unread}</span>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col min-w-0">
        <header className="liquid-glass-surface sticky top-3 z-30 mx-3 flex h-14 items-center justify-between rounded-2xl border border-white/80 px-3 sm:mx-5 sm:px-5">
          <button aria-label="Ouvrir le menu" className="-ml-2 rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>
          <div className="hidden lg:block text-sm font-medium text-slate-500">
            Plateforme de gestion de location de véhicules
          </div>
          <div className="flex items-center gap-4">
          <NavLink aria-label={`Notifications${unread ? `, ${unread} non lues` : ''}`} to="/notifications" className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800">
              <Bell className="h-5 w-5" />
              {unread > 0 && <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">{unread}</span>}
            </NavLink>
            <div className="relative">
              <button aria-expanded={menuOpen} aria-haspopup="menu" onClick={() => setMenuOpen((v) => !v)} className="flex min-h-10 items-center gap-2 rounded-xl px-1.5 hover:bg-slate-50 sm:gap-3 sm:px-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eaf0fb] text-xs font-bold text-brand-800">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium text-slate-800">{user?.firstName} {user?.lastName}</div>
                  <div className="text-xs text-slate-400">{user && roleLabel[user.role]}</div>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>
              {menuOpen && (
                <div className="liquid-glass-surface absolute right-0 z-50 mt-2 w-52 rounded-2xl border border-white/80 p-1.5 shadow-xl shadow-slate-950/10">
                  <NavLink to="/mon-compte" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                    Mon compte
                  </NavLink>
                  <button onClick={handleLogout} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                    <LogOut className="h-4 w-4" /> Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1600px]"><Outlet /></div>
        </main>
      </div>
    </div>
  );
}
