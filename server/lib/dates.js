// Booking dates are stored as UTC midnight of the chosen day.
export const DAY = 86400000;

// Otithi is Bangladesh-only, so "today" is the calendar day in Bangladesh (UTC+6)
const BD_OFFSET = 6 * 3600000;
export const todayBD = () => {
  const bd = new Date(Date.now() + BD_OFFSET);
  return new Date(Date.UTC(bd.getUTCFullYear(), bd.getUTCMonth(), bd.getUTCDate()));
};

// "2026-12-12" → Date at UTC midnight, or null
export function parseDay(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return null;
  const d = new Date(`${value}T00:00:00Z`);
  return isNaN(d) ? null : d;
}

// Date → "2026-12-12"
export const dayKey = (d) => new Date(d).toISOString().slice(0, 10);

// Every night of a stay: checkIn, checkIn + 1 day, … up to the night before checkOut
export function nightsOf(checkIn, checkOut) {
  const nights = [];
  for (let t = new Date(checkIn).getTime(); t < new Date(checkOut).getTime(); t += DAY) nights.push(new Date(t));
  return nights;
}
