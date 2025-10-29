/**
 * Auth Module
 * Handles authentication and authorization
 */
import { IAuthRepository } from './domain/index.js';
import { AuthService } from './application/index.js';
import { UserModel, AuthRepository, AuthController, createAuthRoutes } from './infrastructure/index.js';

/**
 * Initialize the Auth module
 * Registers dependencies and sets up event handlers
 */
function initializeAuthModule(container) {
  const logger = container.resolve('logger');
  const eventBus = container.resolve('eventBus');
  const config = container.resolve('config');

  // Register repository
  container.registerSingleton('authRepository', () => {
    return new AuthRepository(logger);
  });

  // Register service
  container.registerSingleton('authService', () => {
    const repository = container.resolve('authRepository');
    return new AuthService(repository, eventBus, logger, config);
  });

  // Register controller
  container.registerSingleton('authController', () => {
    const service = container.resolve('authService');
    return new AuthController(service, logger);
  });

  logger.info('Auth module initialized');
}

export {
  IAuthRepository,
  AuthService,
  UserModel,
  AuthRepository,
  AuthController,
  createAuthRoutes,
  initializeAuthModule,
};
