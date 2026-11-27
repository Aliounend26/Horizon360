import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 bg-slate-50 text-center">
      <div className="text-6xl font-bold text-brand-800">404</div>
      <p className="text-slate-500">Page introuvable</p>
      <Link to="/" className="text-sm font-medium text-brand-700 hover:underline">Retour au tableau de bord</Link>
    </div>
  );
}
