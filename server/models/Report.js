import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    against: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', default: null },
    type: { type: String, enum: ['guest_to_host', 'host_to_guest'], required: true },
    title: { type: String, required: [true, 'Add a short title'], trim: true, maxlength: 120 },
    details: { type: String, required: [true, 'Describe what happened'], trim: true, maxlength: 2000 },
    status: { type: String, enum: ['open', 'resolved'], default: 'open' },
    resolvedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model('Report', reportSchema);
