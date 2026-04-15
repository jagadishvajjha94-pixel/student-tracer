import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Toast } from '../components/Toast';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('interviewer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [expertise, setExpertise] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setToast(null);
    try {
      const body =
        role === 'interviewer'
          ? { name, email: email.trim(), password, role: 'interviewer', expertise }
          : {
              name,
              rollNumber: rollNumber.trim(),
              password,
              role: 'student',
              ...(email.trim() ? { email: email.trim() } : {}),
            };
      const user = await register(body);
      setToast({ message: 'Account created', type: 'success' });
      if (user.role === 'interviewer') navigate('/interviewer', { replace: true });
      else navigate('/student', { replace: true });
    } catch (err) {
      setToast({ message: err.message || 'Registration failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <h1 className="mb-2 text-center text-2xl font-bold text-slate-900">Create account</h1>
        <p className="mb-8 text-center text-slate-600">Interviewer or student registration</p>

        <div className="card">
          <div className="mb-6 flex rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              className={`flex-1 rounded-md py-2 text-sm font-medium ${
                role === 'interviewer' ? 'bg-white shadow' : 'text-slate-600'
              }`}
              onClick={() => setRole('interviewer')}
            >
              Interviewer
            </button>
            <button
              type="button"
              className={`flex-1 rounded-md py-2 text-sm font-medium ${
                role === 'student' ? 'bg-white shadow' : 'text-slate-600'
              }`}
              onClick={() => setRole('student')}
            >
              Student
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            {role === 'interviewer' ? (
              <>
                <div>
                  <label className="label">Email</label>
                  <input
                    className="input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="label">Expertise</label>
                  <input
                    className="input"
                    value={expertise}
                    onChange={(e) => setExpertise(e.target.value)}
                    placeholder="e.g. Backend, ML"
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="label">Roll number</label>
                <input
                  className="input"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  required
                />
              </div>
            )}
            {role === 'student' && (
              <div>
                <label className="label">Email (optional)</label>
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            )}
            <div>
              <label className="label">Password (min 6 characters)</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Creating…' : 'Register'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-brand-700 hover:underline">
              Sign in
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
