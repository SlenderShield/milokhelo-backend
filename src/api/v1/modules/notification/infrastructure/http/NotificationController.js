/**
 * Notification Controller
 */
import { asyncHandler, HTTP_STATUS } from '@/core/http/index.js';
import { NotificationDTO } from '@/common/dto/index.js';

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
      const userId = req.user?.id || req.session?.userId;
      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      const { limit, skip, unreadOnly } = req.query;
      const notifications = await this.notificationService.getUserNotifications(
        userId,
        limit,
        skip,
        unreadOnly
      );
      const safeNotifications = notifications.map((n) => NotificationDTO.transformMinimal(n));
      res.status(HTTP_STATUS.OK).json({
        status: 'success',
        data: safeNotifications,
      });
    });
  }

  /**
   * Get notification by ID
   */
  getNotificationById() {
    return asyncHandler(async (req, res) => {
      const userId = req.user?.id || req.session?.userId;
      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      const { id } = req.params;
      const notification = await this.notificationService.getNotificationById(id, userId);
      const safeNotification = NotificationDTO.transform(notification, {
        includeTimestamps: true,
      });
      res.status(HTTP_STATUS.OK).json({
        status: 'success',
        data: safeNotification,
      });
    });
  }

  /**
   * Get unread notification count
   */
  getUnreadCount() {
    return asyncHandler(async (req, res) => {
      const userId = req.user?.id || req.session?.userId;
      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      const count = await this.notificationService.getUnreadCount(userId);
      res.status(HTTP_STATUS.OK).json({
        status: 'success',
        data: { count },
      });
    });
  }

  /**
   * Mark notification as read
   */
  markAsRead() {
    return asyncHandler(async (req, res) => {
      const userId = req.user?.id || req.session?.userId;
      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      const { id } = req.params;
      const notification = await this.notificationService.markAsRead(id, userId);
      const safeNotification = NotificationDTO.transform(notification, {
        includeTimestamps: true,
      });
      res.status(HTTP_STATUS.OK).json({
        status: 'success',
        data: safeNotification,
      });
    });
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead() {
    return asyncHandler(async (req, res) => {
      const userId = req.user?.id || req.session?.userId;
      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

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
      const userId = req.user?.id || req.session?.userId;
      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      const { token, platform, deviceId } = req.body;
      const deviceToken = await this.notificationService.registerDeviceToken(
        userId,
        token,
        platform,
        deviceId
      );
      res.status(HTTP_STATUS.CREATED).json({
        status: 'success',
        data: deviceToken,
      });
    });
  }

  /**
   * Unregister push notification token
   */
  unregisterPushToken() {
    return asyncHandler(async (req, res) => {
      const userId = req.user?.id || req.session?.userId;
      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

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
      const userId = req.user?.id || req.session?.userId;
      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      const { id } = req.params;
      await this.notificationService.deleteNotification(id, userId);
      res.status(HTTP_STATUS.NO_CONTENT).send();
    });
  }
}

export default NotificationController;
