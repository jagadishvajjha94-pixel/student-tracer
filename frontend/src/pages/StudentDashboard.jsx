import { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { apiFetch, downloadFile } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/Layout';
import { LevelBadge, ScoreBadge, formatScore } from '../utils/performanceStyles.jsx';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingAll, setDownloadingAll] = useState(false);

  useEffect(() => {
    if (!user?.rollNumber) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch(`/api/interviews/student/${encodeURIComponent(user.rollNumber)}`);
        if (!cancelled) setInterviews(data.interviews || []);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.rollNumber]);

  const stats = useMemo(() => {
    if (!interviews.length) return { avg: 0, best: 0, latest: null };
    const scores = interviews.map((i) => i.score);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const best = Math.max(...scores);
    const latest = interviews[interviews.length - 1];
    return {
      avg: Math.round(avg * 100) / 100,
      best,
      latest,
    };
  }, [interviews]);

  const chartData = useMemo(
    () =>
      interviews.map((i, idx) => ({
        name: `#${idx + 1}`,
        date: new Date(i.createdAt).toLocaleDateString(),
        score: i.overallScore ?? i.score,
        type: i.interviewType,
      })),
    [interviews]
  );

  const downloadReport = async (path, filename) => {
    const blob = await downloadFile(path);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout title="Your interview results">
      <div className="mb-6 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
        <span className="font-semibold">{user?.name}</span>
        <span className="ml-2 font-mono text-slate-600">{user?.rollNumber}</span>
        <span className="ml-2 text-slate-600">{user?.batch ? `Batch ${user.batch}` : ''}</span>
        <span className="ml-2 text-slate-600">{user?.group ? `Group ${user.group}` : ''}</span>
        <span className="ml-2 text-slate-600">{user?.placementStatus || 'Unplaced'}</span>
      </div>

      <div className="mb-4">
        <button
          type="button"
          className="btn-primary"
          disabled={downloadingAll}
          onClick={async () => {
            setDownloadingAll(true);
            try {
              await downloadReport('/api/export/student/reports/pdf', 'my-interview-reports.pdf');
            } finally {
              setDownloadingAll(false);
            }
          }}
        >
          {downloadingAll ? 'Preparing PDF…' : 'Download all reports (PDF)'}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <section className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-sm text-slate-500">Average score (0–10)</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{loading ? '—' : formatScore(stats.avg)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Best score (0–10)</p>
          <p className="mt-1 text-2xl font-bold text-brand-700">{loading ? '—' : formatScore(stats.best)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Total interviews</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{loading ? '—' : interviews.length}</p>
        </div>
      </section>

      {chartData.length > 1 && (
        <section className="card mb-8">
          <h2 className="mb-4 text-lg font-semibold">Performance trend</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 10]} />
                <Tooltip
                  formatter={(value) => [`${value}`, 'Score']}
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload ? `${payload[0].payload.type} · ${payload[0].payload.date}` : ''
                  }
                />
                <Legend />
                <Line type="monotone" dataKey="score" stroke="#0284c7" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <section className="card overflow-hidden">
        <h2 className="mb-4 text-lg font-semibold">Interview history & feedback</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Tech</th>
                <th className="px-3 py-2">Comm</th>
                <th className="px-3 py-2">Overall</th>
                <th className="px-3 py-2">Level</th>
                <th className="px-3 py-2">Placement</th>
                <th className="px-3 py-2">Interviewer</th>
                <th className="px-3 py-2">Resume</th>
                <th className="px-3 py-2">Remarks</th>
                <th className="px-3 py-2">Report</th>
              </tr>
            </thead>
            <tbody>
              {interviews.map((row) => (
                <tr key={row._id} className="border-b border-slate-100">
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-600">
                    {new Date(row.createdAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-2">{row.interviewType}</td>
                  <td className="px-3 py-2">
                    <ScoreBadge score={row.technicalScore} />
                  </td>
                  <td className="px-3 py-2">
                    <ScoreBadge score={row.communicationScore} />
                  </td>
                  <td className="px-3 py-2">
                    <ScoreBadge score={row.overallScore ?? row.score} />
                  </td>
                  <td className="px-3 py-2">
                    <LevelBadge level={row.level} />
                  </td>
                  <td className="px-3 py-2">{row.placementStatus || user?.placementStatus || 'Unplaced'}</td>
                  <td className="px-3 py-2">{row.interviewerId?.name || '—'}</td>
                  <td className="px-3 py-2">
                    <a
                      href={row.resumeLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-700 underline"
                    >
                      Link
                    </a>
                  </td>
                  <td className="max-w-md px-3 py-2 text-slate-700">{row.remarks || '—'}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      className="text-brand-700 underline"
                      onClick={() =>
                        downloadReport(
                          `/api/export/student/reports/${row._id}/pdf`,
                          `interview-${row.rollNumber}-${row._id}.pdf`
                        )
                      }
                    >
                      PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && <p className="py-8 text-center text-slate-500">Loading…</p>}
          {!loading && interviews.length === 0 && (
            <p className="py-8 text-center text-slate-500">No interview records yet.</p>
          )}
        </div>
      </section>
    </Layout>
  );
}
