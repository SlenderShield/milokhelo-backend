/**
 * Achievement Repository Implementation
 */
import AchievementModel from '../model/achievement.model.js';

class AchievementRepository {
  constructor(logger) {
    this.logger = logger.child({ context: 'AchievementRepository' });
    this.AchievementModel = AchievementModel;
  }

  /**
   * Find achievement by ID
   */
  async findById(id) {
    return this.AchievementModel.findById(id).lean();
  }

  /**
   * Find all achievements
   */
  async findAll(filters = {}) {
    return this.AchievementModel.find(filters).lean();
  }

  /**
   * Find achievements by category
   */
  async findByCategory(category) {
    return this.AchievementModel.find({ category }).lean();
  }

  /**
   * Find achievements by sport
   */
  async findBySport(sport) {
    return this.AchievementModel.find({
      $or: [{ sport }, { sport: 'all' }, { sport: { $exists: false } }],
    }).lean();
  }

  /**
   * Create a new achievement
   */
  async create(achievementData) {
    const achievement = new this.AchievementModel(achievementData);
    return achievement.save();
  }

  /**
   * Bulk create achievements
   */
  async bulkCreate(achievementsData) {
    return this.AchievementModel.insertMany(achievementsData, { ordered: false });
  }

  /**
   * Update achievement
   */
  async update(id, data) {
    return this.AchievementModel.findByIdAndUpdate(id, data, { new: true }).lean();
  }

  /**
   * Delete achievement
   */
  async delete(id) {
    return this.AchievementModel.findByIdAndDelete(id).lean();
  }

  /**
   * Check if achievement exists by name
   */
  async existsByName(name) {
    const count = await this.AchievementModel.countDocuments({ name });
    return count > 0;
  }
}

export default AchievementRepository;
