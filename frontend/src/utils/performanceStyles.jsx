/** Score is always on a 0–10 scale. */

export function formatScore(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return '—';
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function scoreBadgeClass(score) {
  const s = Number(score);
  if (Number.isNaN(s)) return 'bg-slate-100 text-slate-800 ring-1 ring-slate-300';
  if (s >= 8) return 'bg-emerald-100 text-emerald-900 ring-1 ring-emerald-400/50';
  if (s >= 6) return 'bg-lime-100 text-lime-900 ring-1 ring-lime-500/40';
  if (s >= 4) return 'bg-amber-100 text-amber-900 ring-1 ring-amber-500/40';
  return 'bg-rose-100 text-rose-900 ring-1 ring-rose-400/50';
}

export function levelBadgeClass(level) {
  switch (level) {
    case 'Excellent':
      return 'bg-violet-100 text-violet-900 ring-1 ring-violet-400/50';
    case 'Good':
      return 'bg-emerald-100 text-emerald-900 ring-1 ring-emerald-400/50';
    case 'Average':
      return 'bg-sky-100 text-sky-900 ring-1 ring-sky-400/50';
    case 'Need Improvement':
      return 'bg-orange-100 text-orange-900 ring-1 ring-orange-400/50';
    default:
      return 'bg-slate-100 text-slate-800 ring-1 ring-slate-300';
  }
}

export function ScoreBadge({ score }) {
  return (
    <span
      className={`inline-flex min-w-[2.25rem] justify-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${scoreBadgeClass(score)}`}
    >
      {formatScore(score)}
    </span>
  );
}

export function LevelBadge({ level }) {
  return (
    <span
      className={`inline-flex max-w-[11rem] rounded-full px-2 py-0.5 text-xs font-medium ${levelBadgeClass(level)}`}
    >
      {level}
    </span>
  );
}
