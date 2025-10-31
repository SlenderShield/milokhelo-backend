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

  async getUserFriends(userId) {
    return this.userRepository.getFriends(userId);
  }

  async addFriend(userId, friendId) {
    if (userId === friendId) {
      throw new Error('Cannot add yourself as a friend');
    }

    // Check if friend exists
    const friend = await this.userRepository.findById(friendId);
    if (!friend) {
      throw new Error('User not found');
    }

    // Check if already friends
    const friends = await this.userRepository.getFriends(userId);
    const isFriend = friends.some((f) => f.id === friendId || f._id?.toString() === friendId);
    if (isFriend) {
      throw new Error('Already friends with this user');
    }

    // Add friend bidirectionally
    await this.userRepository.addFriend(userId, friendId);
    await this.userRepository.addFriend(friendId, userId);

    await this.eventBus.publish('user.friend_added', { userId, friendId });

    return { message: 'Friend added successfully', friendId };
  }

  async removeFriend(userId, friendId) {
    if (userId === friendId) {
      throw new Error('Invalid friend ID');
    }

    // Remove friend bidirectionally
    await this.userRepository.removeFriend(userId, friendId);
    await this.userRepository.removeFriend(friendId, userId);

    await this.eventBus.publish('user.friend_removed', { userId, friendId });

    return { message: 'Friend removed successfully', friendId };
  }
}

export default UserService;
