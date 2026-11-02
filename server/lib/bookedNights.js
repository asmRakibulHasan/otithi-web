import BookedNight from '../models/BookedNight.js';
import Booking from '../models/Booking.js';
import { nightsOf, todayBD } from './dates.js';

export class NightsTakenError extends Error {
  constructor() {
    super('These dates are already booked');
    this.status = 409;
  }
}

// Lock every night of the booking for its room. Throws NightsTakenError if any night is
// already locked by another booking; in that case nothing stays locked for this booking.
export async function reserveNights(booking) {
  const rows = nightsOf(booking.checkIn, booking.checkOut).map((date) => ({ listing: booking.listing, date, booking: booking._id }));
  try {
    await BookedNight.insertMany(rows, { ordered: true });
  } catch (err) {
    await releaseNights(booking._id); // undo the nights inserted before the clash
    if (err.code === 11000 || err.writeErrors?.some((e) => e.code === 11000)) throw new NightsTakenError();
    throw err;
  }
}

export const releaseNights = (bookingId) => BookedNight.deleteMany({ booking: bookingId });

// Room ids that have a locked night inside [from, to)
export const busyListings = (from, to) => BookedNight.distinct('listing', { date: { $gte: from, $lt: to } });

// Run at start-up (and after seeding): make the lock table match the bookings.
// Adds rows for accepted/completed stays that are not over yet, and removes rows whose
// booking is no longer accepted/completed. Safe to run any number of times.
export async function syncBookedNights() {
  await BookedNight.init(); // wait until the unique index exists before anything relies on it
  const live = await Booking.find({ status: { $in: ['accepted', 'completed'] }, checkOut: { $gt: todayBD() } })
    .select('listing checkIn checkOut')
    .lean();

  await BookedNight.deleteMany({ booking: { $nin: live.map((b) => b._id) } });

  const ops = live.flatMap((b) => nightsOf(b.checkIn, b.checkOut).map((date) => ({
    updateOne: {
      filter: { listing: b.listing, date },
      update: { $setOnInsert: { booking: b._id } },
      upsert: true,
    },
  })));
  if (ops.length) await BookedNight.bulkWrite(ops, { ordered: false });
}
