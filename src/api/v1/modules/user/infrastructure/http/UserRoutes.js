/**
 * User Routes
 */
import express from 'express';

export function createUserRoutes(userController) {
  const router = express.Router();

  router.get('/me', userController.getMe());
  router.get('/', userController.searchUsers());
  router.post('/', userController.createOrUpdateUser());
  router.get('/:id/stats', userController.getUserStats());

  return router;
}
