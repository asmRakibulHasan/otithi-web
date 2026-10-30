import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
    guest: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Stored as UTC midnight of the chosen day; checkOut is the morning the guest leaves
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    nights: { type: Number, required: true, min: 1 },
    guests: { type: Number, required: true, min: 1 },
    message: { type: String, trim: true, maxlength: 1000, default: '' },
    totalPrice: { type: Number, required: true, min: 0 }, // paid in cash to the host
    status: {
      type: String,
      enum: ['requested', 'accepted', 'declined', 'cancelled', 'completed'],
      default: 'requested',
    },
    code: { type: String, default: undefined }, // e.g. OT-7K2Q, issued on accept
    acceptedAt: Date,
    completedAt: Date,
    cancelledAt: Date,
  },
  { timestamps: true }
);

bookingSchema.index({ code: 1 }, { unique: true, sparse: true });
bookingSchema.index({ listing: 1, status: 1, checkIn: 1 });

export default mongoose.model('Booking', bookingSchema);
