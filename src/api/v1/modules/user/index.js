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
import StatsUpdateHandlerClass from './application/StatsUpdateHandler.js';
import AchievementEvaluatorClass from './application/AchievementEvaluator.js';
export const UserService = UserServiceClass;
export const StatsUpdateHandler = StatsUpdateHandlerClass;
export const AchievementEvaluator = AchievementEvaluatorClass;

// Infrastructure exports
import UserRepositoryClass from './infrastructure/persistence/UserRepository.js';
import AchievementRepositoryClass from './infrastructure/persistence/AchievementRepository.js';
import UserControllerClass from './infrastructure/http/UserController.js';
export { createUserRoutes } from './infrastructure/http/UserRoutes.js';
export { seedAchievements } from './infrastructure/persistence/achievementSeeds.js';

// Re-export classes for external use
export const UserRepository = UserRepositoryClass;
export const AchievementRepository = AchievementRepositoryClass;
export const UserController = UserControllerClass;

/**
 * Initialize the User module
 * Registers dependencies and sets up event handlers
 */
export function initializeUserModule(container) {
  const logger = container.resolve('logger');
  const eventBus = container.resolve('eventBus');

  // Register repositories
  container.registerSingleton('userRepository', () => {
    return new UserRepositoryClass(logger, UserModel);
  });

  container.registerSingleton('achievementRepository', () => {
    return new AchievementRepositoryClass(logger);
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

  // Register stats update handler
  container.registerSingleton('statsUpdateHandler', () => {
    const userRepository = container.resolve('userRepository');
    // Match repository needs to be resolved dynamically to avoid circular dependency
    return new StatsUpdateHandlerClass(userRepository, null, logger);
  });

  // Register achievement evaluator
  container.registerSingleton('achievementEvaluator', () => {
    const userRepository = container.resolve('userRepository');
    const achievementRepository = container.resolve('achievementRepository');
    return new AchievementEvaluatorClass(userRepository, achievementRepository, eventBus, logger);
  });

  // Set up event subscriptions
  const statsUpdateHandler = container.resolve('statsUpdateHandler');
  const achievementEvaluator = container.resolve('achievementEvaluator');
  
  // Subscribe to match.finished event
  eventBus.subscribe('match.finished', async (data) => {
    // Resolve match repository at runtime to avoid circular dependency
    if (!statsUpdateHandler.matchRepository) {
      statsUpdateHandler.matchRepository = container.resolve('matchRepository');
    }
    await statsUpdateHandler.handleMatchFinished(data);
  });

  // Subscribe to user.stats_updated event for achievement evaluation
  eventBus.subscribe('user.stats_updated', async (data) => {
    try {
      const { userId, sport } = data;
      await achievementEvaluator.evaluateAchievements(userId, sport);
    } catch (error) {
      logger.error('Error evaluating achievements', {
        userId: data.userId,
        error: error.message,
      });
    }
  });

  logger.info('User module initialized with stats auto-update and achievement evaluation');
}
