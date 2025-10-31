/**
 * Notification Repository
 */
import { NotificationModel, DeviceTokenModel } from '../model/notification.model.js';

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

  async findByUserId(userId, limit = 50, skip = 0, unreadOnly = false) {
    const query = { userId };
    if (unreadOnly) {
      query.readAt = null;
    }
    
    return NotificationModel.find(query)
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

  async getUnreadCount(userId) {
    return NotificationModel.countDocuments({ userId, readAt: null });
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
    // Update existing token or create new one
    const existingToken = await DeviceTokenModel.findOne({
      userId: data.userId,
      token: data.token,
    });

    if (existingToken) {
      existingToken.active = true;
      existingToken.lastUsed = new Date();
      await existingToken.save();
      return existingToken.toObject();
    }

    const deviceToken = new DeviceTokenModel(data);
    await deviceToken.save();
    return deviceToken.toObject();
  }

  async getUserDeviceTokens(userId) {
    const tokens = await DeviceTokenModel.find({ userId, active: true }).lean();
    return tokens.map(t => ({ token: t.token, platform: t.platform }));
  }

  async findUserDeviceTokens(userId) {
    return DeviceTokenModel.find({ userId, active: true }).lean();
  }

  async deleteDeviceToken(userId, token) {
    return DeviceTokenModel.findOneAndDelete({ userId, token });
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
