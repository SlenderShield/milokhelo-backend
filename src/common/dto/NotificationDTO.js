/**
 * Notification DTO (Data Transfer Object)
 * Transforms Notification model data for safe client consumption
 */
import BaseDTO from './BaseDTO.js';

class NotificationDTO extends BaseDTO {
  static transformOne(notification, options = {}) {
    if (!notification) return null;

    const safe = {
      id: notification._id?.toString(),
      userId: notification.userId?.toString(),
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      read: notification.read,
      readAt: notification.readAt,
      priority: notification.priority,
      actionUrl: notification.actionUrl,
      expiresAt: notification.expiresAt,
    };

    if (options.includeTimestamps) {
      safe.createdAt = notification.createdAt;
      safe.updatedAt = notification.updatedAt;
    }

    return this.clean(safe);
  }

  /**
   * Transform notification with minimal data (for notification bell/list)
   */
  static transformMinimal(notification) {
    if (!notification) return null;

    const obj = notification.toObject ? notification.toObject() : notification;

    return this.clean({
      id: obj._id?.toString(),
      type: obj.type,
      title: obj.title,
      message: obj.message,
      read: obj.read,
      createdAt: obj.createdAt,
    });
  }
}

export default NotificationDTO;
