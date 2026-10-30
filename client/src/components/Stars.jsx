import { Star } from 'lucide-react';

// "★ 4.8 (23)" — or "New" when a room has no reviews yet
export default function Stars({ rating, showCount = true, className = '' }) {
  if (!rating?.count) return <span className={`text-sm font-semibold text-muted ${className}`}>New</span>;
  return (
    <span className={`inline-flex items-center gap-1 font-semibold text-mustard-ink ${className}`}>
      <Star size={16} className="fill-mustard text-mustard" aria-hidden="true" />
      <span className="sr-only">Rated</span>{rating.avg.toFixed(1)}
      {showCount && <span className="font-normal text-muted">({rating.count} review{rating.count > 1 ? 's' : ''})</span>}
    </span>
  );
}
