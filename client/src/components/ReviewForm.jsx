import { useState } from 'react';
import { Star } from 'lucide-react';
import api from '../api/axios.js';
import Button from './Button.jsx';
import { ErrorBox } from './State.jsx';
import { errorMessage } from '../lib/listing.js';

const ACCURACY = [
  { value: 'yes', label: 'Yes, exactly' },
  { value: 'mostly', label: 'Mostly' },
  { value: 'no', label: 'No, it was different' },
];

// Review after a completed stay. asGuest = also ask whether the checklist was accurate.
export default function ReviewForm({ bookingId, asGuest, onDone, onCancel }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [accurate, setAccurate] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) return setError('Choose a rating');
    if (asGuest && !accurate) return setError('Was the condition checklist accurate?');
    setBusy(true);
    setError('');
    try {
      await api.post('/reviews', { booking: bookingId, rating, comment, ...(asGuest && { checklistAccurate: accurate }) });
      onDone?.();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <fieldset>
        <legend className="label">{asGuest ? 'Your rating' : 'Rate this guest'}</legend>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer p-1" onMouseEnter={() => setHover(n)}>
              <input type="radio" name={`rating-${bookingId}`} value={n} checked={rating === n} onChange={() => setRating(n)} className="sr-only" />
              <Star size={30} aria-hidden="true" className={(hover || rating) >= n ? 'fill-mustard text-mustard' : 'text-field'} />
              <span className="sr-only">{n} star{n > 1 ? 's' : ''}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {asGuest && (
        <fieldset>
          <legend className="label">Was the condition checklist accurate?</legend>
          <div className="flex flex-wrap gap-2">
            {ACCURACY.map((a) => (
              <label key={a.value} className={`flex min-h-11 cursor-pointer items-center rounded-xl border-[1.5px] px-4 font-semibold ${accurate === a.value ? 'border-paddy bg-paddy-soft text-paddy' : 'border-field bg-white'}`}>
                <input type="radio" name={`acc-${bookingId}`} value={a.value} checked={accurate === a.value} onChange={() => setAccurate(a.value)} className="sr-only" />
                {a.label}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div>
        <label className="label" htmlFor={`rc-${bookingId}`}>{asGuest ? 'Your review' : 'A few words about the guest'}</label>
        <textarea id={`rc-${bookingId}`} rows={3} maxLength={1000} className="input py-3" value={comment} onChange={(e) => setComment(e.target.value)}
          placeholder={asGuest ? 'What was the stay like? Was anything different from the listing?' : 'Were they respectful of the house rules?'} />
      </div>
      <ErrorBox message={error} />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={busy}>{busy ? 'Posting…' : 'Post review'}</Button>
        {onCancel && <Button variant="ghost" onClick={onCancel}>Cancel</Button>}
      </div>
    </form>
  );
}
