/**
 * Calendar Models
 * Mongoose models for calendar events
 */
import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
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

export const EventModel = mongoose.model('Event', eventSchema);
export default EventModel;
