/**
 * In-Memory EventBus Implementation
 * Suitable for single-instance applications and development
 * 
 * Features:
 * - Event metadata (traceId, timestamp, source)
 * - Retry mechanism with exponential backoff
 * - Dead Letter Queue (DLQ) for failed events
 */
import IEventBus from './IEventBus.js';
import crypto from 'crypto';

class InMemoryEventBus extends IEventBus {
  constructor(logger, options = {}) {
    super();
    this.logger = logger;
    this.handlers = new Map(); // event -> Set of handlers
    this.dlq = []; // Dead Letter Queue for failed events
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000; // Base delay in ms
  }

  /**
   * Publish event with metadata
   */
  async publish(event, data, metadata = {}) {
    // Add event metadata
    const enrichedMetadata = {
      eventId: crypto.randomUUID(),
      eventName: event,
      timestamp: new Date().toISOString(),
      source: metadata.source || 'unknown',
      traceId: metadata.traceId || crypto.randomUUID(),
      retryCount: metadata.retryCount || 0,
    };

    this.logger.debug(`Publishing event: ${event}`, {
      event,
      eventId: enrichedMetadata.eventId,
      traceId: enrichedMetadata.traceId,
      source: enrichedMetadata.source,
      dataKeys: Object.keys(data || {}),
    });

    const handlers = this.handlers.get(event);
    if (!handlers || handlers.size === 0) {
      this.logger.debug(`No handlers registered for event: ${event}`);
      return;
    }

    // Execute all handlers asynchronously with retry logic
    const promises = Array.from(handlers).map(async (handler) => {
      return this._executeHandlerWithRetry(handler, event, data, enrichedMetadata);
    });

    await Promise.all(promises);
  }

  /**
   * Execute handler with retry mechanism
   */
  async _executeHandlerWithRetry(handler, event, data, metadata) {
    let lastError;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        await handler(data, metadata);
        
        // Log successful execution after retry
        if (attempt > 0) {
          this.logger.info(`Event handler succeeded after ${attempt} retries`, {
            event,
            eventId: metadata.eventId,
            traceId: metadata.traceId,
            attempt,
          });
        }
        return; // Success
      } catch (error) {
        lastError = error;
        
        this.logger.warn(`Event handler failed (attempt ${attempt + 1}/${this.maxRetries + 1})`, {
          event,
          eventId: metadata.eventId,
          traceId: metadata.traceId,
          error: error.message,
          attempt: attempt + 1,
        });

        // If not the last attempt, wait before retrying (exponential backoff)
        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed, move to DLQ
    this._moveToDeadLetterQueue(event, data, metadata, lastError);
  }

  /**
   * Move failed event to Dead Letter Queue
   */
  _moveToDeadLetterQueue(event, data, metadata, error) {
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

    this.dlq.push(dlqEntry);
    
    this.logger.error(`Event moved to DLQ after ${this.maxRetries} retries`, {
      event,
      eventId: metadata.eventId,
      traceId: metadata.traceId,
      error: error.message,
      dlqSize: this.dlq.length,
    });
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

  /**
   * Get Dead Letter Queue entries
   */
  getDeadLetterQueue() {
    return [...this.dlq];
  }

  /**
   * Replay event from DLQ
   */
  async replayFromDLQ(eventId) {
    const index = this.dlq.findIndex((entry) => entry.metadata.eventId === eventId);
    
    if (index === -1) {
      throw new Error(`Event ${eventId} not found in DLQ`);
    }

    const entry = this.dlq[index];
    this.dlq.splice(index, 1);

    this.logger.info('Replaying event from DLQ', {
      event: entry.event,
      eventId: entry.metadata.eventId,
      traceId: entry.metadata.traceId,
    });

    // Reset retry count for replay
    const metadata = {
      ...entry.metadata,
      retryCount: 0,
      replayedAt: new Date().toISOString(),
    };

    await this.publish(entry.event, entry.data, metadata);
  }

  /**
   * Clear DLQ
   */
  clearDeadLetterQueue() {
    const count = this.dlq.length;
    this.dlq = [];
    this.logger.info(`Cleared ${count} events from DLQ`);
    return count;
  }
}

export default InMemoryEventBus;
