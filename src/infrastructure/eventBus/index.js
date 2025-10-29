/**
 * EventBus Module
 * Entry point for event bus infrastructure
 */
const IEventBus = require('./IEventBus');
const InMemoryEventBus = require('./InMemoryEventBus');
const RedisEventBus = require('./RedisEventBus');
const EventBusFactory = require('./EventBusFactory');

module.exports = {
  IEventBus,
  InMemoryEventBus,
  RedisEventBus,
  EventBusFactory,
};
