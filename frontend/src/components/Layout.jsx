import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Layout({ title, children }) {
  const { user, logout } = useAuth();

  const homeLink =
    user?.role === 'admin'
      ? '/admin'
      : user?.role === 'interviewer'
        ? '/interviewer'
        : '/student';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-50">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to={homeLink} className="text-lg font-semibold text-brand-800">
            Interview Tracker
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-slate-600 sm:inline">
              {user?.name}
              <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-800">
                {user?.role}
              </span>
            </span>
            <button type="button" onClick={logout} className="btn-secondary text-xs">
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {title && <h1 className="mb-6 text-2xl font-bold text-slate-900">{title}</h1>}
        {children}
      </main>
    </div>
  );
}
