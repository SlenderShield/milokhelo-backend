/**
 * Team Model
 */
import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    sport: {
      type: String,
      required: true,
    },
    description: String,
    captainId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['captain', 'member'], default: 'member' },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    joinCode: String,
    stats: {
      matchesPlayed: { type: Number, default: 0 },
      wins: { type: Number, default: 0 },
      losses: { type: Number, default: 0 },
      draws: { type: Number, default: 0 },
      rating: { type: Number, default: 0 },
      elo: { type: Number, default: 1000 },
    },
    avatar: String,
    isPrivate: { type: Boolean, default: false },
  },
  { timestamps: true }
);

teamSchema.index({ name: 1, sport: 1 });
teamSchema.index({ captainId: 1 });
teamSchema.index({ sport: 1 });

const TeamModel = mongoose.model('Team', teamSchema);

export default TeamModel;
