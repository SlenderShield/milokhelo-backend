/**
 * Notification Routes
 */
import express from 'express';
import { requireAuth } from '@/core/http/middlewares/index.js';
import { validate } from '@/core/http/middlewares/index.js';
import {
  registerPushTokenValidation,
  markAsReadValidation,
  getNotificationsValidation,
} from '@/common/validation/index.js';

export function createNotificationRoutes(controller) {
  const router = express.Router();

  // All notification routes require authentication
  router.use(requireAuth());

  // Get notifications
  router.get('/', validate(getNotificationsValidation), controller.getNotifications());
  router.get('/unread/count', controller.getUnreadCount());

  // Mark as read
  router.patch('/:id/read', validate(markAsReadValidation), controller.markAsRead());
  router.patch('/read-all', controller.markAllAsRead());

  // Delete notification
  router.delete('/:id', validate(markAsReadValidation), controller.deleteNotification());

  // Device token management
  router.post('/push-token', validate(registerPushTokenValidation), controller.registerPushToken());
  router.delete('/push-token', controller.unregisterPushToken());

  return router;
}
