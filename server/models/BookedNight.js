import mongoose from 'mongoose';

// One row per room per night of an accepted (or completed) stay.
// The unique index is the double-booking lock: MongoDB itself refuses a second
// row for the same room and night, even when two hosts click "Accept" at the same moment.
const bookedNightSchema = new mongoose.Schema({
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  date: { type: Date, required: true }, // UTC midnight of the night (same format as Booking.checkIn)
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
});

bookedNightSchema.index({ listing: 1, date: 1 }, { unique: true });
bookedNightSchema.index({ booking: 1 });

export default mongoose.model('BookedNight', bookedNightSchema);
