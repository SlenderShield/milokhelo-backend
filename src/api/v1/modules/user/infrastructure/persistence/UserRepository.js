/**
 * User Repository Implementation
 */
import UserStatModel from './UserStatModel.js';

class UserRepository {
  constructor(logger, UserModel) {
    this.logger = logger.child({ context: 'UserRepository' });
    this.UserModel = UserModel;
  }

  async findById(id) {
    return this.UserModel.findById(id).lean();
  }

  async find(query = {}) {
    return this.UserModel.find(query).lean();
  }

  async search(searchTerm, filters = {}) {
    const query = {
      $or: [
        { username: new RegExp(searchTerm, 'i') },
        { name: new RegExp(searchTerm, 'i') },
        { email: new RegExp(searchTerm, 'i') },
      ],
      ...filters,
    };
    return this.UserModel.find(query).lean();
  }

  async update(id, data) {
    return this.UserModel.findByIdAndUpdate(id, data, { new: true }).lean();
  }

  async getUserStats(userId) {
    return UserStatModel.find({ userId }).lean();
  }

  async updateStats(userId, sport, stats) {
    return UserStatModel.findOneAndUpdate({ userId, sport }, { $inc: stats }, { new: true, upsert: true }).lean();
  }

  async getAchievements(userId) {
    const user = await this.UserModel.findById(userId).populate('achievements').lean();
    return user?.achievements || [];
  }

  async addAchievement(userId, achievementId) {
    return this.UserModel.findByIdAndUpdate(
      userId,
      { $addToSet: { achievements: achievementId } },
      { new: true }
    ).lean();
  }
}

export default UserRepository;
