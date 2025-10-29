/**
 * EventBus Interface
 * Base class for event bus implementations
 */
class IEventBus {
  async publish(_event, _data) {
    throw new Error('publish method must be implemented');
  }

  subscribe(_event, _handler) {
    throw new Error('subscribe method must be implemented');
  }

  unsubscribe(_event, _handler) {
    throw new Error('unsubscribe method must be implemented');
  }

  async close() {
    throw new Error('close method must be implemented');
  }
}

export default IEventBus;