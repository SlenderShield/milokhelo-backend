/**
 * Calendar Controller
 */
import { asyncHandler, HTTP_STATUS } from '@/core/http/index.js';

class CalendarController {
  constructor(calendarService, logger) {
    this.calendarService = calendarService;
    this.logger = logger.child({ context: 'CalendarController' });
  }

  /**
   * Get user's calendar events
   */
  getEvents() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      const { startDate, endDate, eventType } = req.query;
      
      const events = await this.calendarService.getUserEvents(userId, {
        startDate,
        endDate,
        eventType,
      });
      
      res.status(HTTP_STATUS.OK).json(events);
    });
  }

  /**
   * Create a calendar event
   */
  createEvent() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      const event = await this.calendarService.createEvent(userId, req.body);
      res.status(HTTP_STATUS.CREATED).json(event);
    });
  }

  /**
   * Sync device events (legacy)
   */
  syncEvents() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      const { deviceEvents } = req.body;
      const result = await this.calendarService.syncEvents(userId, deviceEvents);
      res.status(HTTP_STATUS.OK).json(result);
    });
  }

  /**
   * Get Google Calendar OAuth URL
   */
  getGoogleCalendarAuthUrl() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      const authUrl = this.calendarService.getGoogleCalendarAuthUrl(userId);
      res.status(HTTP_STATUS.OK).json({ authUrl });
    });
  }

  /**
   * Handle Google Calendar OAuth callback
   */
  handleGoogleCalendarCallback() {
    return asyncHandler(async (req, res) => {
      const { code, state } = req.query;
      const userId = state || req.session?.userId;

      if (!code) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: 'error',
          message: 'Authorization code is required',
        });
      }

      await this.calendarService.handleGoogleCalendarCallback(userId, code);
      
      res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: 'Google Calendar connected successfully',
      });
    });
  }

  /**
   * Sync with Google Calendar
   */
  syncWithGoogleCalendar() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      const { startDate, endDate } = req.query;

      const start = startDate ? new Date(startDate) : new Date();
      const end = endDate ? new Date(endDate) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days

      const result = await this.calendarService.syncWithGoogleCalendar(userId, start, end);
      
      res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: 'Google Calendar synced successfully',
        ...result,
      });
    });
  }

  /**
   * Disconnect Google Calendar
   */
  disconnectGoogleCalendar() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      await this.calendarService.disconnectGoogleCalendar(userId);
      
      res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: 'Google Calendar disconnected successfully',
      });
    });
  }
}

export default CalendarController;
