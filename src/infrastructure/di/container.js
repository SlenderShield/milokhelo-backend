/**
 * Dependency Injection Container
 * Simple IoC container for managing dependencies
 * Follows SOLID principles for loose coupling
 */
class DIContainer {
  constructor() {
    this.services = new Map();
    this.singletons = new Map();
  }

  /**
   * Register a service with the container
   * @param {string} name - Service name
   * @param {Function} factory - Factory function that returns the service instance
   * @param {Object} options - Options (singleton: boolean)
   */
  register(name, factory, options = {}) {
    if (typeof factory !== 'function') {
      throw new Error(`Factory for ${name} must be a function`);
    }

    this.services.set(name, {
      factory,
      singleton: options.singleton || false,
    });
  }

  /**
   * Register a singleton service
   * @param {string} name - Service name
   * @param {Function} factory - Factory function that returns the service instance
   */
  registerSingleton(name, factory) {
    this.register(name, factory, { singleton: true });
  }

  /**
   * Register an instance directly (always a singleton)
   * @param {string} name - Service name
   * @param {*} instance - Service instance
   */
  registerInstance(name, instance) {
    this.singletons.set(name, instance);
  }

  /**
   * Resolve a service from the container
   * @param {string} name - Service name
   * @returns {*} Service instance
   */
  resolve(name) {
    // Check if already instantiated as singleton
    if (this.singletons.has(name)) {
      return this.singletons.get(name);
    }

    // Check if registered
    if (!this.services.has(name)) {
      throw new Error(`Service '${name}' not registered in container`);
    }

    const { factory, singleton } = this.services.get(name);

    // Create instance
    const instance = factory(this);

    // Store if singleton
    if (singleton) {
      this.singletons.set(name, instance);
    }

    return instance;
  }

  /**
   * Check if a service is registered
   * @param {string} name - Service name
   * @returns {boolean}
   */
  has(name) {
    return this.services.has(name) || this.singletons.has(name);
  }

  /**
   * Remove a service from the container
   * @param {string} name - Service name
   */
  unregister(name) {
    this.services.delete(name);
    this.singletons.delete(name);
  }

  /**
   * Clear all services
   */
  clear() {
    this.services.clear();
    this.singletons.clear();
  }

  /**
   * Get all registered service names
   * @returns {string[]}
   */
  getRegisteredServices() {
    return [...Array.from(this.services.keys()), ...Array.from(this.singletons.keys())];
  }
}

// Singleton container instance
let containerInstance = null;

function getContainer() {
  if (!containerInstance) {
    containerInstance = new DIContainer();
  }
  return containerInstance;
}

function createContainer() {
  return new DIContainer();
}

export { DIContainer, getContainer, createContainer };
