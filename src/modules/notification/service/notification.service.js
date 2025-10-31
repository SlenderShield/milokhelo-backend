/**
 * Notification Service - Business logic for notifications
 */
class NotificationService {
  constructor(notificationRepository, pushNotificationService, eventBus, logger) {
    this.notificationRepository = notificationRepository;
    this.pushNotificationService = pushNotificationService;
    this.eventBus = eventBus;
    this.logger = logger.child({ context: 'NotificationService' });
  }

  /**
   * Get user's notifications
   * @param {string} userId - User ID
   * @param {number} limit - Maximum number of notifications
   * @param {number} skip - Number to skip for pagination
   * @param {boolean} unreadOnly - Return only unread notifications
   * @returns {Promise<Array>} Array of notifications
   */
  async getUserNotifications(userId, limit = 50, skip = 0, unreadOnly = false) {
    this.logger.debug({ userId, limit, skip, unreadOnly }, 'Fetching user notifications');
    return this.notificationRepository.findByUserId(userId, limit, skip, unreadOnly);
  }

  /**
   * Get notification by ID
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Object>} Notification
   */
  async getNotificationById(notificationId, userId) {
    this.logger.debug({ notificationId, userId }, 'Fetching notification by ID');
    const notification = await this.notificationRepository.findById(notificationId);

    if (!notification) {
      const error = new Error('Notification not found');
      error.statusCode = 404;
      throw error;
    }

    // Check if the notification belongs to the requesting user
    if (notification.userId.toString() !== userId) {
      const error = new Error('Not authorized to view this notification');
      error.statusCode = 403;
      throw error;
    }

    return notification;
  }

  /**
   * Create and send a notification
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Object>} Created notification
   */
  async createNotification(notificationData) {
    this.logger.info(
      { userId: notificationData.userId, type: notificationData.type },
      'Creating notification'
    );

    // Create notification in database
    const notification = await this.notificationRepository.create(notificationData);

    // Send push notification if available
    if (this.pushNotificationService.isAvailable()) {
      try {
        const deviceTokens = await this.notificationRepository.getUserDeviceTokens(
          notificationData.userId
        );

        if (deviceTokens && deviceTokens.length > 0) {
          await this.pushNotificationService.sendToMultipleDevices(
            deviceTokens,
            {
              id: notification._id,
              title: notificationData.title,
              message: notificationData.message,
              type: notificationData.type,
              priority: notificationData.priority || 'normal',
            },
            {
              relatedEntityId: notificationData.relatedEntityId?.toString(),
            }
          );
          this.logger.info({ notificationId: notification._id }, 'Push notification sent');
        }
      } catch (error) {
        // Don't fail the notification creation if push fails
        this.logger.warn({ error: error.message }, 'Failed to send push notification');
      }
    }

    // Publish notification event
    await this.eventBus.publish('notification.created', {
      notificationId: notification._id,
      userId: notificationData.userId,
      type: notificationData.type,
    });

    return notification;
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Object>} Updated notification
   */
  async markAsRead(notificationId, userId) {
    this.logger.debug({ notificationId, userId }, 'Marking notification as read');

    // Verify notification belongs to user
    const notification = await this.notificationRepository.findById(notificationId);
    if (!notification) {
      const error = new Error('Notification not found');
      error.statusCode = 404;
      throw error;
    }

    if (notification.userId.toString() !== userId) {
      const error = new Error('Not authorized to modify this notification');
      error.statusCode = 403;
      throw error;
    }

    return this.notificationRepository.markAsRead(notificationId);
  }

  /**
   * Mark all user notifications as read
   * @param {string} userId - User ID
   * @returns {Promise<number>} Number of notifications marked as read
   */
  async markAllAsRead(userId) {
    this.logger.info({ userId }, 'Marking all notifications as read');
    return this.notificationRepository.markAllAsRead(userId);
  }

  /**
   * Register device token for push notifications
   * @param {string} userId - User ID
   * @param {string} token - Device token
   * @param {string} platform - Platform (ios, android, web)
   * @param {string} deviceId - Optional device identifier
   * @returns {Promise<Object>} Created/updated device token
   */
  async registerDeviceToken(userId, token, platform, deviceId = null) {
    this.logger.info({ userId, platform }, 'Registering device token');
    return this.notificationRepository.createDeviceToken({
      userId,
      token,
      platform,
      deviceId,
    });
  }

  /**
   * Unregister device token
   * @param {string} userId - User ID
   * @param {string} token - Device token
   * @returns {Promise<void>}
   */
  async unregisterDeviceToken(userId, token) {
    this.logger.info({ userId }, 'Unregistering device token');
    return this.notificationRepository.deleteDeviceToken(userId, token);
  }

  /**
   * Get unread notification count
   * @param {string} userId - User ID
   * @returns {Promise<number>} Unread count
   */
  async getUnreadCount(userId) {
    return this.notificationRepository.getUnreadCount(userId);
  }

  /**
   * Delete notification
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<void>}
   */
  async deleteNotification(notificationId, userId) {
    this.logger.info({ notificationId, userId }, 'Deleting notification');

    // Verify notification belongs to user
    const notification = await this.notificationRepository.findById(notificationId);
    if (!notification) {
      const error = new Error('Notification not found');
      error.statusCode = 404;
      throw error;
    }

    if (notification.userId.toString() !== userId) {
      const error = new Error('Not authorized to delete this notification');
      error.statusCode = 403;
      throw error;
    }

    return this.notificationRepository.delete(notificationId);
  }

  /**
   * Send push notification to topic (for announcements, etc.)
   * @param {string} topic - Topic name
   * @param {Object} notification - Notification data
   * @returns {Promise<string>} Message ID
   */
  async sendToTopic(topic, notification) {
    if (!this.pushNotificationService.isAvailable()) {
      throw new Error('Push notification service is not available');
    }

    this.logger.info({ topic }, 'Sending notification to topic');
    return this.pushNotificationService.sendToTopic(topic, notification);
  }
}

export default NotificationService;
