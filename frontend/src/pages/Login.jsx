import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Toast } from '../components/Toast';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../data/demoAccounts';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;

  const [mode, setMode] = useState('staff'); // staff | student
  const [email, setEmail] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const fillDemoAdmin = () => {
    setMode('staff');
    setEmail(DEMO_ACCOUNTS.admin.email);
    setPassword(DEMO_PASSWORD);
    setRollNumber('');
  };

  const fillDemoInterviewer = (email) => {
    setMode('staff');
    setEmail(email);
    setPassword(DEMO_PASSWORD);
    setRollNumber('');
  };

  const fillDemoStudent = (roll) => {
    setMode('student');
    setRollNumber(roll);
    setPassword(DEMO_PASSWORD);
    setEmail('');
  };

  const redirectForRole = (role) => {
    if (from && ['/admin', '/interviewer', '/student'].includes(from)) {
      navigate(from, { replace: true });
      return;
    }
    if (role === 'admin') navigate('/admin', { replace: true });
    else if (role === 'interviewer') navigate('/interviewer', { replace: true });
    else navigate('/student', { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setToast(null);
    try {
      const payload =
        mode === 'student'
          ? { rollNumber: rollNumber.trim(), password }
          : { email: email.trim(), password };
      const user = await login(payload);
      setToast({ message: 'Signed in successfully', type: 'success' });
      redirectForRole(user.role);
    } catch (err) {
      setToast({ message: err.message || 'Login failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">Interview Tracker</h1>
          <p className="mt-2 text-slate-600">Sign in to continue</p>
        </div>

        <div className="card mb-6 border-amber-200 bg-amber-50/90">
          <h2 className="text-sm font-semibold text-amber-900">Demo logins</h2>
          <p className="mt-1 text-xs text-amber-800/90">
            Password for every account below: <code className="rounded bg-amber-100 px-1 py-0.5 font-mono">{DEMO_PASSWORD}</code>
            . Click a row to fill the form, then <strong>Sign in</strong>. Demo data loads automatically on first
            server start (empty database).
          </p>
          <div className="mt-3 space-y-2 text-xs">
            <div>
              <span className="font-medium text-amber-900">Admin</span>
              <button
                type="button"
                onClick={fillDemoAdmin}
                className="ml-2 rounded-md bg-white px-2 py-1 text-left font-mono text-amber-950 shadow-sm ring-1 ring-amber-300 hover:bg-amber-100"
              >
                {DEMO_ACCOUNTS.admin.email}
              </button>
            </div>
            <div>
              <span className="font-medium text-amber-900">Interviewers</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {DEMO_ACCOUNTS.interviewers.map((iv) => (
                  <button
                    key={iv.email}
                    type="button"
                    onClick={() => fillDemoInterviewer(iv.email)}
                    className="rounded-md bg-white px-2 py-1 font-mono text-[11px] text-amber-950 shadow-sm ring-1 ring-amber-300 hover:bg-amber-100"
                    title={iv.label}
                  >
                    {iv.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="font-medium text-amber-900">Students</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {DEMO_ACCOUNTS.students.map((s) => (
                  <button
                    key={s.roll}
                    type="button"
                    onClick={() => fillDemoStudent(s.roll)}
                    className="rounded-md bg-white px-2 py-1 font-mono text-[11px] text-amber-950 shadow-sm ring-1 ring-amber-300 hover:bg-amber-100"
                    title={s.label}
                  >
                    {s.roll}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="mb-6 flex rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              className={`flex-1 rounded-md py-2 text-sm font-medium ${
                mode === 'staff' ? 'bg-white shadow text-slate-900' : 'text-slate-600'
              }`}
              onClick={() => setMode('staff')}
            >
              Admin / Interviewer
            </button>
            <button
              type="button"
              className={`flex-1 rounded-md py-2 text-sm font-medium ${
                mode === 'student' ? 'bg-white shadow text-slate-900' : 'text-slate-600'
              }`}
              onClick={() => setMode('student')}
            >
              Student
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'staff' ? (
              <div>
                <label className="label" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  className="input"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            ) : (
              <div>
                <label className="label" htmlFor="roll">
                  Roll number
                </label>
                <input
                  id="roll"
                  className="input"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  required
                />
              </div>
            )}
            <div>
              <label className="label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                className="input"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            New interviewer or student?{' '}
            <Link to="/register" className="font-medium text-brand-700 hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
