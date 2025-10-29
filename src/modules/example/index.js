/**
 * Example Module
 * Demonstrates module structure and inter-module communication
 */
import {  ExampleEntity, IExampleRepository  } from './domain/index.js';
import {  ExampleService  } from './application/index.js';
import { 
  ExampleModel,
  ExampleRepository,
  ExampleController,
  createExampleRoutes,
} from './infrastructure/index.js';

/**
 * Initialize the Example module
 * Registers dependencies and sets up event handlers
 */
function initializeExampleModule(container) {
  const logger = container.resolve('logger');
  const eventBus = container.resolve('eventBus');

  // Register repository
  container.registerSingleton('exampleRepository', () => {
    return new ExampleRepository(logger);
  });

  // Register service
  container.registerSingleton('exampleService', () => {
    const repository = container.resolve('exampleRepository');
    return new ExampleService(repository, eventBus, logger);
  });

  // Register controller
  container.registerSingleton('exampleController', () => {
    const service = container.resolve('exampleService');
    return new ExampleController(service, logger);
  });

  // Subscribe to events from other modules (example)
  eventBus.subscribe('system.startup', async (data) => {
    logger.info('Example module received system startup event', data);
  });

  logger.info('Example module initialized');
}

export {

  ExampleEntity,
  IExampleRepository,
  ExampleService,
  ExampleModel,
  ExampleRepository,
  ExampleController,
  createExampleRoutes,
  initializeExampleModule,

};