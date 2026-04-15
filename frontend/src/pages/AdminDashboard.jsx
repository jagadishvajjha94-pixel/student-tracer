import { useCallback, useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { apiFetch, apiFetchForm, downloadFile } from '../api/client';
import { Layout } from '../components/Layout';
import { Toast } from '../components/Toast';
import { LevelBadge, ScoreBadge, formatScore } from '../utils/performanceStyles.jsx';

function buildQuery(params) {
  const q = new URLSearchParams();
  if (params.q) q.set('q', params.q);
  if (params.batch) q.set('batch', params.batch);
  if (params.group) q.set('group', params.group);
  if (params.status) q.set('status', params.status);
  if (params.placementStatus) q.set('placementStatus', params.placementStatus);
  if (params.technicalSkill) q.set('technicalSkill', params.technicalSkill);
  if (params.interviewType) q.set('interviewType', params.interviewType);
  if (params.interviewerId) q.set('interviewerId', params.interviewerId);
  if (params.minScore !== '') q.set('minScore', String(params.minScore));
  if (params.maxScore !== '') q.set('maxScore', String(params.maxScore));
  if (params.minTechnicalScore !== '') q.set('minTechnicalScore', String(params.minTechnicalScore));
  if (params.maxTechnicalScore !== '') q.set('maxTechnicalScore', String(params.maxTechnicalScore));
  q.set('page', String(params.page || 1));
  q.set('limit', String(params.limit || 20));
  return q.toString();
}

export default function AdminDashboard() {
  const [interviews, setInterviews] = useState([]);
  const [interviewerOptions, setInterviewerOptions] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [studentFile, setStudentFile] = useState(null);

  const [filters, setFilters] = useState({
    q: '',
    batch: '',
    group: '',
    status: '',
    placementStatus: '',
    technicalSkill: '',
    interviewType: '',
    interviewerId: '',
    minScore: '',
    maxScore: '',
    minTechnicalScore: '',
    maxTechnicalScore: '',
    page: 1,
    limit: 20,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = buildQuery(filters);
      const [invRes, dashRes, lbRes] = await Promise.all([
        apiFetch(`/api/interviews${qs ? `?${qs}` : ''}`),
        apiFetch(`/api/analytics/dashboard${qs ? `?${qs}` : ''}`),
        apiFetch(`/api/analytics/leaderboard${qs ? `?${qs}` : ''}`),
      ]);
      setInterviews(invRes.interviews || []);
      setPagination(invRes.pagination || { page: 1, limit: 20, totalPages: 1, total: 0 });
      setDashboard(dashRes);
      setLeaderboard(lbRes.leaderboard || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    apiFetch('/api/interviews')
      .then((r) => {
        const map = new Map();
        (r.interviews || []).forEach((i) => {
          const iv = i.interviewerId;
          if (iv && iv._id) map.set(iv._id, iv.name || iv.email);
        });
        setInterviewerOptions(
          Array.from(map.entries()).map(([id, name]) => ({ id, name }))
        );
      })
      .catch(() => {});
  }, []);

  const handleExport = async (kind) => {
    try {
      const qs = buildQuery(filters);
      const path = `/api/export/${kind}${qs ? `?${qs}` : ''}`;
      const blob = await downloadFile(path);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = kind === 'excel' ? 'interviews-report.xlsx' : 'interviews-report.pdf';
      a.click();
      URL.revokeObjectURL(url);
      setToast({ message: `Downloaded ${kind.toUpperCase()}`, type: 'success' });
    } catch (e) {
      setToast({ message: e.message, type: 'error' });
    }
  };

  const handleUploadStudents = async () => {
    if (!studentFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', studentFile);
      const response = await apiFetchForm('/api/students/upload', formData);
      setToast({
        message: `Upload done: ${response.created} created, ${response.updated} updated`,
        type: 'success',
      });
      await load();
    } catch (e) {
      setToast({ message: e.message, type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const updatePlacement = async (studentId, placementStatus) => {
    if (!studentId) return;
    try {
      await apiFetch(`/api/students/${studentId}/placement`, {
        method: 'PATCH',
        body: JSON.stringify({ placementStatus }),
      });
      setToast({ message: 'Placement status updated', type: 'success' });
      await load();
    } catch (e) {
      setToast({ message: e.message, type: 'error' });
    }
  };

  const groupBarData = (dashboard?.groupTopPerformance || []).map((g) => ({
    name: g.group,
    score: g.topScore,
  }));

  return (
    <Layout title="Admin dashboard">
      <p className="-mt-2 mb-6 text-sm text-slate-600">
        View all interviews submitted by interviewers. Scores use a <strong>0–10</strong> scale (higher is
        better). Filter, export, and track student performance below.
      </p>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <p className="text-sm text-slate-500">Total interviews</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">
            {loading ? '—' : dashboard?.totalInterviews ?? 0}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Total students</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">
            {loading ? '—' : dashboard?.totalStudents ?? 0}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Average score (0–10)</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">
            {loading ? '—' : formatScore(dashboard?.averageScore ?? 0)}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Placed / Unplaced</p>
          <p className="mt-1 text-3xl font-bold text-brand-700">
            {loading ? '—' : `${dashboard?.batchPerformance?.placedCount ?? 0} / ${dashboard?.batchPerformance?.unplacedCount ?? 0}`}
          </p>
        </div>
      </section>

      {groupBarData.length > 0 && (
        <section className="card mb-8">
          <h2 className="mb-4 text-lg font-semibold">Group-wise top performance</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={groupBarData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Bar dataKey="score" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <section className="card mb-8">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-lg font-semibold">Filters & export</h2>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-primary text-xs" onClick={() => handleExport('excel')}>
              Excel
            </button>
            <button type="button" className="btn-primary text-xs" onClick={() => handleExport('pdf')}>
              PDF
            </button>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="label">Search student (name / ID)</label>
            <input
              className="input"
              value={filters.q}
              onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value, page: 1 }))}
              placeholder="e.g. CS2024 or Priya"
            />
          </div>
          <div>
            <label className="label">Batch</label>
            <input
              className="input"
              value={filters.batch}
              onChange={(e) => setFilters((f) => ({ ...f, batch: e.target.value, page: 1 }))}
              placeholder="e.g. 2024"
            />
          </div>
          <div>
            <label className="label">Group</label>
            <input
              className="input"
              value={filters.group}
              onChange={(e) => setFilters((f) => ({ ...f, group: e.target.value, page: 1 }))}
              placeholder="e.g. A"
            />
          </div>
          <div>
            <label className="label">Placement status</label>
            <select
              className="input"
              value={filters.placementStatus}
              onChange={(e) => setFilters((f) => ({ ...f, placementStatus: e.target.value, page: 1 }))}
            >
              <option value="">All</option>
              <option value="Placed">Placed</option>
              <option value="Unplaced">Unplaced</option>
            </select>
          </div>
          <div>
            <label className="label">Interview type</label>
            <select
              className="input"
              value={filters.interviewType}
              onChange={(e) => setFilters((f) => ({ ...f, interviewType: e.target.value, page: 1 }))}
            >
              <option value="">All</option>
              <option value="Technical">Technical</option>
              <option value="Communication">Communication</option>
              <option value="Combined">Combined</option>
            </select>
          </div>
          <div>
            <label className="label">Interviewer</label>
            <select
              className="input"
              value={filters.interviewerId}
              onChange={(e) => setFilters((f) => ({ ...f, interviewerId: e.target.value, page: 1 }))}
            >
              <option value="">All</option>
              {interviewerOptions.map((iv) => (
                <option key={iv.id} value={iv.id}>
                  {iv.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Interview status</label>
            <select
              className="input"
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))}
            >
              <option value="">All</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Needs Follow-up">Needs Follow-up</option>
            </select>
          </div>
          <div>
            <label className="label">Min overall score (0–10)</label>
            <input
              className="input"
              type="number"
              min={0}
              max={10}
              step={0.1}
              value={filters.minScore}
              onChange={(e) => setFilters((f) => ({ ...f, minScore: e.target.value, page: 1 }))}
            />
          </div>
          <div>
            <label className="label">Max overall score (0–10)</label>
            <input
              className="input"
              type="number"
              min={0}
              max={10}
              step={0.1}
              value={filters.maxScore}
              onChange={(e) => setFilters((f) => ({ ...f, maxScore: e.target.value, page: 1 }))}
            />
          </div>
          <div>
            <label className="label">Technical skill filter</label>
            <input
              className="input"
              value={filters.technicalSkill}
              onChange={(e) => setFilters((f) => ({ ...f, technicalSkill: e.target.value, page: 1 }))}
              placeholder="e.g. React"
            />
          </div>
          <div>
            <label className="label">Min technical score</label>
            <input
              className="input"
              type="number"
              min={0}
              max={10}
              step={0.1}
              value={filters.minTechnicalScore}
              onChange={(e) => setFilters((f) => ({ ...f, minTechnicalScore: e.target.value, page: 1 }))}
            />
          </div>
          <div>
            <label className="label">Max technical score</label>
            <input
              className="input"
              type="number"
              min={0}
              max={10}
              step={0.1}
              value={filters.maxTechnicalScore}
              onChange={(e) => setFilters((f) => ({ ...f, maxTechnicalScore: e.target.value, page: 1 }))}
            />
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">Change filters and the table updates automatically.</p>
      </section>

      <section className="card mb-8">
        <h2 className="mb-4 text-lg font-semibold">Admin database upload (CSV / Excel)</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => setStudentFile(e.target.files?.[0] || null)}
            className="text-sm"
          />
          <button type="button" className="btn-primary" onClick={handleUploadStudents} disabled={!studentFile || uploading}>
            {uploading ? 'Uploading…' : 'Upload student data'}
          </button>
        </div>
      </section>

      <section className="card mb-8 overflow-hidden">
        <h2 className="mb-4 text-lg font-semibold">Leaderboard</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Student</th>
                <th className="px-3 py-2">Roll</th>
                <th className="px-3 py-2">Max score</th>
                <th className="px-3 py-2">Avg score</th>
                <th className="px-3 py-2">Interviews</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((row, idx) => (
                <tr key={row.rollNumber} className="border-b border-slate-100">
                  <td className="px-3 py-2">{idx + 1}</td>
                  <td className="px-3 py-2">{row.studentName}</td>
                  <td className="px-3 py-2 font-mono text-xs">{row.rollNumber}</td>
                  <td className="px-3 py-2">{row.maxScore}</td>
                  <td className="px-3 py-2">{row.avgScore}</td>
                  <td className="px-3 py-2">{row.interviewsCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {leaderboard.length === 0 && !loading && (
            <p className="py-6 text-center text-slate-500">No data yet.</p>
          )}
        </div>
      </section>

      <section className="card overflow-hidden">
        <h2 className="mb-4 text-lg font-semibold">All interview records</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-3 py-2">Student</th>
                <th className="px-3 py-2">Roll #</th>
                <th className="px-3 py-2">Batch / Group</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Tech</th>
                <th className="px-3 py-2">Comm</th>
                <th className="px-3 py-2">Overall</th>
                <th className="px-3 py-2">Level</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Placement</th>
                <th className="px-3 py-2">Interviewer</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Resume</th>
                <th className="px-3 py-2">Feedback</th>
              </tr>
            </thead>
            <tbody>
              {interviews.map((row) => (
                <tr key={row._id} className="border-b border-slate-100 hover:bg-slate-50/80">
                  <td className="px-3 py-2">{row.studentName}</td>
                  <td className="px-3 py-2 font-mono text-xs">{row.rollNumber}</td>
                  <td className="px-3 py-2 text-xs">{row.batch || '—'} / {row.group || '—'}</td>
                  <td className="px-3 py-2">{row.interviewType}</td>
                  <td className="px-3 py-2">
                    <ScoreBadge score={row.technicalScore} />
                  </td>
                  <td className="px-3 py-2">
                    <ScoreBadge score={row.communicationScore} />
                  </td>
                  <td className="px-3 py-2"><ScoreBadge score={row.overallScore} /></td>
                  <td className="px-3 py-2"><LevelBadge level={row.level} /></td>
                  <td className="px-3 py-2">{row.status}</td>
                  <td className="px-3 py-2">
                    {row.studentId?._id ? (
                      <select
                        className="input h-8 py-0 text-xs"
                        value={row.placementStatus || 'Unplaced'}
                        onChange={(e) => updatePlacement(row.studentId._id, e.target.value)}
                      >
                        <option value="Placed">Placed</option>
                        <option value="Unplaced">Unplaced</option>
                      </select>
                    ) : (
                      row.placementStatus || 'Unplaced'
                    )}
                  </td>
                  <td className="px-3 py-2">{row.interviewerId?.name || '—'}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-600">
                    {new Date(row.createdAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-2">
                    <a
                      href={row.resumeLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-700 underline"
                    >
                      Open
                    </a>
                  </td>
                  <td className="max-w-xs truncate px-3 py-2 text-slate-600" title={row.remarks}>
                    {row.remarks}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && <p className="py-8 text-center text-slate-500">Loading…</p>}
          {!loading && interviews.length === 0 && (
            <p className="py-8 text-center text-slate-500">No records match filters.</p>
          )}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 text-sm">
          <p className="text-slate-600">
            Showing page {pagination.page} of {pagination.totalPages} · {pagination.total} records
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-secondary px-3 py-1 text-xs"
              disabled={pagination.page <= 1}
              onClick={() => setFilters((f) => ({ ...f, page: Math.max(1, f.page - 1) }))}
            >
              Previous
            </button>
            <button
              type="button"
              className="btn-secondary px-3 py-1 text-xs"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() =>
                setFilters((f) => ({ ...f, page: Math.min(pagination.totalPages, f.page + 1) }))
              }
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </Layout>
  );
}
