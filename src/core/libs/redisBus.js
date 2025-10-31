/**
 * Redis EventBus Implementation
 * Suitable for distributed applications and microservices
 * Uses Redis Pub/Sub for event distribution
 */
import { createClient } from 'redis';
import IEventBus from './IEventBus.js';

class RedisEventBus extends IEventBus {
  constructor(config, logger) {
    super();
    this.config = config;
    this.logger = logger;
    this.handlers = new Map(); // event -> Set of handlers
    this.publisher = null;
    this.subscriber = null;
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected) return;

    try {
      // Create publisher client
      this.publisher = createClient({
        socket: {
          host: this.config.host,
          port: this.config.port,
        },
        password: this.config.password,
        database: this.config.db,
      });

      // Duplicate for subscriber
      this.subscriber = this.publisher.duplicate();

      // Connection event handlers
      this.publisher.on('error', (error) => {
        this.logger.error('Redis publisher error', { error: error.message });
      });

      this.subscriber.on('error', (error) => {
        this.logger.error('Redis subscriber error', { error: error.message });
      });

      this.publisher.on('ready', () => {
        this.logger.info('Redis publisher ready');
      });

      this.subscriber.on('ready', () => {
        this.logger.info('Redis subscriber ready');
      });

      // Connect both clients
      await this.publisher.connect();
      await this.subscriber.connect();

      this.isConnected = true;
      this.logger.info('RedisEventBus connected');
    } catch (error) {
      this.logger.error('Failed to connect to Redis', { error: error.message });
      throw error;
    }
  }

  async handleMessage(event, message) {
    try {
      const data = JSON.parse(message);
      const handlers = this.handlers.get(event);
      if (!handlers || handlers.size === 0) return;

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
    } catch (error) {
      this.logger.error(`Error handling message for event: ${event}`, {
        event,
        error: error.message,
      });
    }
  }

  async publish(event, data) {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      const message = JSON.stringify(data);
      await this.publisher.publish(event, message);
      this.logger.debug(`Published event: ${event}`, { event, dataKeys: Object.keys(data || {}) });
    } catch (error) {
      this.logger.error(`Failed to publish event: ${event}`, { error: error.message });
      throw error;
    }
  }

  async subscribe(event, handler) {
    if (!this.isConnected) {
      await this.connect();
    }

    if (typeof handler !== 'function') {
      throw new Error('Handler must be a function');
    }

    // Add handler
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
      // Subscribe directly
      await this.subscriber.subscribe(event, (message) => {
        this.handleMessage(event, message);
      });
      this.logger.info(`Subscribed to Redis channel: ${event}`);
    }

    this.handlers.get(event).add(handler);
    this.logger.debug(`Handler subscribed to event: ${event}`);
  }

  async unsubscribe(event, handler) {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.delete(handler);
      this.logger.debug(`Handler unsubscribed from event: ${event}`);

      if (handlers.size === 0) {
        this.handlers.delete(event);
        await this.subscriber.unsubscribe(event);
        this.logger.info(`Unsubscribed from Redis channel: ${event}`);
      }
    }
  }

  async close() {
    try {
      if (this.publisher?.isOpen) {
        await this.publisher.quit();
      }
      if (this.subscriber?.isOpen) {
        await this.subscriber.quit();
      }
      this.handlers.clear();
      this.isConnected = false;
      this.logger.info('RedisEventBus closed');
    } catch (error) {
      this.logger.error('Error closing RedisEventBus', { error: error.message });
    }
  }

  // Helper methods
  getRegisteredEvents() {
    return Array.from(this.handlers.keys());
  }

  getHandlerCount(event) {
    const handlers = this.handlers.get(event);
    return handlers ? handlers.size : 0;
  }
}

export default RedisEventBus;
