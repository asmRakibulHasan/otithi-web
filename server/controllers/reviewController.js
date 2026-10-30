import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Booking from '../models/Booking.js';

// { "<listingId>": { avg, count, accuratePct } } from guests' reviews
export async function listingRatings(listingIds) {
  const rows = await Review.aggregate([
    { $match: { type: 'guest_to_host', listing: { $in: listingIds.map((id) => new mongoose.Types.ObjectId(String(id))) } } },
    {
      $group: {
        _id: '$listing',
        avg: { $avg: '$rating' },
        count: { $sum: 1 },
        accurate: { $sum: { $cond: [{ $eq: ['$checklistAccurate', 'yes'] }, 1, 0] } },
      },
    },
  ]);
  return Object.fromEntries(rows.map((r) => [String(r._id), {
    avg: Math.round(r.avg * 10) / 10,
    count: r.count,
    accuratePct: Math.round((r.accurate / r.count) * 100),
  }]));
}

// { "<guestId>": { avg, count, latest } } from hosts' reviews of guests
export async function guestRatings(guestIds) {
  const ids = guestIds.map((id) => new mongoose.Types.ObjectId(String(id)));
  const rows = await Review.aggregate([
    { $match: { type: 'host_to_guest', target: { $in: ids } } },
    { $sort: { createdAt: -1 } },
    { $group: { _id: '$target', avg: { $avg: '$rating' }, count: { $sum: 1 }, latest: { $first: '$comment' } } },
  ]);
  return Object.fromEntries(rows.map((r) => [String(r._id), { avg: Math.round(r.avg * 10) / 10, count: r.count, latest: r.latest }]));
}

// POST /api/reviews { booking, rating, comment, checklistAccurate } — after a completed stay
export async function createReview(req, res) {
  const { booking: bookingId, comment = '', checklistAccurate } = req.body;
  const rating = Number(req.body.rating);

  if (!mongoose.isValidObjectId(bookingId)) return res.status(400).json({ message: 'Choose a booking' });
  const booking = await Booking.findById(bookingId);
  const isGuest = booking && String(booking.guest) === String(req.user._id);
  const isHost = booking && String(booking.host) === String(req.user._id);
  if (!isGuest && !isHost) return res.status(404).json({ message: 'Booking not found' });
  if (booking.status !== 'completed') return res.status(400).json({ message: 'You can review after the stay is completed' });
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ message: 'Choose a rating from 1 to 5' });
  if (isGuest && !['yes', 'mostly', 'no'].includes(checklistAccurate)) {
    return res.status(400).json({ message: 'Tell us if the condition checklist was accurate' });
  }

  const type = isGuest ? 'guest_to_host' : 'host_to_guest';
  if (await Review.exists({ booking: booking._id, type })) return res.status(409).json({ message: 'You already reviewed this stay' });

  const review = await Review.create({
    booking: booking._id,
    listing: booking.listing,
    author: req.user._id,
    target: isGuest ? booking.host : booking.guest,
    type,
    rating,
    comment: String(comment).slice(0, 1000),
    ...(isGuest && { checklistAccurate }),
  });
  res.status(201).json(review);
}

// GET /api/reviews/listing/:id — public guest reviews of a room + summary
export async function listingReviews(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Room not found' });
  const [reviews, ratings] = await Promise.all([
    Review.find({ listing: req.params.id, type: 'guest_to_host' })
      .populate('author', 'name')
      .populate('booking', 'checkIn guests')
      .sort('-createdAt')
      .lean(),
    listingRatings([req.params.id]),
  ]);
  res.json({ summary: ratings[req.params.id] || { avg: null, count: 0, accuratePct: null }, reviews });
}

// GET /api/reviews/guest/:id — hosts' reviews of a guest (for hosts deciding on a request)
export async function guestReviews(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Guest not found' });
  const reviews = await Review.find({ target: req.params.id, type: 'host_to_guest' })
    .populate('author', 'name')
    .sort('-createdAt')
    .lean();
  res.json(reviews);
}
