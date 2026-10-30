import mongoose from 'mongoose';
import Report from '../models/Report.js';
import Booking from '../models/Booking.js';
import Listing from '../models/Listing.js';

// POST /api/reports { booking? | listing?, title, details }
// From a booking: guest reports host or host reports guest. From a room page: reports the room's host.
export async function createReport(req, res) {
  const { booking: bookingId, listing: listingId, title, details } = req.body;
  let fields;

  if (bookingId) {
    if (!mongoose.isValidObjectId(bookingId)) return res.status(404).json({ message: 'Booking not found' });
    const booking = await Booking.findById(bookingId);
    const isGuest = booking && String(booking.guest) === String(req.user._id);
    const isHost = booking && String(booking.host) === String(req.user._id);
    if (!isGuest && !isHost) return res.status(404).json({ message: 'Booking not found' });
    fields = {
      booking: booking._id,
      listing: booking.listing,
      against: isGuest ? booking.host : booking.guest,
      type: isGuest ? 'guest_to_host' : 'host_to_guest',
    };
  } else if (listingId) {
    if (!mongoose.isValidObjectId(listingId)) return res.status(404).json({ message: 'Room not found' });
    const listing = await Listing.findOne({ _id: listingId, status: 'approved' });
    if (!listing) return res.status(404).json({ message: 'Room not found' });
    if (String(listing.host) === String(req.user._id)) return res.status(400).json({ message: 'You cannot report your own room' });
    fields = { listing: listing._id, against: listing.host, type: 'guest_to_host' };
  } else {
    return res.status(400).json({ message: 'Say which booking or room this is about' });
  }

  const report = await Report.create({ ...fields, reporter: req.user._id, title, details });
  res.status(201).json(report);
}
