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
    // Handle streak separately as it has special logic
    const { streak, ...incrementStats } = stats;

    const options = { new: true, upsert: true };

    if (streak !== undefined) {
      // Get current stats to determine streak update logic
      const currentStats = await UserStatModel.findOne({ userId, sport });

      let newStreak;
      if (!currentStats) {
        // New stat record
        newStreak = streak;
      } else {
        const currentStreak = currentStats.streak || 0;

        if (streak > 0) {
          // Win: increment if positive, start new positive streak if negative
          newStreak = currentStreak > 0 ? currentStreak + 1 : 1;
        } else if (streak < 0) {
          // Loss: decrement if negative, start new negative streak if positive
          newStreak = currentStreak < 0 ? currentStreak - 1 : -1;
        } else {
          // Draw: keep current streak
          newStreak = currentStreak;
        }
      }

      return UserStatModel.findOneAndUpdate(
        { userId, sport },
        { $inc: incrementStats, $set: { streak: newStreak } },
        options
      ).lean();
    }

    // No streak update, just increment other stats
    return UserStatModel.findOneAndUpdate(
      { userId, sport },
      { $inc: incrementStats },
      options
    ).lean();
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

  async getFriends(userId) {
    const user = await this.UserModel.findById(userId)
      .populate('friends', 'username name email avatar bio sportsPreferences location')
      .lean();
    return user?.friends || [];
  }

  async addFriend(userId, friendId) {
    return this.UserModel.findByIdAndUpdate(
      userId,
      { $addToSet: { friends: friendId } },
      { new: true }
    ).lean();
  }

  async removeFriend(userId, friendId) {
    return this.UserModel.findByIdAndUpdate(
      userId,
      { $pull: { friends: friendId } },
      { new: true }
    ).lean();
  }
}

export default UserRepository;
