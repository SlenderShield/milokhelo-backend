/**
 * Venue Models
 * Mongoose models for venues and bookings
 */
import mongoose from 'mongoose';

const venueSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number], // [lng, lat]
    },
    sportsSupported: [String],
    amenities: [String],
    contact: {
      phone: String,
      email: String,
    },
    images: [String],
    rating: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'inactive', 'pending', 'banned'], default: 'pending' },
  },
  { timestamps: true }
);

// Geospatial index for location-based queries
venueSchema.index({ location: '2dsphere' });

const bookingSchema = new mongoose.Schema(
  {
    venueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    sport: String,
    teamSize: Number,
    totalPrice: Number,
    notes: String,
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
  },
  { 
    timestamps: true,
    optimisticConcurrency: true, // Enable versioning for optimistic locking
  }
);

// Compound index for efficient conflict checking
bookingSchema.index({ venueId: 1, date: 1, status: 1 });
// Index for quick time range queries
bookingSchema.index({ venueId: 1, date: 1, startTime: 1, endTime: 1 });

export const VenueModel = mongoose.model('Venue', venueSchema);
export const BookingModel = mongoose.model('Booking', bookingSchema);
export default VenueModel;
