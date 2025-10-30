/**
 * User Routes
 */
import express from 'express';
import { requireAuth, validate } from '@/core/http/index.js';
import {
  friendIdValidation,
  searchUsersValidation,
  updateUserValidation,
  userIdValidation,
} from '@/common/validation/userValidation.js';
export function createUserRoutes(userController) {
  const router = express.Router();

  // Current user routes
  router.get('/me', requireAuth(), userController.getMe());
  router.put('/me', requireAuth(), validate(updateUserValidation), userController.updateMe());
  router.patch(
    '/me',
    requireAuth(),
    validate(updateUserValidation),
    userController.createOrUpdateUser()
  );
  router.get('/me/achievements', requireAuth(), userController.getMyAchievements());

  // Search users
  router.get(
    '/search',
    requireAuth(),
    validate(searchUsersValidation),
    userController.searchUsers()
  );

  // Legacy route for backward compatibility
  router.get('/', requireAuth(), userController.searchUsers());
  router.post('/', requireAuth(), userController.createOrUpdateUser());

  // User details and stats
  router.get(
    '/:id/stats',
    requireAuth(),
    validate(userIdValidation),
    userController.getUserStats()
  );
  router.get(
    '/:id/achievements',
    requireAuth(),
    validate(userIdValidation),
    userController.getUserAchievements()
  );
  router.get(
    '/:id/friends',
    requireAuth(),
    validate(userIdValidation),
    userController.getUserFriends()
  );

  // Friend management
  router.post(
    '/:friendId/friend',
    requireAuth(),
    validate(friendIdValidation),
    userController.addFriend()
  );
  router.delete(
    '/:friendId/friend',
    requireAuth(),
    validate(friendIdValidation),
    userController.removeFriend()
  );

  return router;
}
