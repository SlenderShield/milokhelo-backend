/**
 * User Routes
 */
import express from 'express';

export function createUserRoutes(userController) {
  const router = express.Router();

  // Current user routes
  router.get('/me', userController.getMe());
  router.put('/me', userController.updateMe());
  router.patch('/me', userController.createOrUpdateUser());
  router.get('/me/achievements', userController.getMyAchievements());

  // Search users
  router.get('/search', userController.searchUsers());

  // Legacy route for backward compatibility
  router.get('/', userController.searchUsers());
  router.post('/', userController.createOrUpdateUser());

  // User details and stats
  router.get('/:id/stats', userController.getUserStats());
  router.get('/:id/achievements', userController.getUserAchievements());
  router.get('/:id/friends', userController.getUserFriends());

  // Friend management
  router.post('/:friendId/friend', userController.addFriend());
  router.delete('/:friendId/friend', userController.removeFriend());

  return router;
}
