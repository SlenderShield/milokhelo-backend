/**
 * EventBus Factory
 * Creates appropriate EventBus implementation based on configuration
 */
const InMemoryEventBus = require('./InMemoryEventBus');
const RedisEventBus = require('./RedisEventBus');

class EventBusFactory {
  static create(config, logger) {
    const adapter = config.eventBus.adapter;

    switch (adapter) {
      case 'memory':
        logger.info('Creating InMemoryEventBus');
        return new InMemoryEventBus(logger);

      case 'redis':
        logger.info('Creating RedisEventBus');
        return new RedisEventBus(config.redis, logger);

      default:
        throw new Error(`Unknown event bus adapter: ${adapter}`);
    }
  }
}

module.exports = EventBusFactory;
