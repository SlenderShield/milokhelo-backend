/**
 * Test Setup and Utilities
 * Global test configuration and helper functions
 */
import { expect } from 'chai';
import sinon from 'sinon';

// Make expect and sinon available globally in tests
global.expect = expect;
global.sinon = sinon;

// Set test environment
process.env.NODE_ENV = 'test';

// Increase timeout for integration tests
export const TEST_TIMEOUT = 10000;

// Mock logger for tests
export function createMockLogger() {
  return {
    info: sinon.stub(),
    error: sinon.stub(),
    warn: sinon.stub(),
    debug: sinon.stub(),
    verbose: sinon.stub(),
    child: sinon.stub().returns({
      info: sinon.stub(),
      error: sinon.stub(),
      warn: sinon.stub(),
      debug: sinon.stub(),
      verbose: sinon.stub(),
    }),
  };
}

// Mock config for tests
export function createMockConfig(overrides = {}) {
  const defaults = {
    env: 'test',
    app: {
      name: 'test-app',
      port: 4001,
      host: 'localhost',
      apiPrefix: '/api',
    },
    mongodb: {
      uri: 'mongodb://localhost:27017/test_db',
    },
    redis: {
      host: 'localhost',
      port: 6379,
      db: 1,
    },
    logging: {
      level: 'error',
      format: 'json',
    },
    eventBus: {
      adapter: 'memory',
    },
    security: {
      corsOrigins: ['http://localhost:3000'],
      enableRateLimit: false,
    },
    features: {
      enableHealthCheck: true,
      enableMetrics: false,
    },
  };

  const merged = { ...defaults, ...overrides };

  return {
    get: sinon.stub().callsFake((key) => {
      const keys = key.split('.');
      let value = merged;
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          return undefined;
        }
      }
      return value;
    }),
    getAll: sinon.stub().returns(merged),
    env: merged.env,
  };
}

// Cleanup function to run after each test
export function cleanup() {
  sinon.restore();
}
