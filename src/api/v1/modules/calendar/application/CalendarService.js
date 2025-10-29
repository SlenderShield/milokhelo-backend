/**
 * Calendar Service - Business logic for calendar events
 */
class CalendarService {
  constructor(calendarRepository, googleCalendarService, logger) {
    this.calendarRepository = calendarRepository;
    this.googleCalendarService = googleCalendarService;
    this.logger = logger.child({ context: 'CalendarService' });
  }

  /**
   * Get user's calendar events
   * @param {string} userId - User ID
   * @param {Object} filters - Optional filters (startDate, endDate, eventType)
   * @returns {Promise<Array>} Array of events
   */
  async getUserEvents(userId, filters = {}) {
    this.logger.debug({ userId, filters }, 'Fetching user events');
    return this.calendarRepository.findByUserId(userId, filters);
  }

  /**
   * Create a calendar event
   * @param {string} userId - User ID
   * @param {Object} data - Event data
   * @returns {Promise<Object>} Created event
   */
  async createEvent(userId, data) {
    this.logger.info({ userId }, 'Creating event');
    const event = await this.calendarRepository.create({ userId, ...data });

    // Optionally sync to Google Calendar if user has connected it
    try {
      const userTokens = await this.calendarRepository.getUserGoogleTokens(userId);
      if (userTokens && this.googleCalendarService.isEnabled()) {
        const googleEvent = await this.googleCalendarService.createEvent(userTokens, data);
        // Update local event with Google Calendar ID
        await this.calendarRepository.updateEventExternalId(event._id, googleEvent.id);
        this.logger.info({ eventId: event._id, googleEventId: googleEvent.id }, 'Synced event to Google Calendar');
      }
    } catch (error) {
      this.logger.warn({ error: error.message }, 'Failed to sync event to Google Calendar, continuing anyway');
    }

    return event;
  }

  /**
   * Sync events with Google Calendar
   * @param {string} userId - User ID
   * @param {Date} startDate - Start date for sync
   * @param {Date} endDate - End date for sync
   * @returns {Promise<Object>} Sync results
   */
  async syncWithGoogleCalendar(userId, startDate, endDate) {
    this.logger.info({ userId }, 'Syncing with Google Calendar');

    if (!this.googleCalendarService.isEnabled()) {
      throw new Error('Google Calendar integration is not enabled');
    }

    try {
      // Get user's Google Calendar tokens
      const userTokens = await this.calendarRepository.getUserGoogleTokens(userId);
      if (!userTokens) {
        throw new Error('User has not connected Google Calendar');
      }

      // Fetch events from Google Calendar
      const googleEvents = await this.googleCalendarService.listEvents(
        userTokens,
        startDate,
        endDate
      );

      // Convert and merge events
      const importedEvents = [];
      for (const googleEvent of googleEvents) {
        const convertedEvent = this.googleCalendarService.convertFromGoogleEvent(googleEvent);
        
        // Check if event already exists
        const existingEvent = await this.calendarRepository.findByExternalId(googleEvent.id);
        
        if (existingEvent) {
          // Update existing event
          await this.calendarRepository.update(existingEvent._id, convertedEvent);
        } else {
          // Create new event
          const newEvent = await this.calendarRepository.create({
            userId,
            ...convertedEvent,
          });
          importedEvents.push(newEvent);
        }
      }

      this.logger.info(
        { userId, imported: importedEvents.length, total: googleEvents.length },
        'Completed Google Calendar sync'
      );

      return {
        imported: importedEvents.length,
        total: googleEvents.length,
        events: importedEvents,
      };
    } catch (error) {
      this.logger.error({ error: error.message, userId }, 'Failed to sync with Google Calendar');
      throw error;
    }
  }

  /**
   * Get Google Calendar OAuth URL
   * @param {string} userId - User ID
   * @returns {string} Authorization URL
   */
  getGoogleCalendarAuthUrl(userId) {
    if (!this.googleCalendarService.isEnabled()) {
      throw new Error('Google Calendar integration is not enabled');
    }
    return this.googleCalendarService.getAuthUrl(userId);
  }

  /**
   * Handle Google Calendar OAuth callback
   * @param {string} userId - User ID
   * @param {string} code - Authorization code
   * @returns {Promise<void>}
   */
  async handleGoogleCalendarCallback(userId, code) {
    if (!this.googleCalendarService.isEnabled()) {
      throw new Error('Google Calendar integration is not enabled');
    }

    try {
      const tokens = await this.googleCalendarService.getTokensFromCode(code);
      await this.calendarRepository.saveUserGoogleTokens(userId, tokens);
      this.logger.info({ userId }, 'Saved Google Calendar tokens for user');
    } catch (error) {
      this.logger.error({ error: error.message, userId }, 'Failed to handle Google Calendar callback');
      throw error;
    }
  }

  /**
   * Disconnect Google Calendar for user
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async disconnectGoogleCalendar(userId) {
    await this.calendarRepository.removeUserGoogleTokens(userId);
    this.logger.info({ userId }, 'Disconnected Google Calendar for user');
  }

  /**
   * Legacy sync events method (for device events)
   * @param {string} userId - User ID
   * @param {Array} deviceEvents - Events from device
   * @returns {Promise<Object>} Sync results
   */
  async syncEvents(userId, deviceEvents) {
    this.logger.info({ userId, count: deviceEvents?.length || 0 }, 'Syncing device events');
    // For now, just return all user events
    // In the future, implement proper merge logic for device events
    return { syncedEvents: await this.getUserEvents(userId) };
  }
}

export default CalendarService;
