import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    target: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['guest_to_host', 'host_to_guest'], required: true },
    rating: { type: Number, required: [true, 'Choose a rating'], min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 1000, default: '' },
    // Guest's answer to "Was the condition checklist accurate?"
    checklistAccurate: { type: String, enum: ['yes', 'mostly', 'no'] },
  },
  { timestamps: true }
);

// One review per side per booking
reviewSchema.index({ booking: 1, type: 1 }, { unique: true });
reviewSchema.index({ listing: 1, type: 1 });
reviewSchema.index({ target: 1, type: 1 });

export default mongoose.model('Review', reviewSchema);
