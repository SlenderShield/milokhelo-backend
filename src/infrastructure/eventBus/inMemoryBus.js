/**
 * In-Memory EventBus Implementation
 * Suitable for single-instance applications and development
 */
const IEventBus = require('./IEventBus');

class InMemoryEventBus extends IEventBus {
  constructor(logger) {
    super();
    this.logger = logger;
    this.handlers = new Map(); // event -> Set of handlers
  }

  async publish(event, data) {
    this.logger.debug(`Publishing event: ${event}`, { event, dataKeys: Object.keys(data || {}) });

    const handlers = this.handlers.get(event);
    if (!handlers || handlers.size === 0) {
      this.logger.debug(`No handlers registered for event: ${event}`);
      return;
    }

    // Execute all handlers asynchronously
    const promises = Array.from(handlers).map(async (handler) => {
      try {
        await handler(data);
      } catch (error) {
        this.logger.error(`Error executing handler for event: ${event}`, {
          event,
          error: error.message,
          stack: error.stack,
        });
      }
    });

    await Promise.all(promises);
  }

  subscribe(event, handler) {
    if (typeof handler !== 'function') {
      throw new Error('Handler must be a function');
    }

    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }

    this.handlers.get(event).add(handler);
    this.logger.debug(`Handler subscribed to event: ${event}`);
  }

  unsubscribe(event, handler) {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.delete(handler);
      this.logger.debug(`Handler unsubscribed from event: ${event}`);

      // Clean up empty sets
      if (handlers.size === 0) {
        this.handlers.delete(event);
      }
    }
  }

  async close() {
    this.handlers.clear();
    this.logger.info('InMemoryEventBus closed');
  }

  // Helper method to get all registered events
  getRegisteredEvents() {
    return Array.from(this.handlers.keys());
  }

  // Helper method to get handler count for an event
  getHandlerCount(event) {
    const handlers = this.handlers.get(event);
    return handlers ? handlers.size : 0;
  }
}

module.exports = InMemoryEventBus;
