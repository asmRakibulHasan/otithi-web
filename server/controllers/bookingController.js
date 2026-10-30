import crypto from 'crypto';
import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Listing from '../models/Listing.js';
import Review from '../models/Review.js';
import { guestRatings } from './reviewController.js';

const DAY = 86400000;
const MAX_NIGHTS = 30;
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O or 1/I

// "2026-12-12" → Date at UTC midnight, or null
function parseDay(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return null;
  const d = new Date(`${value}T00:00:00Z`);
  return isNaN(d) ? null : d;
}

const todayUTC = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};

async function newCode() {
  for (;;) {
    const bytes = crypto.randomBytes(4);
    const code = 'OT-' + [...bytes].map((b) => CODE_CHARS[b % CODE_CHARS.length]).join('');
    if (!(await Booking.exists({ code }))) return code;
  }
}

// Accepted stays or host-blocked dates that overlap [checkIn, checkOut)
async function datesTaken(listing, checkIn, checkOut, ignoreId) {
  const clash = await Booking.exists({
    listing: listing._id,
    status: 'accepted',
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
    ...(ignoreId && { _id: { $ne: ignoreId } }),
  });
  if (clash) return 'These dates are already booked';
  if (listing.blockedDates.some((d) => d >= checkIn && d < checkOut)) return 'The host is not available on some of these dates';
  return '';
}

const listingFields = 'title photos pricePerNight capacity village nearestLandmark nearestBazar';
const villagePopulate = { path: 'village', select: 'name area district', populate: { path: 'district', select: 'name' } };

// Directions and the host's phone are shared only once the host accepts.
function withPrivateDetails(booking) {
  const b = booking.toObject ? booking.toObject() : booking;
  const unlocked = ['accepted', 'completed'].includes(b.status);
  if (!unlocked) {
    if (b.listing) delete b.listing.directions;
    if (b.host) delete b.host.phone;
  }
  return { ...b, unlocked };
}

async function findOwned(req, res, role) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ message: 'Booking not found' });
    return null;
  }
  const booking = await Booking.findOne({ _id: req.params.id, [role]: req.user._id });
  if (!booking) res.status(404).json({ message: 'Booking not found' });
  return booking;
}

// POST /api/bookings { listing, checkIn, checkOut, guests, message } — verified travellers
export async function createBooking(req, res) {
  const { listing: listingId, message = '' } = req.body;
  const checkIn = parseDay(req.body.checkIn);
  const checkOut = parseDay(req.body.checkOut);
  const guests = Number(req.body.guests);

  if (!mongoose.isValidObjectId(listingId)) return res.status(400).json({ message: 'Choose a room' });
  const listing = await Listing.findOne({ _id: listingId, status: 'approved' });
  if (!listing) return res.status(404).json({ message: 'Room not found' });

  if (!checkIn || !checkOut) return res.status(400).json({ message: 'Choose check-in and check-out dates' });
  if (checkIn < todayUTC()) return res.status(400).json({ message: 'Check-in cannot be in the past' });
  const nights = Math.round((checkOut - checkIn) / DAY);
  if (nights < 1) return res.status(400).json({ message: 'Check-out must be after check-in' });
  if (nights > MAX_NIGHTS) return res.status(400).json({ message: `You can request up to ${MAX_NIGHTS} nights` });
  if (!Number.isInteger(guests) || guests < 1) return res.status(400).json({ message: 'Choose the number of guests' });
  if (guests > listing.capacity) return res.status(400).json({ message: `This room sleeps up to ${listing.capacity}` });

  const taken = await datesTaken(listing, checkIn, checkOut);
  if (taken) return res.status(409).json({ message: taken });

  const duplicate = await Booking.exists({
    listing: listing._id, guest: req.user._id, status: { $in: ['requested', 'accepted'] },
    checkIn: { $lt: checkOut }, checkOut: { $gt: checkIn },
  });
  if (duplicate) return res.status(409).json({ message: 'You already have a request for this room on these dates' });

  const booking = await Booking.create({
    listing: listing._id, guest: req.user._id, host: listing.host,
    checkIn, checkOut, nights, guests, message: String(message).slice(0, 1000),
    totalPrice: nights * listing.pricePerNight,
  });
  res.status(201).json(booking);
}

// Set of booking ids this user has already reviewed
async function reviewedIds(userId, bookingIds) {
  const ids = await Review.find({ author: userId, booking: { $in: bookingIds } }).distinct('booking');
  return new Set(ids.map(String));
}

// GET /api/bookings/mine — the traveller's bookings
export async function myBookings(req, res) {
  const bookings = await Booking.find({ guest: req.user._id })
    .populate({ path: 'listing', select: `${listingFields} directions`, populate: villagePopulate })
    .populate('host', 'name phone')
    .sort('-checkIn');
  const reviewed = await reviewedIds(req.user._id, bookings.map((b) => b._id));
  res.json(bookings.map((b) => ({ ...withPrivateDetails(b), reviewedByMe: reviewed.has(String(b._id)) })));
}

