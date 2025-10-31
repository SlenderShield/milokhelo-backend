/**
 * Application Bootstrap
 * Initializes all infrastructure and modules
 */
import { getConfig } from '@/config/index.js';
import ConfigValidator from '@/config/validator.js';
import { createLogger } from '@/core/logging/index.js';
import { getContainer } from '@/core/container/index.js';
import { MongoDBConnection, DatabaseHealthCheck } from '@/core/database/index.js';
import { EventBusFactory } from '@/core/events/index.js';
import MetricsCollector from '@/core/libs/metrics.js';
import { EVENTS } from '@/common/constants/index.js';

// Import module initializers
import { initializeAuthModule } from '@/new-modules/auth/index.js';
import { initializeUserModule } from '@/new-modules/user/index.js';
import { initializeTeamModule } from '@/new-modules/team/index.js';
import { initializeMatchModule } from '@/new-modules/match/index.js';
import { initializeTournamentModule } from '@/new-modules/tournament/index.js';
import { initializeChatModule } from '@/new-modules/chat/index.js';
import { initializeVenueModule } from '@/new-modules/venue/index.js';
import { initializeMapsModule } from '@/new-modules/maps/index.js';
import { initializeCalendarModule } from '@/new-modules/calendar/index.js';
import { initializeNotificationModule } from '@/new-modules/notification/index.js';
import { initializeInvitationModule } from '@/new-modules/invitation/index.js';
import { initializeFeedbackModule } from '@/new-modules/feedback/index.js';
import { initializeAdminModule } from '@/new-modules/admin/index.js';

async function bootstrap() {
  // 1. Load configuration
  const config = await getConfig();
  console.log(`🚀 Starting ${config.get('app.name')} in ${config.env} mode...`);

  // 2. Validate configuration (fail-fast)
  const validator = new ConfigValidator(config);
  validator.validate();

  // 3. Initialize logger
  const logger = createLogger({
    level: config.get('logging.level'),
    format: config.get('logging.format'),
    env: config.env,
  });
  logger.info('Logger initialized', { level: config.get('logging.level') });

  // 4. Initialize DI container
  const container = getContainer();
  logger.info('DI Container initialized');

  // Register core services
  container.registerInstance('config', config);
  container.registerInstance('logger', logger);

  // 5. Initialize metrics collector
  const metricsCollector = new MetricsCollector({ prefix: 'milokhelo_' });
  container.registerInstance('metricsCollector', metricsCollector);
  logger.info('Metrics collector initialized');

  // 6. Initialize database
  const dbConnection = new MongoDBConnection(config.getAll(), logger);
  await dbConnection.connect();
  container.registerInstance('dbConnection', dbConnection);

  // Register database health check
  const dbHealthCheck = new DatabaseHealthCheck(dbConnection);
  container.registerInstance('dbHealthCheck', dbHealthCheck);

  // 7. Initialize event bus
  const eventBus = EventBusFactory.create(config.getAll(), logger);
  if (eventBus.connect) {
    await eventBus.connect();
  }
  container.registerInstance('eventBus', eventBus);
  logger.info('EventBus initialized', { adapter: config.get('eventBus.adapter') });

  // 8. Initialize modules
  logger.info('Initializing modules...');

  // Initialize all application modules
  initializeAuthModule(container);
  initializeUserModule(container);
  initializeTeamModule(container);
  initializeMatchModule(container);
  initializeTournamentModule(container);
  initializeChatModule(container);
  initializeVenueModule(container);
  initializeMapsModule(container);
  initializeCalendarModule(container);
  initializeNotificationModule(container);
  initializeInvitationModule(container);
  initializeFeedbackModule(container);
  initializeAdminModule(container);

  logger.info('All modules initialized');

  // 9. Publish system startup event
  await eventBus.publish(EVENTS.SYSTEM.STARTUP, {
    timestamp: new Date().toISOString(),
    environment: config.env,
  });

  return { config, logger, container, dbConnection, eventBus, metricsCollector };
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
