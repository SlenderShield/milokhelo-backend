/**
 * Integration Tests for EventBus
 */
import { describe, it, beforeEach } from 'mocha';
import { createMockLogger } from '../helpers/setup.js';
import InMemoryEventBus from '../../src/core/events/inMemoryBus.js';

describe('EventBus Integration Tests', () => {
  let eventBus;
  let logger;

  beforeEach(() => {
    logger = createMockLogger();
    eventBus = new InMemoryEventBus(logger);
  });

  describe('InMemoryEventBus', () => {
    it('should publish and subscribe to events', async () => {
      const handler = sinon.stub();
      const eventData = { id: 1, name: 'test' };

      // Subscribe to event
      eventBus.subscribe('test.event', handler);

      // Publish event
      await eventBus.publish('test.event', eventData);

      // Verify handler was called with correct data
      expect(handler.calledOnce).to.be.true;
      expect(handler.firstCall.args[0]).to.deep.equal(eventData);
    });

    it('should support multiple subscribers', async () => {
      const handler1 = sinon.stub();
      const handler2 = sinon.stub();
      const eventData = { message: 'hello' };

      eventBus.subscribe('multi.event', handler1);
      eventBus.subscribe('multi.event', handler2);

      await eventBus.publish('multi.event', eventData);

      expect(handler1.calledOnce).to.be.true;
      expect(handler2.calledOnce).to.be.true;
      expect(handler1.firstCall.args[0]).to.deep.equal(eventData);
      expect(handler2.firstCall.args[0]).to.deep.equal(eventData);
    });

    it('should allow unsubscribing from events', async () => {
      const handler = sinon.stub();

      eventBus.subscribe('unsub.event', handler);
      eventBus.unsubscribe('unsub.event', handler);

      await eventBus.publish('unsub.event', { data: 'test' });

      expect(handler.called).to.be.false;
    });

    it('should handle errors in event handlers gracefully', async () => {
      const errorHandler = sinon.stub().throws(new Error('Handler error'));
      const successHandler = sinon.stub();

      eventBus.subscribe('error.event', errorHandler);
      eventBus.subscribe('error.event', successHandler);

      await eventBus.publish('error.event', { data: 'test' });

      // Error handler should have been called
      expect(errorHandler.calledOnce).to.be.true;
      // Success handler should still be called despite first handler error
      expect(successHandler.calledOnce).to.be.true;
      // Logger should have logged the error
      expect(logger.error.called).to.be.true;
    });

    it('should do nothing when publishing to event with no subscribers', async () => {
      // Should not throw
      await eventBus.publish('no.subscribers', { data: 'test' });
      expect(logger.debug.called).to.be.true;
    });
  });
});