// GET /api/bookings/:id — one booking, for its guest or host
export async function getBooking(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Booking not found' });
  const booking = await Booking.findOne({ _id: req.params.id, $or: [{ guest: req.user._id }, { host: req.user._id }] })
    .populate({ path: 'listing', select: `${listingFields} directions`, populate: villagePopulate })
    .populate('host', 'name phone')
    .populate('guest', 'name');
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  const reviewed = await reviewedIds(req.user._id, [booking._id]);
  res.json({ ...withPrivateDetails(booking), reviewedByMe: reviewed.has(String(booking._id)) });
}

// GET /api/bookings/host — all bookings for the host's rooms, with each guest's history
export async function hostBookings(req, res) {
  const bookings = await Booking.find({ host: req.user._id })
    .populate('listing', 'title pricePerNight')
    .populate('guest', 'name phone status createdAt')
    .sort('checkIn')
    .lean();

  // Past completed stays of each guest across all hosts, plus what hosts said about them
  const guestIds = [...new Set(bookings.map((b) => String(b.guest?._id)))].map((id) => new mongoose.Types.ObjectId(id));
  const history = await Booking.aggregate([
    { $match: { guest: { $in: guestIds }, status: 'completed' } },
    { $group: { _id: '$guest', stays: { $sum: 1 }, hosts: { $addToSet: '$host' } } },
  ]);
  const byGuest = Object.fromEntries(history.map((h) => [String(h._id), { stays: h.stays, hosts: h.hosts.length }]));
  const [ratings, reviewed] = await Promise.all([guestRatings(guestIds), reviewedIds(req.user._id, bookings.map((b) => b._id))]);

  res.json(bookings.map((b) => {
    const unlocked = ['accepted', 'completed'].includes(b.status);
    const guest = b.guest && { ...b.guest, phone: unlocked ? b.guest.phone : undefined };
    const gid = String(b.guest?._id);
    return {
      ...b,
      guest,
      guestHistory: { stays: 0, hosts: 0, ...byGuest[gid], reviews: ratings[gid] || { avg: null, count: 0, latest: null } },
      reviewedByMe: reviewed.has(String(b._id)),
    };
  }));
}

// PUT /api/bookings/:id/accept — host; issues the booking code
export async function acceptBooking(req, res) {
  const booking = await findOwned(req, res, 'host');
  if (!booking) return;
  if (booking.status !== 'requested') return res.status(400).json({ message: `This request is already ${booking.status}` });

  const listing = await Listing.findById(booking.listing);
  const taken = await datesTaken(listing, booking.checkIn, booking.checkOut, booking._id);
  if (taken) return res.status(409).json({ message: taken });

  booking.status = 'accepted';
  booking.code = await newCode();
  booking.acceptedAt = new Date();
  await booking.save();

  // The room is now taken on these dates: decline other overlapping requests
  await Booking.updateMany(
    { _id: { $ne: booking._id }, listing: booking.listing, status: 'requested', checkIn: { $lt: booking.checkOut }, checkOut: { $gt: booking.checkIn } },
    { status: 'declined' }
  );

  res.json(booking);
}

// PUT /api/bookings/:id/decline — host
export async function declineBooking(req, res) {
  const booking = await findOwned(req, res, 'host');
  if (!booking) return;
  if (booking.status !== 'requested') return res.status(400).json({ message: `This request is already ${booking.status}` });
  booking.status = 'declined';
  await booking.save();
  res.json(booking);
}

// PUT /api/bookings/:id/cancel — guest, before the stay starts
export async function cancelBooking(req, res) {
  const booking = await findOwned(req, res, 'guest');
  if (!booking) return;
  if (!['requested', 'accepted'].includes(booking.status)) return res.status(400).json({ message: `This booking is already ${booking.status}` });
  if (booking.checkIn < todayUTC()) return res.status(400).json({ message: 'The stay has already started' });
  booking.status = 'cancelled';
  booking.cancelledAt = new Date();
  await booking.save();
  res.json(booking);
}

// PUT /api/bookings/:id/complete { code } — host, after the guest shows the code and pays cash
export async function completeBooking(req, res) {
  const booking = await findOwned(req, res, 'host');
  if (!booking) return;
  if (booking.status !== 'accepted') return res.status(400).json({ message: 'Only accepted bookings can be completed' });
  if (booking.checkIn > todayUTC()) return res.status(400).json({ message: 'You can mark the stay completed from the check-in day' });

  // Accept "OT-7K2Q", "ot7k2q" or just "7K2Q"
  const code = 'OT-' + String(req.body.code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^OT/, '');
  if (code !== booking.code) return res.status(400).json({ message: 'The booking code does not match' });

  booking.status = 'completed';
  booking.completedAt = new Date();
  await booking.save();
  res.json(booking);
}
