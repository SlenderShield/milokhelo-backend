/**
 * User Module
 * Handles user management and profiles
 */

// Import UserModel from auth module (shared model)
import UserModel from '../auth/infrastructure/persistence/UserModel.js';

// Domain exports (default exports)
import UserEntity from './domain/UserEntity.js';
import IUserRepository from './domain/IUserRepository.js';
export { UserEntity, IUserRepository };

// Application exports (default export)
import UserServiceClass from './application/UserService.js';
export const UserService = UserServiceClass;

// Infrastructure exports
import UserRepositoryClass from './infrastructure/persistence/UserRepository.js';
import UserControllerClass from './infrastructure/http/UserController.js';
export { createUserRoutes } from './infrastructure/http/UserRoutes.js';

// Re-export classes for external use
export const UserRepository = UserRepositoryClass;
export const UserController = UserControllerClass;

/**
 * Initialize the User module
 * Registers dependencies and sets up event handlers
 */
export function initializeUserModule(container) {
  const logger = container.resolve('logger');
  const eventBus = container.resolve('eventBus');

  // Register repository with UserModel from auth module
  container.registerSingleton('userRepository', () => {
    return new UserRepositoryClass(logger, UserModel);
  });

  // Register service
  container.registerSingleton('userService', () => {
    const repository = container.resolve('userRepository');
    return new UserServiceClass(repository, eventBus, logger);
  });

  // Register controller
  container.registerSingleton('userController', () => {
    const service = container.resolve('userService');
    return new UserControllerClass(service, logger);
  });

  logger.info('User module initialized');
}
