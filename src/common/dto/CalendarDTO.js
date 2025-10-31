/**
 * Calendar DTO (Data Transfer Object)
 * Transforms Calendar event data for safe client consumption
 */
import BaseDTO from './BaseDTO.js';

class CalendarDTO extends BaseDTO {
  static transformOne(event, options = {}) {
    if (!event) return null;

    const safe = {
      id: event._id?.toString(),
      userId: event.userId?.toString(),
      title: event.title,
      description: event.description,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      type: event.type,
      relatedId: event.relatedId?.toString(),
      relatedType: event.relatedType,
      isAllDay: event.isAllDay,
      recurrence: event.recurrence,
      reminders: event.reminders,
      googleEventId: options.isOwner ? event.googleEventId : undefined,
      source: event.source,
    };

    if (options.includeTimestamps) {
      safe.createdAt = event.createdAt;
      safe.updatedAt = event.updatedAt;
    }

    return this.clean(safe);
  }
}

export default CalendarDTO;
