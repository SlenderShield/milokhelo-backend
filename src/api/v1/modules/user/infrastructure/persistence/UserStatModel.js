/**
 * User Stats Model
 */
import mongoose from 'mongoose';

const userStatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
    },
    sport: {
      type: String,
      required: true,
    },
    matchesPlayed: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
    goalsScored: { type: Number, default: 0 },
    assists: { type: Number, default: 0 },
    fouls: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    elo: { type: Number, default: 1000 },
    streak: { type: Number, default: 0 },
    rank: Number,
    level: { type: Number, default: 1 },
  },
  { timestamps: true }
);

userStatSchema.index({ userId: 1, sport: 1 }, { unique: true });
userStatSchema.index({ elo: -1 });
userStatSchema.index({ rating: -1 });

const UserStatModel = mongoose.model('UserStat', userStatSchema);

export default UserStatModel;
