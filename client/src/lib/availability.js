import { addDays, fmtDay, todayBD } from './booking.js';

// Availability from GET /api/listings/:id/availability → { today, booked, blocked, myRequests }
// Returns 'past' | 'booked' | 'blocked' | 'mine' | 'free' for one "YYYY-MM-DD" night.
export function nightState(av, key) {
  if (key < (av?.today || todayBD())) return 'past';
  if (!av) return 'free'; // still loading: the server re-checks anyway
  if (av.booked.includes(key)) return 'booked';
  if (av.blocked.includes(key)) return 'blocked';
  if (av.myRequests.includes(key)) return 'mine';
  return 'free';
}

// Message explaining why [checkIn, checkOut) can't be requested, or '' if the dates are free
export function rangeProblem(av, checkIn, checkOut) {
  if (!av || !checkIn || !checkOut || checkOut <= checkIn) return '';
  const taken = { booked: [], blocked: [], mine: [], past: [] };
  for (let d = checkIn; d < checkOut; d = addDays(d, 1)) {
    const st = nightState(av, d);
    if (st !== 'free') taken[st].push(d);
  }
  const days = (list) => list.slice(0, 3).map((d) => fmtDay(d, { day: 'numeric', month: 'short' })).join(', ') + (list.length > 3 ? ` and ${list.length - 3} more` : '');
  if (taken.past.length) return 'Check-in cannot be in the past';
  if (taken.booked.length) return `Already booked on ${days(taken.booked)}. Please choose other dates.`;
  if (taken.blocked.length) return `The host is not available on ${days(taken.blocked)}.`;
  if (taken.mine.length) return `You already sent a request for ${days(taken.mine)}.`;
  return '';
}
