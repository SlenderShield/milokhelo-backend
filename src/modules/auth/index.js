/**
 * Auth Module
 * Handles authentication and authorization
 */
import { AuthService } from './service/auth.service.js';
import UserModel from './model/user.model.js';
import { AuthRepository } from './repository/auth.repository.js';
import { AuthController } from './controller/auth.controller.js';
export { createAuthRoutes } from './routes/auth.routes.js';
import { PassportConfig } from './service/passport/PassportConfig.js';
import { EmailService } from './service/email.service.js';
import { createJwtAuthMiddleware } from '@/core/http/index.js';

/**
 * Initialize the Auth module
 * Registers dependencies and sets up event handlers
 */
function initializeAuthModule(container) {
  const logger = container.resolve('logger');
  const eventBus = container.resolve('eventBus');
  const config = container.resolve('config');

  // Register JWT authentication middleware
  container.registerSingleton('jwtAuthMiddleware', () => {
    return createJwtAuthMiddleware(config);
  });

  // Register email service
  container.registerSingleton('emailService', () => {
    return new EmailService(config, logger);
  });

  // Register repository
  container.registerSingleton('authRepository', () => {
    return new AuthRepository(logger);
  });

  // Register service
  container.registerSingleton('authService', () => {
    const repository = container.resolve('authRepository');
    const emailService = container.resolve('emailService');
    return new AuthService(repository, eventBus, logger, config, emailService);
  });

  // Register controller
  container.registerSingleton('authController', () => {
    const service = container.resolve('authService');
    return new AuthController(service, logger);
  });

  // Register and initialize Passport
  container.registerSingleton('passport', () => {
    const service = container.resolve('authService');
    const passportConfig = new PassportConfig(service, logger, config);
    return passportConfig.initialize();
  });

  logger.info('Auth module initialized');
}

export {
  AuthService,
  UserModel,
  AuthRepository,
  AuthController,
  PassportConfig,
  EmailService,
  initializeAuthModule,
};
