/**
 * Chat, Venue, and Other Modules - Consolidated Models and Stubs
 * This file contains comprehensive stubs for remaining modules
 */
import mongoose from 'mongoose';

// ==================== CHAT MODELS ====================
export const chatRoomSchema = new mongoose.Schema(
  {
    name: String,
    type: { type: String, enum: ['match', 'tournament', 'team', 'dm', 'group'], required: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    lastMessage: String,
    lastMessageAt: Date,
    mutedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const chatMessageSchema = new mongoose.Schema(
  {
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom', required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    messageType: { type: String, enum: ['text', 'image', 'video', 'system'], default: 'text' },
    attachments: [String],
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatMessage' },
    reactions: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        emoji: String,
      },
    ],
    deleted: { type: Boolean, default: false },
    editedAt: Date,
  },
  { timestamps: true }
);

// ==================== VENUE MODELS ====================
export const venueSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number], // [lng, lat]
    },
    sportsSupported: [String],
    amenities: [String],
    contact: {
      phone: String,
      email: String,
    },
    images: [String],
    rating: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'inactive', 'pending', 'banned'], default: 'pending' },
  },
  { timestamps: true }
);
venueSchema.index({ location: '2dsphere' });

export const bookingSchema = new mongoose.Schema(
  {
    venueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    sport: String,
    teamSize: Number,
    totalPrice: Number,
    notes: String,
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
  },
  { timestamps: true }
);

// ==================== MAP/LOCATION MODELS ====================
export const locationSchema = new mongoose.Schema(
  {
    entityType: { type: String, enum: ['match', 'tournament'], required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    address: String,
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number],
    },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// ==================== CALENDAR/EVENT MODELS ====================
export const eventSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    date: { type: Date, required: true },
    relatedTo: {
      type: { type: String, enum: ['match', 'tournament', 'booking'] },
      id: mongoose.Schema.Types.ObjectId,
    },
    syncedWithMobile: { type: Boolean, default: false },
    externalCalendarId: String,
  },
  { timestamps: true }
);

// ==================== NOTIFICATION MODELS ====================
export const notificationSchema = new mongoose.Schema(
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

export const deviceTokenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true },
    platform: { type: String, enum: ['ios', 'android'], required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ==================== INVITATION MODELS ====================
export const invitationSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['match', 'tournament', 'team'], required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    message: String,
    status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
    expiresAt: Date,
  },
  { timestamps: true }
);

// ==================== FEEDBACK MODELS ====================
export const feedbackSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['bug', 'suggestion', 'report'], required: true },
    message: { type: String, required: true },
    relatedTo: {
      type: { type: String, enum: ['match', 'tournament', 'venue', 'user'] },
      id: mongoose.Schema.Types.ObjectId,
    },
    status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
  },
  { timestamps: true }
);

// Create and export models
export const ChatRoomModel = mongoose.model('ChatRoom', chatRoomSchema);
export const ChatMessageModel = mongoose.model('ChatMessage', chatMessageSchema);
export const VenueModel = mongoose.model('Venue', venueSchema);
export const BookingModel = mongoose.model('Booking', bookingSchema);
export const LocationModel = mongoose.model('Location', locationSchema);
export const EventModel = mongoose.model('Event', eventSchema);
export const NotificationModel = mongoose.model('Notification', notificationSchema);
export const DeviceTokenModel = mongoose.model('DeviceToken', deviceTokenSchema);
export const InvitationModel = mongoose.model('Invitation', invitationSchema);
export const FeedbackModel = mongoose.model('Feedback', feedbackSchema);
