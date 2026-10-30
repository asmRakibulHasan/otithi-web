import fs from 'fs';
import mongoose from 'mongoose';
import Listing, { CHECKLIST, SAFETY_KEYS } from '../models/Listing.js';
import Village from '../models/Village.js';

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

  // Hide rooms the host has blocked inside the requested dates
  if (q.checkIn && q.checkOut) {
    const from = new Date(q.checkIn);
    const to = new Date(q.checkOut);
    if (!isNaN(from) && !isNaN(to) && from < to) {
      filter.blockedDates = { $not: { $elemMatch: { $gte: from, $lt: to } } };
    }
  }

  const listings = await Listing.find(filter)
    .select('-directions -blockedDates')
    .populate({ path: 'village', select: 'name area nearestBazar district', populate: { path: 'district', select: 'name' } })
    .populate('host', 'name')
    .sort('pricePerNight')
    .lean();

  // A group can split across rooms, so a single listing doesn't need to fit everyone.
  // `guests` only marks which listings fit alone; the frontend uses it for the "fits your group" note.
  const guests = Number(q.guests) || 0;
  res.json(listings.map((l) => ({ ...l, fitsGroup: !guests || l.capacity >= guests })));
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
  if (!isOwner && !isAdmin) delete listing.directions;

  res.json({ ...listing, canSeeDirections: Boolean(isOwner || isAdmin) });
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

// PUT /api/listings/:id (multipart) — owner edits; new photos are added; goes back to pending
export async function updateListing(req, res) {
  const listing = await Listing.findOne({ _id: req.params.id, host: req.user._id });
  if (!listing) {
    removeFiles(req.files);
    return res.status(404).json({ message: 'Room not found' });
  }

  const fields = readListingBody(req.body);
  delete fields.village; // a room cannot move village

  try {
    listing.set(fields);
    if (req.files?.length) listing.photos.push(...req.files.map((f) => `/uploads/${f.filename}`));
    listing.status = 'pending';
    await listing.save();
    res.json(listing);
  } catch (err) {
    removeFiles(req.files);
    throw err;
  }
}
