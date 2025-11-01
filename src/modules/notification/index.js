/**
 * Notification Module
 */
import NotificationModel from './model/notification.model.js';
import { NotificationRepository } from './repository/notification.repository.js';
import { NotificationService } from './service/notification.service.js';
import { NotificationController } from './controller/notification.controller.js';
export { createNotificationRoutes } from './routes/notification.routes.js';

export function initializeNotificationModule(container) {
  const logger = container.resolve('logger');
  const eventBus = container.resolve('eventBus');

  container.registerSingleton('notificationRepository', () => new NotificationRepository(logger));
  container.registerSingleton('notificationService', () => {
    const repo = container.resolve('notificationRepository');
    return new NotificationService(repo, eventBus, logger);
  });
  container.registerSingleton('notificationController', () => {
    const service = container.resolve('notificationService');
    return new NotificationController(service, logger);
  });

  logger.info('Notification module initialized');
}

export { NotificationModel, NotificationRepository, NotificationService, NotificationController };
