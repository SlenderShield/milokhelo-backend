/**
 * Notification Controller
 */
import { asyncHandler, HTTP_STATUS } from '@/core/http/index.js';

class NotificationController {
  constructor(notificationService, logger) {
    this.notificationService = notificationService;
    this.logger = logger.child({ context: 'NotificationController' });
  }

  getNotifications() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      const { limit, skip } = req.query;
      const notifications = await this.notificationService.getUserNotifications(userId, limit, skip);
      res.status(HTTP_STATUS.OK).json(notifications);
    });
  }

  markAsRead() {
    return asyncHandler(async (req, res) => {
      const { id } = req.params;
      const notification = await this.notificationService.markAsRead(id);
      res.status(HTTP_STATUS.OK).json(notification);
    });
  }

  registerPushToken() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      const { token, platform } = req.body;
      const deviceToken = await this.notificationService.registerDeviceToken(userId, token, platform);
      res.status(HTTP_STATUS.CREATED).json(deviceToken);
    });
  }
}

export default NotificationController;
