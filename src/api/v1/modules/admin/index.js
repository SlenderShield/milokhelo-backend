/**
 * Admin Module
 */
import AdminController from './infrastructure/http/AdminController.js';
import { createAdminRoutes } from './infrastructure/http/AdminRoutes.js';

export function initializeAdminModule(container) {
  const logger = container.resolve('logger');

  container.registerSingleton('adminController', () => {
    return new AdminController(logger);
  });

  logger.info('Admin module initialized');
}

export { AdminController, createAdminRoutes };
