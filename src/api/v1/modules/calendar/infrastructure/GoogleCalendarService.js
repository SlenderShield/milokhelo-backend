/**
 * Google Calendar Service
 * Handles integration with Google Calendar API
 */
import { google } from 'googleapis';

class GoogleCalendarService {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger.child({ context: 'GoogleCalendarService' });
    this.enabled = config.get('googleCalendar.enabled') || false;
    
    if (this.enabled) {
      this.oauth2Client = new google.auth.OAuth2(
        config.get('oauth.google.clientId'),
        config.get('oauth.google.clientSecret'),
        config.get('googleCalendar.redirectUri')
      );
      
      this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      this.logger.info('Google Calendar service initialized');
    } else {
      this.logger.info('Google Calendar integration is disabled');
    }
  }

  /**
   * Check if Google Calendar is enabled
   * @returns {boolean}
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Get OAuth2 authorization URL
   * @param {string} userId - User ID for state parameter
   * @returns {string} Authorization URL
   */
  getAuthUrl(userId) {
    if (!this.enabled) {
      throw new Error('Google Calendar integration is not enabled');
    }

    const scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: userId,
    });
  }

  /**
   * Exchange authorization code for tokens
   * @param {string} code - Authorization code
   * @returns {Promise<Object>} Token object
   */
  async getTokensFromCode(code) {
    if (!this.enabled) {
      throw new Error('Google Calendar integration is not enabled');
    }

    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.logger.debug({ tokens: '***' }, 'Exchanged code for tokens');
      return tokens;
    } catch (error) {
      this.logger.error({ error: error.message }, 'Failed to exchange code for tokens');
      throw error;
    }
  }

  /**
   * Set OAuth2 credentials
   * @param {Object} tokens - OAuth2 tokens
   */
  setCredentials(tokens) {
    if (!this.enabled) {
      throw new Error('Google Calendar integration is not enabled');
    }
    this.oauth2Client.setCredentials(tokens);
  }

  /**
   * List calendar events
   * @param {Object} tokens - OAuth2 tokens
   * @param {Date} timeMin - Start time
   * @param {Date} timeMax - End time
   * @param {number} maxResults - Maximum number of results
   * @returns {Promise<Array>} Array of events
   */
  async listEvents(tokens, timeMin, timeMax, maxResults = 250) {
    if (!this.enabled) {
      throw new Error('Google Calendar integration is not enabled');
    }

    try {
      this.setCredentials(tokens);

      const response = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin?.toISOString(),
        timeMax: timeMax?.toISOString(),
        maxResults,
        singleEvents: true,
        orderBy: 'startTime',
      });

      this.logger.debug(
        { count: response.data.items?.length || 0 },
        'Retrieved calendar events'
      );

      return response.data.items || [];
    } catch (error) {
      this.logger.error({ error: error.message }, 'Failed to list calendar events');
      throw error;
    }
  }

  /**
   * Create a calendar event
   * @param {Object} tokens - OAuth2 tokens
   * @param {Object} eventData - Event data
   * @returns {Promise<Object>} Created event
   */
  async createEvent(tokens, eventData) {
    if (!this.enabled) {
      throw new Error('Google Calendar integration is not enabled');
    }

    try {
      this.setCredentials(tokens);

      const event = {
        summary: eventData.title,
        description: eventData.description,
        location: eventData.location,
        start: {
          dateTime: eventData.startTime,
          timeZone: eventData.timeZone || 'UTC',
        },
        end: {
          dateTime: eventData.endTime,
          timeZone: eventData.timeZone || 'UTC',
        },
      };

      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
      });

      this.logger.info({ eventId: response.data.id }, 'Created calendar event');
      return response.data;
    } catch (error) {
      this.logger.error({ error: error.message }, 'Failed to create calendar event');
      throw error;
    }
  }

  /**
   * Update a calendar event
   * @param {Object} tokens - OAuth2 tokens
   * @param {string} eventId - Google Calendar event ID
   * @param {Object} eventData - Updated event data
   * @returns {Promise<Object>} Updated event
   */
  async updateEvent(tokens, eventId, eventData) {
    if (!this.enabled) {
      throw new Error('Google Calendar integration is not enabled');
    }

    try {
      this.setCredentials(tokens);

      const event = {
        summary: eventData.title,
        description: eventData.description,
        location: eventData.location,
        start: {
          dateTime: eventData.startTime,
          timeZone: eventData.timeZone || 'UTC',
        },
        end: {
          dateTime: eventData.endTime,
          timeZone: eventData.timeZone || 'UTC',
        },
      };

      const response = await this.calendar.events.update({
        calendarId: 'primary',
        eventId,
        requestBody: event,
      });

      this.logger.info({ eventId }, 'Updated calendar event');
      return response.data;
    } catch (error) {
      this.logger.error({ error: error.message, eventId }, 'Failed to update calendar event');
      throw error;
    }
  }

  /**
   * Delete a calendar event
   * @param {Object} tokens - OAuth2 tokens
   * @param {string} eventId - Google Calendar event ID
   * @returns {Promise<void>}
   */
  async deleteEvent(tokens, eventId) {
    if (!this.enabled) {
      throw new Error('Google Calendar integration is not enabled');
    }

    try {
      this.setCredentials(tokens);

      await this.calendar.events.delete({
        calendarId: 'primary',
        eventId,
      });

      this.logger.info({ eventId }, 'Deleted calendar event');
    } catch (error) {
      this.logger.error({ error: error.message, eventId }, 'Failed to delete calendar event');
      throw error;
    }
  }

  /**
   * Convert Google Calendar event to internal format
   * @param {Object} googleEvent - Google Calendar event
   * @returns {Object} Internal event format
   */
  convertFromGoogleEvent(googleEvent) {
    return {
      externalId: googleEvent.id,
      externalSource: 'google_calendar',
      title: googleEvent.summary,
      description: googleEvent.description,
      location: googleEvent.location,
      startTime: googleEvent.start.dateTime || googleEvent.start.date,
      endTime: googleEvent.end.dateTime || googleEvent.end.date,
      allDay: !googleEvent.start.dateTime,
      url: googleEvent.htmlLink,
      status: googleEvent.status,
      created: googleEvent.created,
      updated: googleEvent.updated,
    };
  }
}

export default GoogleCalendarService;
