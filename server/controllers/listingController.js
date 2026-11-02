import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import Listing, { CHECKLIST, SAFETY_KEYS } from '../models/Listing.js';
import Village from '../models/Village.js';
import Booking from '../models/Booking.js';
import BookedNight from '../models/BookedNight.js';
import { listingRatings } from './reviewController.js';
import { PHOTO_DIR } from '../middleware/upload.js';
import { todayBD, parseDay, dayKey, nightsOf } from '../lib/dates.js';
import { busyListings } from '../lib/bookedNights.js';
import { reviewSnapshot, changedSince } from '../lib/listingReview.js';

const MAX_PHOTOS = 10;
// Admin-only bookkeeping that travellers never need to see
const INTERNAL_FIELDS = ['lastApproved', 'changedFields', 'needsReview'];

const list = (value) => String(value).split(',').map((s) => s.trim()).filter(Boolean);

const parseJSON = (value, fallback) => {
  if (value === undefined || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const removeFiles = (files = []) => files.forEach((f) => fs.unlink(f.path, () => {}));
const photoUrl = (file) => `/uploads/${file.filename}`;
// Delete a stored room photo ("/uploads/abc.jpg") from disk
const deletePhoto = (url) => {
  if (String(url).startsWith('/uploads/')) fs.unlink(path.join(PHOTO_DIR, path.basename(url)), () => {});
};

// Turn a multipart body into listing fields (nested objects arrive as JSON strings).
function readListingBody(body) {
  const fields = {};
  for (const key of ['title', 'description', 'beds', 'directions', 'nearestLandmark', 'nearestBazar', 'village']) {
    if (body[key] !== undefined) fields[key] = body[key];
  }
  for (const key of ['pricePerNight', 'capacity', 'rooms']) {
    if (body[key] !== undefined) fields[key] = Number(body[key]);
  }
  if (body.meals !== undefined) fields.meals = body.meals === 'true' || body.meals === true;
  if (body.checklist !== undefined) fields.checklist = parseJSON(body.checklist, {});
  if (body.safety !== undefined) {
    const safety = parseJSON(body.safety, {});
    fields.safety = Object.fromEntries(SAFETY_KEYS.map((k) => [k, Boolean(safety[k])]));
  }
  if (body.houseRules !== undefined) {
    const rules = parseJSON(body.houseRules, []);
    fields.houseRules = (Array.isArray(rules) ? rules : []).map(String).filter((r) => r.trim());
  }
  return fields;
}

// GET /api/listings — public search over approved listings
// Query: district, village, minPrice, maxPrice, guests, checkIn, checkOut,
//        toilet, electricity, water, network, bedding, road (comma lists),
//        soloFemaleOk, childrenOk, separateEntrance, familyOnSite, femaleMembersPresent (=true)
export async function searchListings(req, res) {
  const q = req.query;
  const filter = { status: 'approved' };

  if (q.village) {
    if (!mongoose.isValidObjectId(q.village)) return res.json([]);
    filter.village = q.village;
  } else if (q.district) {
    if (!mongoose.isValidObjectId(q.district)) return res.json([]);
    const villages = await Village.find({ district: q.district }).distinct('_id');
    filter.village = { $in: villages };
  }

  if (q.minPrice || q.maxPrice) {
    filter.pricePerNight = {};
    if (q.minPrice) filter.pricePerNight.$gte = Number(q.minPrice);
    if (q.maxPrice) filter.pricePerNight.$lte = Number(q.maxPrice);
  }

  for (const key of Object.keys(CHECKLIST)) {
    if (q[key]) filter[`checklist.${key}`] = { $in: list(q[key]) };
  }
  for (const key of SAFETY_KEYS) {
    if (q[key] === 'true') filter[`safety.${key}`] = true;
  }

  // Hide rooms that are already booked, or blocked by the host, inside the requested dates
  const from = parseDay(q.checkIn);
  const to = parseDay(q.checkOut);
  if (from && to && from < to) {
    filter.blockedDates = { $not: { $elemMatch: { $gte: from, $lt: to } } };
    filter._id = { $nin: await busyListings(from, to) };
  }

  const listings = await Listing.find(filter)
    .select(['-directions', '-blockedDates', ...INTERNAL_FIELDS.map((f) => `-${f}`)].join(' '))
    .populate({ path: 'village', select: 'name area nearestBazar district', populate: { path: 'district', select: 'name' } })
    .populate('host', 'name')
    .sort('pricePerNight')
    .lean();

  // A group can split across rooms, so a single listing doesn't need to fit everyone.
  // `guests` only marks which listings fit alone; the frontend uses it for the "fits your group" note.
  const guests = Number(q.guests) || 0;
  const ratings = await listingRatings(listings.map((l) => l._id));
  res.json(listings.map((l) => ({ ...l, rating: ratings[String(l._id)] || null, fitsGroup: !guests || l.capacity >= guests })));
}

// GET /api/listings/:id — approved listings for everyone; owner and admin also see pending ones
export async function getListing(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Room not found' });

  const listing = await Listing.findById(req.params.id)
    .populate({ path: 'village', populate: { path: 'district', select: 'name' } })
    .populate('host', 'name createdAt status')
    .lean();
  if (!listing) return res.status(404).json({ message: 'Room not found' });

  const isOwner = req.user && String(listing.host._id) === String(req.user._id);
  const isAdmin = req.user?.role === 'admin';
  if (listing.status !== 'approved' && !isOwner && !isAdmin) {
    return res.status(404).json({ message: 'Room not found' });
  }

  // Full directions are unlocked by an accepted booking (Phase 4)
  if (!isOwner && !isAdmin) {
    delete listing.directions;
    INTERNAL_FIELDS.forEach((f) => delete listing[f]);
  }

  const ratings = await listingRatings([listing._id]);
  res.json({ ...listing, rating: ratings[String(listing._id)] || null, canSeeDirections: Boolean(isOwner || isAdmin) });
}

// GET /api/listings/:id/availability — which days from today on can't be booked, as "YYYY-MM-DD".
// booked = nights of accepted stays (no guest details); blocked = days the host closed;
// myRequests = nights of the signed-in traveller's own open requests for this room.
export async function getAvailability(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Room not found' });
  const listing = await Listing.findById(req.params.id).select('host status blockedDates').lean();
  if (!listing) return res.status(404).json({ message: 'Room not found' });
  const isOwner = req.user && String(listing.host) === String(req.user._id);
  if (listing.status !== 'approved' && !isOwner && req.user?.role !== 'admin') {
    return res.status(404).json({ message: 'Room not found' });
  }

  const today = todayBD();
  const [nights, requests] = await Promise.all([
    BookedNight.find({ listing: listing._id, date: { $gte: today } }).select('date').sort('date').lean(),
    req.user?.role === 'traveller'
      ? Booking.find({ listing: listing._id, guest: req.user._id, status: 'requested', checkOut: { $gt: today } }).select('checkIn checkOut').lean()
      : [],
  ]);
  const future = (dates) => [...new Set(dates.filter((d) => d >= today).map(dayKey))].sort();

  res.json({
    today: dayKey(today),
    booked: future(nights.map((n) => n.date)),
    blocked: future(listing.blockedDates || []),
    myRequests: future(requests.flatMap((b) => nightsOf(b.checkIn, b.checkOut))),
  });
}

// GET /api/listings/mine — host's own rooms, any status
export async function myListings(req, res) {
  const listings = await Listing.find({ host: req.user._id })
    .populate({ path: 'village', select: 'name district', populate: { path: 'district', select: 'name' } })
    .sort('-createdAt')
    .lean();
  res.json(listings);
}

// POST /api/listings (multipart, photos[]) — goes to admin as pending
export async function createListing(req, res) {
  const fields = readListingBody(req.body);

  if (!req.files?.length) {
    return res.status(400).json({ message: 'Add at least one photo' });
  }
  if (!mongoose.isValidObjectId(fields.village) || !(await Village.exists({ _id: fields.village }))) {
    removeFiles(req.files);
    return res.status(400).json({ message: 'Choose a village from the list' });
  }

  try {
    const listing = await Listing.create({
      ...fields,
      host: req.user._id,
      photos: req.files.map((f) => `/uploads/${f.filename}`),
      status: 'pending',
    });
    res.status(201).json(listing);
  } catch (err) {
    removeFiles(req.files);
    throw err;
  }
}

// PUT /api/listings/:id/blocked-dates { dates: ['2026-12-16', ...] } — owner marks days unavailable
export async function setBlockedDates(req, res) {
  const listing = await Listing.findOne({ _id: req.params.id, host: req.user._id });
  if (!listing) return res.status(404).json({ message: 'Room not found' });
  if (!Array.isArray(req.body.dates)) return res.status(400).json({ message: 'dates must be a list' });

  const days = [...new Set(req.body.dates.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)))]
    .map((d) => new Date(`${d}T00:00:00Z`))
    .filter((d) => !isNaN(d));

  listing.blockedDates = days.sort((a, b) => a - b);
  await listing.save();
  res.json({ blockedDates: listing.blockedDates });
}

