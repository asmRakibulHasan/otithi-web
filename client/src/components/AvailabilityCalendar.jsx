import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addDays, dayKey, fmtDay, nightsBetween, todayBD } from '../lib/booking.js';
import { nightState } from '../lib/availability.js';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MAX_NIGHTS = 30;

const stateStyle = {
  free: 'bg-white hover:bg-paddy-soft',
  booked: 'bg-danger-soft text-danger line-through',
  blocked: 'bg-neutral-soft text-neutral-ink line-through',
  mine: 'bg-mustard-soft text-mustard-ink ring-1 ring-inset ring-mustard',
  past: 'bg-transparent text-[#B0A894]',
};
const stateText = { free: 'available', booked: 'already booked', blocked: 'host not available', mine: 'you already requested this', past: 'past' };

const LEGEND = [
  ['booked', 'Booked'],
  ['blocked', 'Host away'],
  ['mine', 'Your request'],
];

// Month calendar for choosing a stay. Booked and unavailable nights can't be chosen,
// and a range can't cross them. value = { checkIn, checkOut } as "YYYY-MM-DD" ('' when not chosen).
export default function AvailabilityCalendar({ availability: av, value, onChange }) {
  const today = av?.today || todayBD();
  const { checkIn, checkOut } = value;
  const [month, setMonth] = useState(() => {
    const [y, m] = (checkIn || today).split('-').map(Number);
    return { y, m: m - 1 };
  });

  const choosingCheckOut = Boolean(checkIn && !checkOut);

  // Can [from, to) be booked? Every night must be free.
  const rangeFree = (from, to) => {
    const n = nightsBetween(from, to);
    if (n < 1 || n > MAX_NIGHTS) return false;
    for (let d = from; d < to; d = addDays(d, 1)) if (nightState(av, d) !== 'free') return false;
    return true;
  };

  // What clicking a day would do: 'in' (start a new stay), 'out' (finish it), or null (not allowed)
  const actionFor = (k) => {
    if (choosingCheckOut && k > checkIn && rangeFree(checkIn, k)) return 'out';
    return nightState(av, k) === 'free' ? 'in' : null;
  };

  const pick = (k) => {
    const action = actionFor(k);
    if (action === 'out') onChange({ checkIn, checkOut: k });
    else if (action === 'in') onChange({ checkIn: k, checkOut: '' });
  };

  const first = new Date(Date.UTC(month.y, month.m, 1));
  const daysInMonth = new Date(Date.UTC(month.y, month.m + 1, 0)).getUTCDate();
  const cells = [
    ...Array(first.getUTCDay()).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => dayKey(Date.UTC(month.y, month.m, i + 1))),
  ];
  const atFirstMonth = `${month.y}-${String(month.m + 1).padStart(2, '0')}` <= today.slice(0, 7);
  const shift = (n) => setMonth(({ y, m }) => {
    const d = new Date(Date.UTC(y, m + n, 1));
    return { y: d.getUTCFullYear(), m: d.getUTCMonth() };
  });

  const nights = nightsBetween(checkIn, checkOut);
  const hint = !checkIn
    ? 'Tap your check-in day'
    : choosingCheckOut
      ? `Check-in ${fmtDay(checkIn, { weekday: 'short', day: 'numeric', month: 'short' })} · now tap your check-out day`
      : `${fmtDay(checkIn, { day: 'numeric', month: 'short' })} – ${fmtDay(checkOut, { day: 'numeric', month: 'short' })} · ${nights} night${nights === 1 ? '' : 's'}`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={() => shift(-1)} disabled={atFirstMonth} aria-label="Previous month"
          className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-sand disabled:cursor-not-allowed disabled:opacity-30"><ChevronLeft size={20} /></button>
        <span className="font-semibold" aria-live="polite">{first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</span>
        <button type="button" onClick={() => shift(1)} aria-label="Next month"
          className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-sand"><ChevronRight size={20} /></button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((w) => <div key={w} className="py-1 text-[12px] font-semibold text-muted">{w}</div>)}
        {cells.map((k, i) => {
          if (!k) return <div key={`e${i}`} />;
          const st = nightState(av, k);
          const action = actionFor(k);
          const isEnd = k === checkIn || k === checkOut;
          const inRange = checkIn && checkOut && k > checkIn && k < checkOut;
          const look = isEnd ? 'bg-paddy text-white' : inRange ? 'bg-paddy-soft text-paddy' : stateStyle[st];
          const label = `${fmtDay(k, { weekday: 'long', day: 'numeric', month: 'long' })}, ${stateText[st]}${action === 'out' && st !== 'free' ? ', can be your check-out day' : ''}`;
          return (
            <button key={k} type="button" disabled={!action} onClick={() => pick(k)} aria-label={label} aria-pressed={Boolean(isEnd || inRange)}
              className={`flex aspect-square min-h-10 items-center justify-center rounded-xl text-[15px] font-semibold ${look} ${action ? 'cursor-pointer' : 'cursor-not-allowed'} ${action === 'out' && !isEnd ? 'hover:bg-paddy-soft hover:text-paddy hover:no-underline' : ''}`}>
              {Number(k.slice(8))}
            </button>
          );
        })}
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
        {LEGEND.map(([k, l]) => (
          <li key={k} className="flex items-center gap-1.5"><span className={`h-4 w-4 rounded border border-line ${stateStyle[k]}`} />{l}</li>
        ))}
      </ul>

      <div className="flex items-center justify-between gap-3 rounded-xl bg-ground px-3 py-2 text-sm">
        <span className="font-semibold">{hint}</span>
        {checkIn && <button type="button" className="font-semibold text-paddy hover:underline" onClick={() => onChange({ checkIn: '', checkOut: '' })}>Clear</button>}
      </div>
    </div>
  );
}
