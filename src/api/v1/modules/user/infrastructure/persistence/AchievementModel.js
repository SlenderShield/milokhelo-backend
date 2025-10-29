/**
 * Achievement Model
 */
import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: String,
    category: String,
    criteria: String,
    badgeUrl: String,
    rarity: {
      type: String,
      enum: ['common', 'rare', 'epic', 'legendary'],
      default: 'common',
    },
    points: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const AchievementModel = mongoose.model('Achievement', achievementSchema);

export default AchievementModel;
