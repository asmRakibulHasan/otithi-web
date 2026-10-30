import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Listing from '../models/Listing.js';
import District from '../models/District.js';
import Village from '../models/Village.js';
import Booking from '../models/Booking.js';
import Report from '../models/Report.js';
import { ID_DIR } from '../middleware/upload.js';

const STATUSES = ['approved', 'rejected'];

// GET /api/admin/stats
export async function stats(req, res) {
  const [verifiedHosts, verifiedTravellers, pendingUsers, pendingListings, liveListings, districts, villages,
    completedBookings, upcomingBookings, income, openReports] = await Promise.all([
    User.countDocuments({ role: 'host', status: 'approved' }),
    User.countDocuments({ role: 'traveller', status: 'approved' }),
    User.countDocuments({ role: { $ne: 'admin' }, status: 'pending' }),
    Listing.countDocuments({ status: 'pending' }),
    Listing.countDocuments({ status: 'approved' }),
    District.countDocuments(),
    Village.countDocuments(),
    Booking.countDocuments({ status: 'completed' }),
    Booking.countDocuments({ status: 'accepted' }),
    Booking.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, total: { $sum: '$totalPrice' } } }]),
    Report.countDocuments({ status: 'open' }),
  ]);
  res.json({
    verifiedHosts, verifiedTravellers, pendingUsers, pendingListings, liveListings, districts, villages,
    completedBookings, upcomingBookings, incomeToFamilies: income[0]?.total || 0, openReports,
  });
}

// GET /api/admin/users?status=pending&role=host
export async function listUsers(req, res) {
  const filter = { role: { $ne: 'admin' } };
  if (req.query.status) filter.status = req.query.status;
  if (['host', 'traveller'].includes(req.query.role)) filter.role = req.query.role;

  const users = await User.find(filter).populate('village', 'name').sort('-createdAt').lean();
  // idDocument is stripped by toJSON on documents; with lean() remove it by hand and expose a flag instead
  res.json(users.map(({ password, idDocument, __v, ...u }) => ({ ...u, hasIdDocument: Boolean(idDocument) })));
}

// GET /api/admin/users/:id/id-document — the private ID photo, admin only
export async function idDocument(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Not found' });
  const user = await User.findById(req.params.id).lean();
  if (!user?.idDocument) return res.status(404).json({ message: 'No ID document uploaded' });

  const file = path.join(ID_DIR, path.basename(user.idDocument));
  if (!fs.existsSync(file)) return res.status(404).json({ message: 'ID file is missing' });
  res.sendFile(file);
}

// PUT /api/admin/users/:id/status { status: approved | rejected }
export async function setUserStatus(req, res) {
  if (!STATUSES.includes(req.body.status)) return res.status(400).json({ message: 'Status must be approved or rejected' });
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'User not found' });

  const user = await User.findOneAndUpdate(
    { _id: req.params.id, role: { $ne: 'admin' } },
    { status: req.body.status },
    { returnDocument: 'after' }
  );
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
}

// GET /api/admin/listings?status=pending
export async function listListings(req, res) {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const listings = await Listing.find(filter)
    .populate('host', 'name status')
    .populate({ path: 'village', select: 'name district', populate: { path: 'district', select: 'name' } })
    .sort('-createdAt')
    .lean();
  res.json(listings);
}

// PUT /api/admin/listings/:id/status { status: approved | rejected }
export async function setListingStatus(req, res) {
  if (!STATUSES.includes(req.body.status)) return res.status(400).json({ message: 'Status must be approved or rejected' });
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Room not found' });

  const listing = await Listing.findById(req.params.id).populate('host', 'status');
  if (!listing) return res.status(404).json({ message: 'Room not found' });
  if (req.body.status === 'approved' && listing.host.status !== 'approved') {
    return res.status(400).json({ message: "Verify the host's ID before publishing their room" });
  }

  listing.status = req.body.status;
  await listing.save();
  res.json(listing);
}

// GET /api/admin/reports?status=open
export async function listReports(req, res) {
  const filter = {};
  if (['open', 'resolved'].includes(req.query.status)) filter.status = req.query.status;
  const reports = await Report.find(filter)
    .populate('reporter', 'name role')
    .populate('against', 'name role')
    .populate('booking', 'code checkIn checkOut status')
    .populate({ path: 'listing', select: 'title village', populate: { path: 'village', select: 'name' } })
    .sort('-createdAt')
    .lean();
  res.json(reports);
}

// PUT /api/admin/reports/:id/resolve
export async function resolveReport(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Report not found' });
  const report = await Report.findByIdAndUpdate(
    req.params.id,
    { status: 'resolved', resolvedAt: new Date() },
    { returnDocument: 'after' }
  );
  if (!report) return res.status(404).json({ message: 'Report not found' });
  res.json(report);
}

// GET /api/admin/locations — districts with their villages
export async function listLocations(req, res) {
  const [districts, villages, roomCounts] = await Promise.all([
    District.find().sort('name').lean(),
    Village.find().sort('name').lean(),
    Listing.aggregate([{ $group: { _id: '$village', n: { $sum: 1 } } }]),
  ]);
  const rooms = Object.fromEntries(roomCounts.map((r) => [String(r._id), r.n]));
  res.json(districts.map((d) => ({
    ...d,
    villages: villages.filter((v) => String(v.district) === String(d._id)).map((v) => ({ ...v, rooms: rooms[String(v._id)] || 0 })),
  })));
}

// POST /api/admin/districts { name }
export async function createDistrict(req, res) {
  const name = String(req.body.name || '').trim();
  if (!name) return res.status(400).json({ message: 'Enter a district name' });
  // strength 2 = compare ignoring upper/lower case
  if (await District.findOne({ name }).collation({ locale: 'en', strength: 2 }).lean()) {
    return res.status(409).json({ message: 'This district already exists' });
  }
  res.status(201).json(await District.create({ name }));
}

// DELETE /api/admin/districts/:id — only when it has no villages
export async function deleteDistrict(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'District not found' });
  if (await Village.exists({ district: req.params.id })) {
    return res.status(400).json({ message: 'Remove the villages in this district first' });
  }
  const district = await District.findByIdAndDelete(req.params.id);
  if (!district) return res.status(404).json({ message: 'District not found' });
  res.json({ ok: true });
}

// POST /api/admin/villages { name, district, area, nearestBazar, landmark }
export async function createVillage(req, res) {
  const { name, district, area = '', nearestBazar = '', landmark = '' } = req.body;
  if (!String(name || '').trim()) return res.status(400).json({ message: 'Enter a village name' });
  if (!mongoose.isValidObjectId(district) || !(await District.exists({ _id: district }))) {
    return res.status(400).json({ message: 'Choose a district' });
  }
  try {
    res.status(201).json(await Village.create({ name, district, area, nearestBazar, landmark }));
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'This village already exists in the district' });
    throw err;
  }
}

// DELETE /api/admin/villages/:id — only when no rooms use it
export async function deleteVillage(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Village not found' });
  if (await Listing.exists({ village: req.params.id })) {
    return res.status(400).json({ message: 'This village has rooms, so it cannot be removed' });
  }
  const village = await Village.findByIdAndDelete(req.params.id);
  if (!village) return res.status(404).json({ message: 'Village not found' });
  res.json({ ok: true });
}
