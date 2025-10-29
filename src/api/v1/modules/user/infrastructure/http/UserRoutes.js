/**
 * User Routes
 */
import express from 'express';

export function createUserRoutes(userController) {
  const router = express.Router();

  router.get('/me', userController.getMe());
  router.patch('/me', userController.createOrUpdateUser());
  router.get('/me/achievements', userController.getMyAchievements());
  router.get('/', userController.searchUsers());
  router.post('/', userController.createOrUpdateUser());
  router.get('/:id/stats', userController.getUserStats());
  router.get('/:id/achievements', userController.getUserAchievements());

  return router;
}
