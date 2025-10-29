/**
 * User Module
 * Handles user management and profiles
 */

// Domain exports
export { UserEntity } from './domain/UserEntity.js';
export { IUserRepository } from './domain/IUserRepository.js';

// Application exports
export { UserService } from './application/UserService.js';

// Infrastructure exports
export { UserModel } from './infrastructure/UserModel.js';
export { UserRepository } from './infrastructure/UserRepository.js';
export { UserController } from './infrastructure/UserController.js';
export { createUserRoutes } from './infrastructure/UserRoutes.js';

/**
 * Initialize the User module
 * Registers dependencies and sets up event handlers
 */
export function initializeUserModule(container) {
  const logger = container.resolve('logger');
  const eventBus = container.resolve('eventBus');

  // Register repository
  container.registerSingleton('userRepository', () => {
    return new UserRepository(logger);
  });

  // Register service
  container.registerSingleton('userService', () => {
    const repository = container.resolve('userRepository');
    return new UserService(repository, eventBus, logger);
  });

  // Register controller
  container.registerSingleton('userController', () => {
    const service = container.resolve('userService');
    return new UserController(service, logger);
  });

  logger.info('User module initialized');
}
