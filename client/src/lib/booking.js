// Booking dates are stored as UTC midnight, so always format them in UTC.
export const fmtDay = (d, opts = { weekday: 'short', day: 'numeric', month: 'short' }) =>
  d ? new Date(d).toLocaleDateString('en-GB', { timeZone: 'UTC', ...opts }) : '';

export const fmtRange = (a, b) =>
  `${fmtDay(a, { weekday: 'short', day: 'numeric', month: 'short' })} – ${fmtDay(b, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}`;

// Today as "YYYY-MM-DD" in the viewer's local time (for <input type="date" min>)
export const todayInput = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// UTC Date → "YYYY-MM-DD"
export const dayKey = (d) => new Date(d).toISOString().slice(0, 10);

export const nightsBetween = (a, b) => {
  const n = Math.round((new Date(b) - new Date(a)) / 86400000);
  return n > 0 ? n : 0;
};

export const STATUS = {
  requested: { label: 'Waiting for host', tone: 'warn' },
  accepted: { label: 'Accepted', tone: 'good' },
  completed: { label: 'Completed', tone: 'none' },
  declined: { label: 'Declined', tone: 'bad' },
  cancelled: { label: 'Cancelled', tone: 'bad' },
};

// Today in Bangladesh (UTC+6) as "YYYY-MM-DD" — the server uses the same day for booking rules
export const todayBD = () => new Date(Date.now() + 6 * 3600000).toISOString().slice(0, 10);

export const isPast = (d) => new Date(d) < new Date(todayInput() + 'T00:00:00Z');
