export function Gauge({ label, value, suffix = '%' }: { label: string; value: number; suffix?: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  const color = clamped >= 70 ? '#10b981' : clamped >= 40 ? '#f59e0b' : '#ef4444';
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="110" height="110" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
        />
        <text x="50" y="55" textAnchor="middle" fontSize="18" fontWeight="700" fill="#0f172a">
          {Math.round(clamped)}{suffix}
        </text>
      </svg>
      <span className="text-xs font-medium text-slate-500 text-center">{label}</span>
    </div>
  );
}
