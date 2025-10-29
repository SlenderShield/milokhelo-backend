/**
 * User Service
 */
class UserService {
  constructor(userRepository, eventBus, logger) {
    this.userRepository = userRepository;
    this.eventBus = eventBus;
    this.logger = logger.child({ context: 'UserService' });
  }

  async getUserProfile(userId) {
    return this.userRepository.findById(userId);
  }

  async searchUsers(searchTerm, filters) {
    return this.userRepository.search(searchTerm, filters);
  }

  async updateProfile(userId, data) {
    const user = await this.userRepository.update(userId, data);
    await this.eventBus.publish('user.profile_updated', { userId, data });
    return user;
  }

  async getUserStats(userId) {
    return this.userRepository.getUserStats(userId);
  }

  async updateUserStats(userId, sport, stats) {
    const updatedStats = await this.userRepository.updateStats(userId, sport, stats);
    await this.eventBus.publish('user.stats_updated', { userId, sport, stats: updatedStats });
    return updatedStats;
  }

  async getUserAchievements(userId) {
    return this.userRepository.getAchievements(userId);
  }

  async awardAchievement(userId, achievementId) {
    const user = await this.userRepository.addAchievement(userId, achievementId);
    await this.eventBus.publish('user.achievement_awarded', { userId, achievementId });
    return user;
  }
}

export default UserService;
