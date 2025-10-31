/**
 * User Controller
 */
import { asyncHandler, HTTP_STATUS } from '@/core/http/index.js';
import { UserDTO, UserStatDTO, AchievementDTO } from '@/common/dto/index.js';

class UserController {
  constructor(userService, logger) {
    this.userService = userService;
    this.logger = logger.child({ context: 'UserController' });
  }

  getMe() {
    return asyncHandler(async (req, res) => {
      this.logger.info('Fetching current user profile', { user: req.user });
      const userId = req.user?.id || req.session?.userId;
      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Not authenticated' });
      }
      const user = await this.userService.getUserProfile(userId);
      const safeUser = UserDTO.transform(user, {
        isOwner: true,
        showPrivate: true,
        includeTimestamps: true,
      });
      res.status(HTTP_STATUS.OK).json(safeUser);
    });
  }

  searchUsers() {
    return asyncHandler(async (req, res) => {
      const { q, sport } = req.query;
      const filters = sport ? { sportsPreferences: sport } : {};
      const users = await this.userService.searchUsers(q || '', filters);
      const safeUsers = users.map((u) => UserDTO.transformForSearch(u));
      res.status(HTTP_STATUS.OK).json(safeUsers);
    });
  }

  createOrUpdateUser() {
    return asyncHandler(async (req, res) => {
      const userId = req.user?.id || req.session?.userId;
      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Not authenticated' });
      }
      const user = await this.userService.updateProfile(userId, req.body);
      const safeUser = UserDTO.transform(user, {
        isOwner: true,
        showPrivate: true,
        includeTimestamps: true,
      });
      res.status(HTTP_STATUS.OK).json(safeUser);
    });
  }

  getUserStats() {
    return asyncHandler(async (req, res) => {
      const { id } = req.params;
      const stats = await this.userService.getUserStats(id);
      const safeStats = Array.isArray(stats)
        ? UserStatDTO.transformMany(stats)
        : UserStatDTO.transform(stats, { includeTimestamps: true });
      res.status(HTTP_STATUS.OK).json(safeStats);
    });
  }

  getMyAchievements() {
    return asyncHandler(async (req, res) => {
      const userId = req.user?.id || req.session?.userId;
      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Not authenticated' });
      }
      const achievements = await this.userService.getUserAchievements(userId);
      const safeAchievements = AchievementDTO.transformMany(achievements);
      res.status(HTTP_STATUS.OK).json(safeAchievements);
    });
  }

  getUserAchievements() {
    return asyncHandler(async (req, res) => {
      const { id } = req.params;
      const achievements = await this.userService.getUserAchievements(id);
      const safeAchievements = AchievementDTO.transformMany(achievements);
      res.status(HTTP_STATUS.OK).json(safeAchievements);
    });
  }

  updateMe() {
    return asyncHandler(async (req, res) => {
      const userId = req.user?.id || req.session?.userId;
      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Not authenticated' });
      }
      const user = await this.userService.updateProfile(userId, req.body);
      const safeUser = UserDTO.transform(user, {
        isOwner: true,
        showPrivate: true,
        includeTimestamps: true,
      });
      res.status(HTTP_STATUS.OK).json(safeUser);
    });
  }

  getUserFriends() {
    return asyncHandler(async (req, res) => {
      const { id } = req.params;
      const friends = await this.userService.getUserFriends(id);
      const safeFriends = friends.map((f) => UserDTO.transformMinimal(f));
      res.status(HTTP_STATUS.OK).json(safeFriends);
    });
  }

  addFriend() {
    return asyncHandler(async (req, res) => {
      const userId = req.user?.id || req.session?.userId;
      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Not authenticated' });
      }
      const { friendId } = req.params;
      const result = await this.userService.addFriend(userId, friendId);
      res.status(HTTP_STATUS.OK).json(result);
    });
  }

  removeFriend() {
    return asyncHandler(async (req, res) => {
      const userId = req.user?.id || req.session?.userId;
      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Not authenticated' });
      }
      const { friendId } = req.params;
      const result = await this.userService.removeFriend(userId, friendId);
      res.status(HTTP_STATUS.OK).json(result);
    });
  }
}

export default UserController;
