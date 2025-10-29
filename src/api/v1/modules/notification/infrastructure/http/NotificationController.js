/**
 * Notification Controller
 */
import { asyncHandler, HTTP_STATUS } from '@/core/http/index.js';

class NotificationController {
  constructor(notificationService, logger) {
    this.notificationService = notificationService;
    this.logger = logger.child({ context: 'NotificationController' });
  }

  /**
   * Get user's notifications
   */
  getNotifications() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      const { limit, skip, unreadOnly } = req.query;
      const notifications = await this.notificationService.getUserNotifications(
        userId,
        limit,
        skip,
        unreadOnly
      );
      res.status(HTTP_STATUS.OK).json(notifications);
    });
  }

  /**
   * Get unread notification count
   */
  getUnreadCount() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      const count = await this.notificationService.getUnreadCount(userId);
      res.status(HTTP_STATUS.OK).json({ count });
    });
  }

  /**
   * Mark notification as read
   */
  markAsRead() {
    return asyncHandler(async (req, res) => {
      const { id } = req.params;
      const notification = await this.notificationService.markAsRead(id);
      res.status(HTTP_STATUS.OK).json(notification);
    });
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      const result = await this.notificationService.markAllAsRead(userId);
      res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: 'All notifications marked as read',
        count: result.modifiedCount || result.nModified || 0,
      });
    });
  }

  /**
   * Register push notification token
   */
  registerPushToken() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      const { token, platform, deviceId } = req.body;
      const deviceToken = await this.notificationService.registerDeviceToken(
        userId,
        token,
        platform,
        deviceId
      );
      res.status(HTTP_STATUS.CREATED).json(deviceToken);
    });
  }

  /**
   * Unregister push notification token
   */
  unregisterPushToken() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      const { token } = req.body;
      await this.notificationService.unregisterDeviceToken(userId, token);
      res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: 'Device token unregistered successfully',
      });
    });
  }

  /**
   * Delete notification
   */
  deleteNotification() {
    return asyncHandler(async (req, res) => {
      const { id } = req.params;
      await this.notificationService.deleteNotification(id);
      res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: 'Notification deleted successfully',
      });
    });
  }
}

export default NotificationController;
