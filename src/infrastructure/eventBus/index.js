/**
 * EventBus Module
 * Entry point for event bus infrastructure
 */
const IEventBus = require('./IEventBus');
const InMemoryEventBus = require('./inMemoryBus');
const RedisEventBus = require('./redisBus');
const EventBusFactory = require('./EventBusFactory');

module.exports = {
  IEventBus,
  InMemoryEventBus,
  RedisEventBus,
  EventBusFactory,
};
