/**
 * Calendar Controller
 */
import { asyncHandler, HTTP_STATUS } from '@/core/http/index.js';

class CalendarController {
  constructor(calendarService, logger) {
    this.calendarService = calendarService;
    this.logger = logger.child({ context: 'CalendarController' });
  }

  getEvents() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      const events = await this.calendarService.getUserEvents(userId);
      res.status(HTTP_STATUS.OK).json(events);
    });
  }

  createEvent() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      const event = await this.calendarService.createEvent(userId, req.body);
      res.status(HTTP_STATUS.CREATED).json(event);
    });
  }

  syncEvents() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      const { deviceEvents } = req.body;
      const result = await this.calendarService.syncEvents(userId, deviceEvents);
      res.status(HTTP_STATUS.OK).json(result);
    });
  }
}

export default CalendarController;
