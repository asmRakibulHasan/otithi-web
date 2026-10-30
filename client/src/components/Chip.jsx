// Checklist "honesty colours":
// good = available, warn = be prepared, none = not available, bad = problems only
const tones = {
  good: 'bg-paddy-soft text-paddy',
  warn: 'bg-mustard-soft text-mustard-ink',
  none: 'bg-neutral-soft text-neutral-ink',
  bad: 'bg-danger-soft text-danger',
};

export default function Chip({ tone = 'good', className = '', children }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-[13px] font-semibold leading-snug ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}
