/**
 * Calendar Repository
 */
import { EventModel, GoogleCalendarTokenModel } from './CalendarModel.js';

class CalendarRepository {
  constructor(logger) {
    this.logger = logger.child({ context: 'CalendarRepository' });
  }

  /**
   * Create a calendar event
   * @param {Object} data - Event data
   * @returns {Promise<Object>} Created event
   */
  async create(data) {
    const event = new EventModel(data);
    await event.save();
    return event.toObject();
  }

  /**
   * Find events by user ID with optional filters
   * @param {string} userId - User ID
   * @param {Object} filters - Optional filters (startDate, endDate, eventType)
   * @returns {Promise<Array>} Array of events
   */
  async findByUserId(userId, filters = {}) {
    const query = { userId };

    if (filters.startDate || filters.endDate) {
      query.startTime = {};
      if (filters.startDate) {
        query.startTime.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.startTime.$lte = new Date(filters.endDate);
      }
    }

    if (filters.eventType) {
      query.eventType = filters.eventType;
    }

    return EventModel.find(query).sort({ startTime: 1 }).lean();
  }

  /**
   * Find event by ID
   * @param {string} id - Event ID
   * @returns {Promise<Object>} Event object
   */
  async findById(id) {
    return EventModel.findById(id).lean();
  }

  /**
   * Find event by external ID
   * @param {string} externalId - External calendar event ID
   * @returns {Promise<Object>} Event object
   */
  async findByExternalId(externalId) {
    return EventModel.findOne({ externalId }).lean();
  }

  /**
   * Update event
   * @param {string} id - Event ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} Updated event
   */
  async update(id, data) {
    return EventModel.findByIdAndUpdate(id, data, { new: true }).lean();
  }

  /**
   * Update event's external ID
   * @param {string} id - Event ID
   * @param {string} externalId - External calendar event ID
   * @returns {Promise<Object>} Updated event
   */
  async updateEventExternalId(id, externalId) {
    return EventModel.findByIdAndUpdate(
      id,
      { externalId, externalSource: 'google_calendar' },
      { new: true }
    ).lean();
  }

  /**
   * Delete event
   * @param {string} id - Event ID
   * @returns {Promise<void>}
   */
  async delete(id) {
    return EventModel.findByIdAndDelete(id);
  }

  /**
   * Get user's Google Calendar tokens
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Token object or null
   */
  async getUserGoogleTokens(userId) {
    const tokenDoc = await GoogleCalendarTokenModel.findOne({ userId }).lean();
    if (!tokenDoc) return null;

    return {
      access_token: tokenDoc.accessToken,
      refresh_token: tokenDoc.refreshToken,
      scope: tokenDoc.scope,
      token_type: tokenDoc.tokenType,
      expiry_date: tokenDoc.expiryDate,
    };
  }

  /**
   * Save user's Google Calendar tokens
   * @param {string} userId - User ID
   * @param {Object} tokens - OAuth tokens
   * @returns {Promise<void>}
   */
  async saveUserGoogleTokens(userId, tokens) {
    await GoogleCalendarTokenModel.findOneAndUpdate(
      { userId },
      {
        userId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        scope: tokens.scope,
        tokenType: tokens.token_type,
        expiryDate: tokens.expiry_date,
      },
      { upsert: true, new: true }
    );
  }

  /**
   * Remove user's Google Calendar tokens
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async removeUserGoogleTokens(userId) {
    await GoogleCalendarTokenModel.findOneAndDelete({ userId });
  }
}

export default CalendarRepository;
