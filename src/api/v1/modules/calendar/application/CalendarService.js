/**
 * Calendar Service - Business logic for calendar events
 */
class CalendarService {
  constructor(calendarRepository, logger) {
    this.calendarRepository = calendarRepository;
    this.logger = logger.child({ context: 'CalendarService' });
  }

  async getUserEvents(userId) {
    this.logger.debug({ userId }, 'Fetching user events');
    return this.calendarRepository.findByUserId(userId);
  }

  async createEvent(userId, data) {
    this.logger.info({ userId }, 'Creating event');
    return this.calendarRepository.create({ userId, ...data });
  }

  async syncEvents(userId, _deviceEvents) {
    this.logger.info({ userId }, 'Syncing events');
    // TODO: Implement sync logic (merge device events with backend)
    // For now, just return all user events
    return { syncedEvents: await this.getUserEvents(userId) };
  }
}

export default CalendarService;
