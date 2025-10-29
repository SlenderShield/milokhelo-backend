/**
 * Notification Models
 * Mongoose models for notifications and device tokens
 */
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    category: { type: String, enum: ['match', 'tournament', 'booking', 'system', 'social'] },
    payload: mongoose.Schema.Types.Mixed,
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    actionType: String,
    actionUrl: String,
    delivered: { type: Boolean, default: false },
    readAt: Date,
    expiresAt: Date,
  },
  { timestamps: true }
);

const deviceTokenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true },
    platform: { type: String, enum: ['ios', 'android'], required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const NotificationModel = mongoose.model('Notification', notificationSchema);
export const DeviceTokenModel = mongoose.model('DeviceToken', deviceTokenSchema);
export default NotificationModel;
