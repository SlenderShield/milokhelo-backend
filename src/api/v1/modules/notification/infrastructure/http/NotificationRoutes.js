/**
 * Notification Routes
 */
import express from 'express';

export function createNotificationRoutes(controller) {
  const router = express.Router();
  router.get('/', controller.getNotifications());
  router.patch('/:id/read', controller.markAsRead());
  router.post('/push-token', controller.registerPushToken());
  return router;
}
