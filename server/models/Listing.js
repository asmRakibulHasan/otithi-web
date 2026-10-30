import mongoose from 'mongoose';

// The six fixed questions every host must answer (Honest Room Condition Checklist)
export const CHECKLIST = {
  toilet: ['attached', 'outside', 'shared'],
  electricity: ['steady', 'loadshedding', 'solar'],
  water: ['tap', 'tubewell', 'pond'],
  network: ['good', 'weak', 'none'],
  bedding: ['provided', 'bring_own'],
  road: ['vehicle', 'short_walk', 'long_walk'],
};

export const SAFETY_KEYS = ['familyOnSite', 'femaleMembersPresent', 'separateEntrance', 'soloFemaleOk', 'childrenOk'];

const checklistSchema = new mongoose.Schema(
  Object.fromEntries(
    Object.entries(CHECKLIST).map(([key, values]) => [key, { type: String, enum: values, required: [true, `Answer the ${key} question`] }])
  ),
  { _id: false }
);

const safetySchema = new mongoose.Schema(
  Object.fromEntries(SAFETY_KEYS.map((key) => [key, { type: Boolean, default: false }])),
  { _id: false }
);

const listingSchema = new mongoose.Schema(
  {
    host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    village: { type: mongoose.Schema.Types.ObjectId, ref: 'Village', required: [true, 'Choose a village'] },
    title: { type: String, required: [true, 'Add a title'], trim: true, maxlength: 100 },
    description: { type: String, trim: true, default: '' },
    pricePerNight: { type: Number, required: [true, 'Add a price'], min: [1, 'Price must be more than 0'] },
    capacity: { type: Number, required: true, min: [1, 'Capacity must be at least 1'] },
    rooms: { type: Number, default: 1, min: 1 },
    beds: { type: String, trim: true, default: '' }, // e.g. "2 double beds"
    meals: { type: Boolean, default: false }, // home-cooked meals on request
    photos: [{ type: String }],
    checklist: { type: checklistSchema, required: true },
    safety: { type: safetySchema, default: () => ({}) },
    // Full directions: shown only after a booking is accepted
    directions: { type: String, required: [true, 'Write directions from the nearest bazar'], trim: true },
    nearestLandmark: { type: String, required: [true, 'Add the nearest landmark'], trim: true },
    nearestBazar: { type: String, trim: true, default: '' },
    houseRules: [{ type: String, trim: true }],
    blockedDates: [{ type: Date }],
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
);

listingSchema.index({ status: 1, village: 1 });

export default mongoose.model('Listing', listingSchema);
