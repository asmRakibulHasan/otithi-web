import { Link } from 'react-router-dom';

export function LogoMark({ size = 40, light = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="12" fill={light ? '#FBF8F2' : '#1F5B45'} />
      <path d="M10 20l10-8 10 8v10H10z" fill="none" stroke={light ? '#1F5B45' : '#FBF8F2'} strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M17 30v-6h6v6" fill="none" stroke="#E3A72F" strokeWidth="2.2" />
      <path d="M8 34h24" stroke="#E3A72F" strokeWidth="2" strokeDasharray="3 3" />
    </svg>
  );
}

export default function Logo({ light = false }) {
  return (
    <Link to="/" className={`flex items-center gap-2.5 no-underline ${light ? 'text-white hover:text-white' : 'text-ink hover:text-ink'}`}>
      <LogoMark light={light} />
      <span className="flex flex-col leading-none">
        <span className="font-display text-2xl font-extrabold">Otithi</span>
        <span className={`text-xs ${light ? 'text-[#CFE1D6]' : 'text-muted'}`}>অতিথি · village homestays</span>
      </span>
    </Link>
  );
}
