// A room/village photo, or the hills illustration when there is no photo yet.
export default function Photo({ src, alt = '', label, className = '' }) {
  if (src) {
    return <img src={src} alt={alt} className={`h-full w-full object-cover ${className}`} loading="lazy" />;
  }
  return (
    <div className={`relative h-full w-full overflow-hidden bg-[#DCE8DF] ${className}`}>
      <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <rect width="400" height="260" fill="#DCE8DF" />
        <circle cx="300" cy="80" r="28" fill="#E3A72F" />
        <path d="M0 170 Q80 110 160 150 T320 130 T400 140 V260 H0Z" fill="#8FB59E" />
        <path d="M0 200 Q100 160 200 190 T400 180 V260 H0Z" fill="#3F7A5E" />
        <path d="M0 232 Q120 212 240 226 T400 220 V260 H0Z" fill="#1F5B45" />
      </svg>
      {label && (
        <span className="absolute bottom-2.5 left-3 rounded-md bg-paddy-dark/75 px-2 py-0.5 text-[11px] text-white">{label}</span>
      )}
    </div>
  );
}
