export function Toast({ message, type = 'success', onClose }) {
  if (!message) return null;
  const bg =
    type === 'error'
      ? 'bg-red-50 text-red-800 border-red-200'
      : 'bg-emerald-50 text-emerald-800 border-emerald-200';
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-3 rounded-lg border px-4 py-3 shadow-lg ${bg}`}
      role="status"
    >
      <p className="text-sm font-medium">{message}</p>
      <button
        type="button"
        onClick={onClose}
        className="text-sm opacity-70 hover:opacity-100"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
