import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../api/axios.js';
import Card from './Card.jsx';
import { ErrorBox } from './State.jsx';
import { errorMessage } from '../lib/listing.js';
import { dayKey, todayInput } from '../lib/booking.js';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const dayStyle = {
  booked: 'bg-paddy text-white',
  requested: 'bg-mustard-soft text-mustard-ink ring-1 ring-mustard',
  blocked: 'bg-neutral-soft text-neutral-ink line-through',
  free: 'bg-white hover:bg-paddy-soft',
  past: 'bg-transparent text-[#B0A894]',
};

// Month view of one room. Tap a free day to block it, tap a blocked day to free it.
export default function HostCalendar({ rooms, bookings, onChange }) {
  const [roomId, setRoomId] = useState(rooms[0]?._id || '');
  const [month, setMonth] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [blocked, setBlocked] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const room = rooms.find((r) => r._id === roomId);
  useEffect(() => setBlocked((room?.blockedDates || []).map(dayKey)), [room]);

  // day key → 'booked' | 'requested' for this room
  const taken = useMemo(() => {
    const map = {};
    bookings.filter((b) => b.listing?._id === roomId && ['accepted', 'requested'].includes(b.status)).forEach((b) => {
      for (let t = new Date(b.checkIn).getTime(); t < new Date(b.checkOut).getTime(); t += 86400000) {
        const k = dayKey(t);
        if (map[k] !== 'booked') map[k] = b.status === 'accepted' ? 'booked' : 'requested';
      }
    });
    return map;
  }, [bookings, roomId]);

  const today = todayInput();
  const first = new Date(Date.UTC(month.y, month.m, 1));
  const daysInMonth = new Date(Date.UTC(month.y, month.m + 1, 0)).getUTCDate();
  const cells = [
    ...Array(first.getUTCDay()).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => dayKey(Date.UTC(month.y, month.m, i + 1))),
  ];

  const stateOf = (k) => (k < today ? 'past' : taken[k] || (blocked.includes(k) ? 'blocked' : 'free'));

  const toggle = async (k) => {
    const next = blocked.includes(k) ? blocked.filter((x) => x !== k) : [...blocked, k];
    setBlocked(next);
    setSaving(true);
    setError('');
    try {
      await api.put(`/listings/${roomId}/blocked-dates`, { dates: next });
      onChange?.();
    } catch (err) {
      setError(errorMessage(err));
      setBlocked(blocked);
    } finally {
      setSaving(false);
    }
  };

  const shift = (n) => setMonth(({ y, m }) => { const d = new Date(y, m + n, 1); return { y: d.getFullYear(), m: d.getMonth() }; });

  if (!rooms.length) return null;

  return (
    <Card className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Availability</h2>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => shift(-1)} aria-label="Previous month" className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-sand"><ChevronLeft size={20} /></button>
          <span className="min-w-[140px] text-center font-semibold">{first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</span>
          <button type="button" onClick={() => shift(1)} aria-label="Next month" className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-sand"><ChevronRight size={20} /></button>
        </div>
      </div>
      <div>
        <label className="label" htmlFor="cal-room">Room</label>
        <select id="cal-room" className="input" value={roomId} onChange={(e) => setRoomId(e.target.value)}>
          {rooms.map((r) => <option key={r._id} value={r._id}>{r.title}</option>)}
        </select>
        <p className="mt-1 text-[13px] text-muted">Tap a free date to block it. {saving && 'Saving…'}</p>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center">
        {WEEKDAYS.map((w) => <div key={w} className="py-1 text-[13px] font-semibold text-muted">{w}</div>)}
        {cells.map((k, i) => {
          if (!k) return <div key={`e${i}`} />;
          const st = stateOf(k);
          const clickable = st === 'free' || st === 'blocked';
          return (
            <button key={k} type="button" disabled={!clickable || saving} onClick={() => toggle(k)}
              aria-label={`${new Date(k).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' })}, ${st}`}
              className={`flex aspect-square min-h-10 items-center justify-center rounded-xl text-[15px] font-semibold ${dayStyle[st]} ${clickable ? 'cursor-pointer' : 'cursor-default'}`}>
              {Number(k.slice(8))}
            </button>
          );
        })}
      </div>

      <ul className="flex flex-wrap gap-4 text-[13px]">
        {[['booked', 'Booked'], ['requested', 'Requested'], ['blocked', 'Blocked by you'], ['free', 'Free']].map(([k, l]) => (
          <li key={k} className="flex items-center gap-1.5"><span className={`h-4 w-4 rounded ${dayStyle[k]} border border-line`} />{l}</li>
        ))}
      </ul>
      <ErrorBox message={error} />
    </Card>
  );
}
