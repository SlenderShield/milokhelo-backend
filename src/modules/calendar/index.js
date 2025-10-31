/**
 * Calendar Module
 */
import CalendarModel from './model/calendar.model.js';
import { CalendarRepository } from './repository/calendar.repository.js';
import { CalendarService } from './service/calendar.service.js';
import { CalendarController } from './controller/calendar.controller.js';
export { createCalendarRoutes } from './routes/calendar.routes.js';

export function initializeCalendarModule(container) {
  const logger = container.resolve('logger');
  const eventBus = container.resolve('eventBus');

  container.registerSingleton('calendarRepository', () => new CalendarRepository(logger));
  container.registerSingleton('calendarService', () => {
    const repo = container.resolve('calendarRepository');
    return new CalendarService(repo, eventBus, logger);
  });
  container.registerSingleton('calendarController', () => {
    const service = container.resolve('calendarService');
    return new CalendarController(service, logger);
  });

  logger.info('Calendar module initialized');
}

export { CalendarModel, CalendarRepository, CalendarService, CalendarController };
