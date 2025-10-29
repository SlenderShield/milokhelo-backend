/**
 * Notification Module
 */
import NotificationRepository from './infrastructure/persistence/NotificationRepository.js';
import NotificationService from './application/NotificationService.js';
import NotificationController from './infrastructure/http/NotificationController.js';
import { createNotificationRoutes } from './infrastructure/http/NotificationRoutes.js';

export function initializeNotificationModule(container) {
  const logger = container.resolve('logger');

  container.registerSingleton('notificationRepository', () => {
    return new NotificationRepository(logger);
  });

  container.registerSingleton('notificationService', () => {
    const repository = container.resolve('notificationRepository');
    return new NotificationService(repository, logger);
  });

  container.registerSingleton('notificationController', () => {
    const service = container.resolve('notificationService');
    return new NotificationController(service, logger);
  });

  logger.info('Notification module initialized');
}

export { NotificationService, NotificationController, createNotificationRoutes };
