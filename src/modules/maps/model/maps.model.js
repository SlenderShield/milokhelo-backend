/**
 * Maps Models
 * Mongoose models for location data
 */
import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema(
  {
    entityType: { type: String, enum: ['match', 'tournament'], required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    address: String,
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number],
    },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const LocationModel = mongoose.model('Location', locationSchema);
export default LocationModel;
