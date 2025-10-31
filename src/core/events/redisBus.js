/**
 * Redis EventBus Implementation
 * Suitable for distributed applications and microservices
 * Uses Redis Pub/Sub for event distribution
 * 
 * Features:
 * - Event metadata (traceId, timestamp, source)
 * - Retry mechanism with exponential backoff
 * - Dead Letter Queue (DLQ) using Redis Lists
 */
import { createClient } from 'redis';
import crypto from 'crypto';
import IEventBus from './IEventBus.js';

class RedisEventBus extends IEventBus {
  constructor(config, logger, options = {}) {
    super();
    this.config = config;
    this.logger = logger;
    this.handlers = new Map(); // event -> Set of handlers
    this.publisher = null;
    this.subscriber = null;
    this.dlqClient = null;
    this.isConnected = false;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.dlqKey = 'eventbus:dlq';
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
      
      // Duplicate for DLQ operations
      this.dlqClient = this.publisher.duplicate();

      // Connection event handlers
      this.publisher.on('error', (error) => {
        this.logger.error('Redis publisher error', { error: error.message });
      });

      this.subscriber.on('error', (error) => {
        this.logger.error('Redis subscriber error', { error: error.message });
      });

      this.dlqClient.on('error', (error) => {
        this.logger.error('Redis DLQ client error', { error: error.message });
      });

      this.publisher.on('ready', () => {
        this.logger.info('Redis publisher ready');
      });

      this.subscriber.on('ready', () => {
        this.logger.info('Redis subscriber ready');
      });

      this.dlqClient.on('ready', () => {
        this.logger.info('Redis DLQ client ready');
      });

      // Connect all clients
      await this.publisher.connect();
      await this.subscriber.connect();
      await this.dlqClient.connect();

      this.isConnected = true;
      this.logger.info('RedisEventBus connected');
    } catch (error) {
      this.logger.error('Failed to connect to Redis', { error: error.message });
      throw error;
    }
  }

  async handleMessage(event, message) {
    try {
      const envelope = JSON.parse(message);
      const { data, metadata } = envelope;
      const handlers = this.handlers.get(event);
      if (!handlers || handlers.size === 0) return;

      const promises = Array.from(handlers).map(async (handler) => {
        return this._executeHandlerWithRetry(handler, event, data, metadata);
      });

      await Promise.all(promises);
    } catch (error) {
      this.logger.error(`Error handling message for event: ${event}`, {
        event,
        error: error.message,
      });
    }
  }

  /**
   * Execute handler with retry mechanism
   */
  async _executeHandlerWithRetry(handler, event, data, metadata) {
    let lastError;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        await handler(data, metadata);
        
        if (attempt > 0) {
          this.logger.info(`Event handler succeeded after ${attempt} retries`, {
            event,
            eventId: metadata.eventId,
            traceId: metadata.traceId,
            attempt,
          });
        }
        return;
      } catch (error) {
        lastError = error;
        
        this.logger.warn(`Event handler failed (attempt ${attempt + 1}/${this.maxRetries + 1})`, {
          event,
          eventId: metadata.eventId,
          traceId: metadata.traceId,
          error: error.message,
          attempt: attempt + 1,
        });

        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    await this._moveToDeadLetterQueue(event, data, metadata, lastError);
  }

  /**
   * Move failed event to Redis DLQ
   */
  async _moveToDeadLetterQueue(event, data, metadata, error) {
    const dlqEntry = {
      event,
      data,
      metadata,
      error: {
        message: error.message,
        stack: error.stack,
      },
      enqueuedAt: new Date().toISOString(),
    };

    try {
      await this.dlqClient.lPush(this.dlqKey, JSON.stringify(dlqEntry));
      
      this.logger.error(`Event moved to DLQ after ${this.maxRetries} retries`, {
        event,
        eventId: metadata.eventId,
        traceId: metadata.traceId,
        error: error.message,
      });
    } catch (dlqError) {
      this.logger.error('Failed to move event to DLQ', {
        event,
        error: dlqError.message,
      });
    }
  }

  async publish(event, data, metadata = {}) {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      // Enrich with metadata
      const enrichedMetadata = {
        eventId: crypto.randomUUID(),
        eventName: event,
        timestamp: new Date().toISOString(),
        source: metadata.source || 'unknown',
        traceId: metadata.traceId || crypto.randomUUID(),
        retryCount: metadata.retryCount || 0,
      };

      const envelope = {
        data,
        metadata: enrichedMetadata,
      };

      const message = JSON.stringify(envelope);
      await this.publisher.publish(event, message);
      
      this.logger.debug(`Published event: ${event}`, {
        event,
        eventId: enrichedMetadata.eventId,
        traceId: enrichedMetadata.traceId,
        source: enrichedMetadata.source,
        dataKeys: Object.keys(data || {}),
      });
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
      if (this.dlqClient?.isOpen) {
        await this.dlqClient.quit();
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

  /**
   * Get Dead Letter Queue entries
   */
  async getDeadLetterQueue(limit = 100) {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      const entries = await this.dlqClient.lRange(this.dlqKey, 0, limit - 1);
      return entries.map((entry) => JSON.parse(entry));
    } catch (error) {
      this.logger.error('Failed to get DLQ entries', { error: error.message });
      return [];
    }
  }

  /**
   * Replay event from DLQ
   */
  async replayFromDLQ(eventId) {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      const entries = await this.dlqClient.lRange(this.dlqKey, 0, -1);
      
      for (let i = 0; i < entries.length; i++) {
        const entry = JSON.parse(entries[i]);
        
        if (entry.metadata.eventId === eventId) {
          // Remove from DLQ
          await this.dlqClient.lRem(this.dlqKey, 1, entries[i]);

          this.logger.info('Replaying event from DLQ', {
            event: entry.event,
            eventId: entry.metadata.eventId,
            traceId: entry.metadata.traceId,
          });

          // Reset retry count and replay
          const metadata = {
            ...entry.metadata,
            retryCount: 0,
            replayedAt: new Date().toISOString(),
          };

          await this.publish(entry.event, entry.data, metadata);
          return;
        }
      }

      throw new Error(`Event ${eventId} not found in DLQ`);
    } catch (error) {
      this.logger.error('Failed to replay event from DLQ', { error: error.message });
      throw error;
    }
  }

  /**
   * Clear DLQ
   */
  async clearDeadLetterQueue() {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      const count = await this.dlqClient.lLen(this.dlqKey);
      await this.dlqClient.del(this.dlqKey);
      this.logger.info(`Cleared ${count} events from DLQ`);
      return count;
    } catch (error) {
      this.logger.error('Failed to clear DLQ', { error: error.message });
      throw error;
    }
  }
}

export default RedisEventBus;
