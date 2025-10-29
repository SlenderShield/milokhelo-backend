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
    category: {
      type: String,
      enum: ['milestone', 'skill', 'participation', 'social', 'special'],
      default: 'milestone',
    },
    sport: {
      type: String,
      default: 'all', // 'all' means achievement applies to all sports
    },
    criteria: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    badgeUrl: String,
    rarity: {
      type: String,
      enum: ['common', 'rare', 'epic', 'legendary'],
      default: 'common',
    },
    points: { type: Number, default: 0 },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Indexes
achievementSchema.index({ category: 1 });
achievementSchema.index({ sport: 1 });
achievementSchema.index({ rarity: 1 });
achievementSchema.index({ isActive: 1 });

const AchievementModel = mongoose.model('Achievement', achievementSchema);

export default AchievementModel;
