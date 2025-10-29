/**
 * Calendar Module
 */
import CalendarRepository from './infrastructure/persistence/CalendarRepository.js';
import CalendarService from './application/CalendarService.js';
import CalendarController from './infrastructure/http/CalendarController.js';
import GoogleCalendarService from './infrastructure/GoogleCalendarService.js';
import { createCalendarRoutes } from './infrastructure/http/CalendarRoutes.js';

export function initializeCalendarModule(container) {
  const logger = container.resolve('logger');
  const config = container.resolve('config');

  container.registerSingleton('googleCalendarService', () => {
    return new GoogleCalendarService(config, logger);
  });

  container.registerSingleton('calendarRepository', () => {
    return new CalendarRepository(logger);
  });

  container.registerSingleton('calendarService', () => {
    const repository = container.resolve('calendarRepository');
    const googleCalendarService = container.resolve('googleCalendarService');
    return new CalendarService(repository, googleCalendarService, logger);
  });

  container.registerSingleton('calendarController', () => {
    const service = container.resolve('calendarService');
    return new CalendarController(service, logger);
  });

  logger.info('Calendar module initialized');
}

export { CalendarService, CalendarController, createCalendarRoutes };
