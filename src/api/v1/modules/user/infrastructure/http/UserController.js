/**
 * User Controller
 */
import { asyncHandler, HTTP_STATUS } from '../../../../../core/http/index.js';

class UserController {
  constructor(userService, logger) {
    this.userService = userService;
    this.logger = logger.child({ context: 'UserController' });
  }

  getMe() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Not authenticated' });
      }
      const user = await this.userService.getUserProfile(userId);
      res.status(HTTP_STATUS.OK).json(user);
    });
  }

  searchUsers() {
    return asyncHandler(async (req, res) => {
      const { q, sport } = req.query;
      const filters = sport ? { sportsPreferences: sport } : {};
      const users = await this.userService.searchUsers(q || '', filters);
      res.status(HTTP_STATUS.OK).json(users);
    });
  }

  createOrUpdateUser() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Not authenticated' });
      }
      const user = await this.userService.updateProfile(userId, req.body);
      res.status(HTTP_STATUS.OK).json(user);
    });
  }

  getUserStats() {
    return asyncHandler(async (req, res) => {
      const { id } = req.params;
      const stats = await this.userService.getUserStats(id);
      res.status(HTTP_STATUS.OK).json(stats);
    });
  }

  getMyAchievements() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Not authenticated' });
      }
      const achievements = await this.userService.getUserAchievements(userId);
      res.status(HTTP_STATUS.OK).json(achievements);
    });
  }

  getUserAchievements() {
    return asyncHandler(async (req, res) => {
      const { id } = req.params;
      const achievements = await this.userService.getUserAchievements(id);
      res.status(HTTP_STATUS.OK).json(achievements);
    });
  }
}

export default UserController;
