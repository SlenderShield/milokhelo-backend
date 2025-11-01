/**
 * Match Model
 */
import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  venue: String,
  address: String,
  lat: Number,
  lng: Number,
  geo: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: [Number], // [lng, lat]
  },
});

const matchSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    sport: { type: String, required: true },
    sportCategory: String,
    type: { type: String, enum: ['friendly', 'competitive'], default: 'friendly' },
    organizerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startAt: { type: Date, required: true },
    endAt: Date,
    location: locationSchema,
    maxPlayers: Number,
    skillLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
    entryFee: Number,
    prize: String,
    teamBased: { type: Boolean, default: false },
    visibility: { type: String, enum: ['public', 'private'], default: 'public' },
    status: {
      type: String,
      enum: ['scheduled', 'live', 'finished', 'cancelled'],
      default: 'scheduled',
    },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
    scores: Map,
    chatRoomId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom' },
    cancelReason: String,
  },
  { timestamps: true }
);

matchSchema.index({ sport: 1, startAt: 1 });
matchSchema.index({ organizerId: 1 });
matchSchema.index({ status: 1 });
matchSchema.index({ 'location.geo': '2dsphere' });

const MatchModel = mongoose.model('Match', matchSchema);

export default MatchModel;
