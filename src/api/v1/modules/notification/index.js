/**
 * Notification Module
 */
import NotificationRepository from './infrastructure/persistence/NotificationRepository.js';
import NotificationService from './application/NotificationService.js';
import NotificationController from './infrastructure/http/NotificationController.js';
import FCMService from './infrastructure/FCMService.js';
import APNSService from './infrastructure/APNSService.js';
import PushNotificationService from './infrastructure/PushNotificationService.js';
import { createNotificationRoutes } from './infrastructure/http/NotificationRoutes.js';

export function initializeNotificationModule(container) {
  const logger = container.resolve('logger');
  const config = container.resolve('config');
  const eventBus = container.resolve('eventBus');

  // Initialize push notification services
  container.registerSingleton('fcmService', () => {
    return new FCMService(config, logger);
  });

  container.registerSingleton('apnsService', () => {
    return new APNSService(config, logger);
  });

  container.registerSingleton('pushNotificationService', () => {
    const fcmService = container.resolve('fcmService');
    const apnsService = container.resolve('apnsService');
    return new PushNotificationService(fcmService, apnsService, logger);
  });

  container.registerSingleton('notificationRepository', () => {
    return new NotificationRepository(logger);
  });

  container.registerSingleton('notificationService', () => {
    const repository = container.resolve('notificationRepository');
    const pushNotificationService = container.resolve('pushNotificationService');
    return new NotificationService(repository, pushNotificationService, eventBus, logger);
  });

  container.registerSingleton('notificationController', () => {
    const service = container.resolve('notificationService');
    return new NotificationController(service, logger);
  });

  logger.info('Notification module initialized');
}

export { NotificationService, NotificationController, createNotificationRoutes };
