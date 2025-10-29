/**
 * Calendar Models
 * Mongoose models for calendar events and Google Calendar tokens
 */
import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: String,
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    location: String,
    eventType: {
      type: String,
      enum: ['match', 'tournament', 'training', 'booking', 'other'],
      default: 'other',
    },
    relatedEntityId: mongoose.Schema.Types.ObjectId,
    allDay: { type: Boolean, default: false },
    // External calendar sync
    externalId: String,
    externalSource: { type: String, enum: ['google_calendar', 'device'] },
    url: String,
    status: String,
    syncedWithMobile: { type: Boolean, default: false },
    // Legacy field for backwards compatibility
    date: Date,
    relatedTo: {
      type: { type: String, enum: ['match', 'tournament', 'booking'] },
      id: mongoose.Schema.Types.ObjectId,
    },
  },
  { timestamps: true }
);

// Indexes
eventSchema.index({ userId: 1, startTime: 1 });
eventSchema.index({ externalId: 1, externalSource: 1 });

// Google Calendar tokens storage
const googleCalendarTokenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    accessToken: { type: String, required: true },
    refreshToken: String,
    scope: String,
    tokenType: String,
    expiryDate: Number,
  },
  { timestamps: true }
);

export const EventModel = mongoose.model('Event', eventSchema);
export const GoogleCalendarTokenModel = mongoose.model('GoogleCalendarToken', googleCalendarTokenSchema);
export default EventModel;
