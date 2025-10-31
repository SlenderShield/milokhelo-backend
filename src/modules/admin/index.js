/**
 * Admin Module
 */
import AdminModel from './model/admin.model.js';
import { AdminRepository } from './repository/admin.repository.js';
import { AdminService } from './service/admin.service.js';
import { AdminController } from './controller/admin.controller.js';
export { createAdminRoutes } from './routes/admin.routes.js';

export function initializeAdminModule(container) {
  const logger = container.resolve('logger');
  const eventBus = container.resolve('eventBus');

  container.registerSingleton('adminRepository', () => new AdminRepository(logger));
  container.registerSingleton('adminService', () => {
    const repo = container.resolve('adminRepository');
    return new AdminService(repo, eventBus, logger);
  });
  container.registerSingleton('adminController', () => {
    const service = container.resolve('adminService');
    return new AdminController(service, logger);
  });

  logger.info('Admin module initialized');
}

export { AdminModel, AdminRepository, AdminService, AdminController };
