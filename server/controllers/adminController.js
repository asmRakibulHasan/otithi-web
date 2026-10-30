import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Listing from '../models/Listing.js';
import District from '../models/District.js';
import Village from '../models/Village.js';
import { ID_DIR } from '../middleware/upload.js';

const STATUSES = ['approved', 'rejected'];

// GET /api/admin/stats
export async function stats(req, res) {
  const [verifiedHosts, verifiedTravellers, pendingUsers, pendingListings, liveListings, districts, villages] = await Promise.all([
    User.countDocuments({ role: 'host', status: 'approved' }),
    User.countDocuments({ role: 'traveller', status: 'approved' }),
    User.countDocuments({ role: { $ne: 'admin' }, status: 'pending' }),
    Listing.countDocuments({ status: 'pending' }),
    Listing.countDocuments({ status: 'approved' }),
    District.countDocuments(),
    Village.countDocuments(),
  ]);
  res.json({ verifiedHosts, verifiedTravellers, pendingUsers, pendingListings, liveListings, districts, villages });
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
