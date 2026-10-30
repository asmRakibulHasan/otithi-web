import mongoose from 'mongoose';
import District from '../models/District.js';
import Village from '../models/Village.js';
import Listing from '../models/Listing.js';

// Households, rooms, capacity and starting price per village, from approved listings.
async function villageStats(match = {}) {
  const rows = await Listing.aggregate([
    { $match: { status: 'approved', ...match } },
    {
      $group: {
        _id: '$village',
        hosts: { $addToSet: '$host' },
        rooms: { $sum: '$rooms' },
        capacity: { $sum: '$capacity' },
        minPrice: { $min: '$pricePerNight' },
        listings: { $sum: 1 },
      },
    },
  ]);
  return Object.fromEntries(
    rows.map((r) => [String(r._id), { households: r.hosts.length, rooms: r.rooms, capacity: r.capacity, minPrice: r.minPrice, listings: r.listings }])
  );
}

const emptyStats = { households: 0, rooms: 0, capacity: 0, minPrice: null, listings: 0 };

// GET /api/districts
export async function listDistricts(req, res) {
  const districts = await District.find().sort('name').lean();
  const counts = await Village.aggregate([{ $group: { _id: '$district', n: { $sum: 1 } } }]);
  const byId = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));
  res.json(districts.map((d) => ({ ...d, villageCount: byId[String(d._id)] || 0 })));
}

// GET /api/villages?district=<id>
export async function listVillages(req, res) {
  const filter = {};
  if (req.query.district) {
    if (!mongoose.isValidObjectId(req.query.district)) return res.json([]);
    filter.district = req.query.district;
  }
  const [villages, stats] = await Promise.all([
    Village.find(filter).populate('district', 'name').sort('name').lean(),
    villageStats(),
  ]);
  res.json(villages.map((v) => ({ ...v, stats: stats[String(v._id)] || emptyStats })));
}

// GET /api/villages/:id — village + its approved listings
export async function getVillage(req, res) {
  const village = await Village.findById(req.params.id).populate('district', 'name').lean();
  if (!village) return res.status(404).json({ message: 'Village not found' });

  const [listings, stats] = await Promise.all([
    Listing.find({ village: village._id, status: 'approved' })
      .select('-directions -blockedDates')
      .populate('host', 'name createdAt')
      .sort('pricePerNight')
      .lean(),
    villageStats({ village: village._id }),
  ]);

  res.json({ ...village, stats: stats[String(village._id)] || emptyStats, listings });
}
