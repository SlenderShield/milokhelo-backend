/**
 * Application Bootstrap
 * Initializes all infrastructure and modules
 */
import { getConfig } from './config/index.js';
import { createLogger } from './core/logging/index.js';
import { getContainer } from './core/container/index.js';
import { MongoDBConnection, DatabaseHealthCheck } from './core/database/index.js';
import { EventBusFactory } from './core/events/index.js';
import { EVENTS } from './common/constants/index.js';

// Import module initializers
import { initializeExampleModule } from './api/v1/modules/example/index.js';

async function bootstrap() {
  // 1. Load configuration
  const config = await getConfig();
  console.log(`🚀 Starting ${config.get('app.name')} in ${config.env} mode...`);

  // 2. Initialize logger
  const logger = createLogger({
    level: config.get('logging.level'),
    format: config.get('logging.format'),
    env: config.env,
  });
  logger.info('Logger initialized', { level: config.get('logging.level') });

  // 3. Initialize DI container
  const container = getContainer();
  logger.info('DI Container initialized');

  // Register core services
  container.registerInstance('config', config);
  container.registerInstance('logger', logger);

  // 4. Initialize database
  const dbConnection = new MongoDBConnection(config.getAll(), logger);
  await dbConnection.connect();
  container.registerInstance('dbConnection', dbConnection);

  // Register database health check
  const dbHealthCheck = new DatabaseHealthCheck(dbConnection);
  container.registerInstance('dbHealthCheck', dbHealthCheck);

  // 5. Initialize event bus
  const eventBus = EventBusFactory.create(config.getAll(), logger);
  if (eventBus.connect) {
    await eventBus.connect();
  }
  container.registerInstance('eventBus', eventBus);
  logger.info('EventBus initialized', { adapter: config.get('eventBus.adapter') });

  // 6. Initialize modules
  logger.info('Initializing modules...');

  // Initialize example module (demonstrates the pattern)
  initializeExampleModule(container);

  // Add more modules here as they are created
  // initializeUserModule(container);
  // initializeAuthModule(container);
  // etc.

  logger.info('All modules initialized');

  // 7. Publish system startup event
  await eventBus.publish(EVENTS.SYSTEM.STARTUP, {
    timestamp: new Date().toISOString(),
    environment: config.env,
  });

  return { config, logger, container, dbConnection, eventBus };
}

/**
 * Graceful shutdown
 */
async function shutdown(components) {
  const { logger, dbConnection, eventBus } = components;

  logger.info('Shutting down application...');

  // Publish shutdown event
  try {
    await eventBus.publish(EVENTS.SYSTEM.SHUTDOWN, {
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error publishing shutdown event', { error: error.message });
  }

  // Close event bus
  try {
    await eventBus.close();
    logger.info('EventBus closed');
  } catch (error) {
    logger.error('Error closing EventBus', { error: error.message });
  }

  // Close database connection
  try {
    await dbConnection.disconnect();
    logger.info('Database disconnected');
  } catch (error) {
    logger.error('Error disconnecting database', { error: error.message });
  }

  logger.info('Application shutdown complete');
}

export { bootstrap, shutdown };
