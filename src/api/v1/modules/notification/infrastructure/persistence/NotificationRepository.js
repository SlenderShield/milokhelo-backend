/**
 * Notification Repository
 */
import { NotificationModel, DeviceTokenModel } from './NotificationModel.js';

class NotificationRepository {
  constructor(logger) {
    this.logger = logger.child({ context: 'NotificationRepository' });
  }

  async create(data) {
    const notification = new NotificationModel(data);
    await notification.save();
    return notification.toObject();
  }

  async findById(id) {
    return NotificationModel.findById(id).lean();
  }

  async findByUserId(userId, limit = 50, skip = 0) {
    return NotificationModel.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();
  }

  async findUnread(userId, limit = 50) {
    return NotificationModel.find({ userId, readAt: null })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  async markAsRead(id) {
    return NotificationModel.findByIdAndUpdate(
      id,
      { readAt: new Date(), delivered: true },
      { new: true }
    ).lean();
  }

  async markAllAsRead(userId) {
    return NotificationModel.updateMany(
      { userId, readAt: null },
      { readAt: new Date(), delivered: true }
    );
  }

  async delete(id) {
    return NotificationModel.findByIdAndDelete(id);
  }

  async deleteExpired() {
    return NotificationModel.deleteMany({
      expiresAt: { $lt: new Date() },
    });
  }

  // Device Token Management
  async createDeviceToken(data) {
    const deviceToken = new DeviceTokenModel(data);
    await deviceToken.save();
    return deviceToken.toObject();
  }

  async findUserDeviceTokens(userId) {
    return DeviceTokenModel.find({ userId, active: true }).lean();
  }

  async deactivateDeviceToken(token) {
    return DeviceTokenModel.findOneAndUpdate(
      { token },
      { active: false },
      { new: true }
    ).lean();
  }
}

export default NotificationRepository;
