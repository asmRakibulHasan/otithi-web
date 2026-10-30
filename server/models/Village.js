import mongoose from 'mongoose';

const villageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    district: { type: mongoose.Schema.Types.ObjectId, ref: 'District', required: true },
    area: { type: String, trim: true, default: '' }, // e.g. "Jaflong, Gowainghat"
    nearestBazar: { type: String, trim: true, default: '' },
    landmark: { type: String, trim: true, default: '' },
    photo: { type: String, default: null },
  },
  { timestamps: true }
);

villageSchema.index({ name: 1, district: 1 }, { unique: true });

export default mongoose.model('Village', villageSchema);
