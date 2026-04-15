import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/Layout';
import { Toast } from '../components/Toast';
import { ScoreBadge } from '../utils/performanceStyles.jsx';

const LEVELS = ['Need Improvement', 'Average', 'Good', 'Excellent'];
const TYPES = ['Technical', 'Communication'];

const emptyForm = {
  studentName: '',
  rollNumber: '',
  resumeLink: '',
  interviewType: 'Combined',
  batch: '',
  group: '',
  technicalScore: '',
  communicationScore: '',
  level: 'Average',
  status: 'Completed',
  remarks: '',
};

export default function InterviewerDashboard() {
  const { user } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedRoll, setSelectedRoll] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentHistory, setStudentHistory] = useState([]);
  const [batchPerformance, setBatchPerformance] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    apiFetch('/api/analytics/dashboard')
      .then((data) => setBatchPerformance(data.batchPerformance || null))
      .catch(() => setBatchPerformance(null));
  }, [user?.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const overallPreview = useMemo(() => {
    const t = Number(form.technicalScore);
    const c = Number(form.communicationScore);
    if (Number.isNaN(t) || Number.isNaN(c)) return '—';
    return ((t + c) / 2).toFixed(1);
  }, [form.technicalScore, form.communicationScore]);

  const latestResume = useMemo(() => {
    return studentHistory.find((item) => item.resumeLink)?.resumeLink || '';
  }, [studentHistory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setToast(null);
    try {
      await apiFetch('/api/interviews', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          technicalScore: Number(form.technicalScore),
          communicationScore: Number(form.communicationScore),
        }),
      });
      setForm(emptyForm);
      setToast({ message: 'Interview record saved', type: 'success' });
    } catch (err) {
      setToast({ message: err.message || 'Save failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const searchStudents = async () => {
    const q = searchTerm.trim();
    if (q.length < 2) {
      setToast({ message: 'Type at least 2 characters to search', type: 'error' });
      return;
    }
    try {
      const data = await apiFetch(`/api/interviews/search?q=${encodeURIComponent(q)}`);
      setSearchResults(data.students || []);
      setSelectedStudent(null);
      setSelectedRoll('');
      if ((data.students || []).length === 0) {
        setStudentHistory([]);
      }
    } catch (e) {
      setToast({ message: e.message, type: 'error' });
    }
  };

  const loadStudentDetails = async (student) => {
    setSelectedRoll(student.rollNumber);
    setSelectedStudent(student);
    try {
      const data = await apiFetch(
        `/api/interviews/student/${encodeURIComponent(student.rollNumber)}?limit=100`
      );
      setStudentHistory(data.interviews || []);
    } catch (e) {
      setToast({ message: e.message, type: 'error' });
    }
  };

  return (
    <Layout title="Interviewer workspace">
      <div className="mb-6 rounded-xl border border-brand-100 bg-brand-50/80 px-4 py-3 text-sm text-brand-900">
        <strong>{user?.name}</strong>
        {user?.expertise ? ` · ${user.expertise}` : ''}
        {user?.email ? ` · ${user.email}` : ''}
        <span className="mt-2 block text-xs text-brand-800/90">
          Log your interviews here — scores are on a <strong>0–10</strong> scale. Admins see all records on
          their dashboard.
        </span>
      </div>

      <section className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-sm text-slate-500">Batch average score</p>
          <p className="mt-1 text-2xl font-bold">{batchPerformance?.averageScore ?? '—'}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Placed students</p>
          <p className="mt-1 text-2xl font-bold">{batchPerformance?.placedCount ?? '—'}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Unplaced students</p>
          <p className="mt-1 text-2xl font-bold">{batchPerformance?.unplacedCount ?? '—'}</p>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="card">
          <h2 className="mb-4 text-lg font-semibold">Add interview record</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="label">Student name</label>
              <input
                className="input"
                name="studentName"
                value={form.studentName}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="label">Roll number</label>
              <input
                className="input"
                name="rollNumber"
                value={form.rollNumber}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="label">Resume link (URL)</label>
              <input
                className="input"
                name="resumeLink"
                type="url"
                placeholder="https://..."
                value={form.resumeLink}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="label">Interview type</label>
              <select
                className="input"
                name="interviewType"
                value={form.interviewType}
                onChange={handleChange}
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Batch (optional)</label>
              <input
                className="input"
                name="batch"
                value={form.batch}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="label">Group (optional)</label>
              <input className="input" name="group" value={form.group} onChange={handleChange} />
            </div>
            <div>
              <label className="label">Technical score (0–10)</label>
              <input
                className="input"
                name="technicalScore"
                type="number"
                min={0}
                max={10}
                step={0.1}
                value={form.technicalScore}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="label">Communication score (0–10)</label>
              <input
                className="input"
                name="communicationScore"
                type="number"
                min={0}
                max={10}
                step={0.1}
                value={form.communicationScore}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="label">Interview status</label>
              <select className="input" name="status" value={form.status} onChange={handleChange}>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Needs Follow-up">Needs Follow-up</option>
              </select>
            </div>
            <div>
              <label className="label">Level</label>
              <select className="input" name="level" value={form.level} onChange={handleChange}>
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">Calculated overall score: {overallPreview}</p>
            </div>
            <div>
              <label className="label">Remarks</label>
              <textarea
                className="input min-h-[88px]"
                name="remarks"
                value={form.remarks}
                onChange={handleChange}
                rows={3}
              />
            </div>
            <button type="submit" className="btn-primary w-full sm:w-auto" disabled={loading}>
              {loading ? 'Saving…' : 'Submit interview'}
            </button>
          </form>
        </section>

        <section className="card">
          <h2 className="mb-4 text-lg font-semibold">Search student (roll number or name)</h2>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row">
            <input
              className="input"
              placeholder="Search by student name or ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="button" className="btn-primary" onClick={searchStudents}>
              Search
            </button>
          </div>
          <div className="mb-4 flex flex-wrap gap-2">
            {searchResults.map((s) => (
              <button
                key={s.rollNumber}
                type="button"
                className={`rounded-full px-3 py-1 text-xs ring-1 ${selectedRoll === s.rollNumber ? 'bg-brand-100 text-brand-900 ring-brand-300' : 'bg-white text-slate-700 ring-slate-300'}`}
                onClick={() => loadStudentDetails(s)}
              >
                {s.name} ({s.rollNumber})
              </button>
            ))}
          </div>

          {selectedStudent && (
            <>
              <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="font-semibold text-slate-900">
                  {selectedStudent.name} <span className="font-mono text-xs">({selectedStudent.rollNumber})</span>
                </p>
                <p className="text-xs text-slate-600">
                  Batch: {selectedStudent.batch || '—'} · Group: {selectedStudent.group || '—'}
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-slate-200 p-3">
                  <h3 className="mb-2 text-sm font-semibold text-slate-900">Skills</h3>
                  {selectedStudent.skills?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedStudent.skills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full bg-sky-100 px-2 py-0.5 text-xs text-sky-900 ring-1 ring-sky-300"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No skills available.</p>
                  )}
                </div>

                <div className="rounded-lg border border-slate-200 p-3">
                  <h3 className="mb-2 text-sm font-semibold text-slate-900">Resume</h3>
                  {latestResume ? (
                    <a
                      href={latestResume}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-brand-700 underline"
                    >
                      Open student resume
                    </a>
                  ) : (
                    <p className="text-xs text-slate-500">No resume available yet.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </Layout>
  );
}
