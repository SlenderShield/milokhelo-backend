/**
 * Notification Service - Business logic for notifications
 */
class NotificationService {
  constructor(notificationRepository, logger) {
    this.notificationRepository = notificationRepository;
    this.logger = logger.child({ context: 'NotificationService' });
  }

  async getUserNotifications(userId, limit = 50, skip = 0) {
    this.logger.debug({ userId, limit, skip }, 'Fetching user notifications');
    return this.notificationRepository.findByUserId(userId, limit, skip);
  }

  async markAsRead(notificationId) {
    this.logger.debug({ notificationId }, 'Marking notification as read');
    return this.notificationRepository.markAsRead(notificationId);
  }

  async registerDeviceToken(userId, token, platform) {
    this.logger.info({ userId, platform }, 'Registering device token');
    return this.notificationRepository.createDeviceToken({ userId, token, platform });
  }
}

export default NotificationService;