// Final photo list for an edit. `photoOrder` (JSON) lists kept photos by URL and new uploads
// as "new:<index>", in display order; the first one is the cover. Returns { photos } or { error }.
function orderPhotos(current, files, rawOrder) {
  const order = parseJSON(rawOrder, null);
  if (order === null) return { photos: [...current, ...files.map(photoUrl)] }; // no order sent: append
  if (!Array.isArray(order)) return { error: 'Invalid photo order' };

  const photos = [];
  const usedNew = new Set();
  for (const item of order) {
    const m = /^new:(\d+)$/.exec(String(item));
    if (m) {
      const i = Number(m[1]);
      if (i >= files.length || usedNew.has(i)) return { error: 'Invalid photo order' };
      usedNew.add(i);
      photos.push(photoUrl(files[i]));
    } else if (current.includes(item) && !photos.includes(item)) {
      photos.push(item);
    } else {
      return { error: 'Invalid photo order' };
    }
  }
  if (usedNew.size !== files.length) return { error: 'Invalid photo order' };
  return { photos };
}

// PUT /api/listings/:id (multipart: fields, photos[], photoOrder) — owner edits.
// - Pending room: stays pending.  Rejected room: goes back to pending (resubmitted).
// - Live room: stays live. If trust-related fields changed (title, checklist, safety,
//   directions, landmark, photos) it is flagged for the admin to double-check.
export async function updateListing(req, res) {
  const files = req.files || [];
  const fail = (status, message) => {
    removeFiles(files);
    return res.status(status).json({ message });
  };

  if (!mongoose.isValidObjectId(req.params.id)) return fail(404, 'Room not found');
  const listing = await Listing.findOne({ _id: req.params.id, host: req.user._id });
  if (!listing) return fail(404, 'Room not found');

  const fields = readListingBody(req.body);
  delete fields.village; // a room cannot move village

  const { photos, error } = orderPhotos(listing.photos, files, req.body.photoOrder);
  if (error) return fail(400, error);
  if (photos.length > MAX_PHOTOS) return fail(400, `A room can have up to ${MAX_PHOTOS} photos`);
  if (photos.length === 0 && listing.photos.length > 0) return fail(400, 'Keep at least one photo');
  const removed = listing.photos.filter((p) => !photos.includes(p));

  // Guests already accepted must still fit
  if (fields.capacity !== undefined && Number.isFinite(fields.capacity)) {
    const biggest = await Booking.findOne({ listing: listing._id, status: 'accepted', checkOut: { $gt: todayBD() } })
      .sort('-guests').select('guests').lean();
    if (biggest && fields.capacity < biggest.guests) {
      return fail(400, `An upcoming accepted booking has ${biggest.guests} guests, so the room must sleep at least ${biggest.guests}`);
    }
  }

  // Rooms approved before this feature existed have no snapshot yet: take it before changing anything
  if (listing.status === 'approved' && !listing.lastApproved) listing.lastApproved = reviewSnapshot(listing);

  try {
    listing.set(fields);
    listing.photos = photos;
    if (listing.status === 'rejected') listing.status = 'pending';
    if (listing.status === 'approved') {
      // Compared with the approved version, so undoing a change also clears the flag
      listing.changedFields = changedSince(listing.lastApproved, listing);
      listing.needsReview = listing.changedFields.length > 0;
    }
    await listing.save();
  } catch (err) {
    removeFiles(files);
    throw err;
  }

  removed.forEach(deletePhoto);
  res.json(listing);
}
