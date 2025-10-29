/**
 * Test Environment Configuration
 */
export default {
  env: 'test',

  app: {
    name: process.env.APP_NAME || 'milokhelo-backend',
    port: parseInt(process.env.PORT || '4001', 10),
    host: process.env.HOST || 'localhost',
    apiPrefix: process.env.API_PREFIX || '/api/v1',
  },

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/milokhelo_test',
    options: {
      // Mongoose 6+ handles these automatically
    },
  },

  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '1', 10),
  },

  logging: {
    level: process.env.LOG_LEVEL || 'error',
    format: process.env.LOG_FORMAT || 'json',
    enabled: process.env.LOGGING_ENABLED !== 'false',
  },

  eventBus: {
    adapter: process.env.EVENT_BUS_ADAPTER || 'memory',
  },

  security: {
    corsOrigins: ['http://localhost:3000'],
    enableRateLimit: false, // Disable rate limiting in tests
    rateLimitWindowMs: 900000,
    rateLimitMax: 1000,
    authRateLimitWindowMs: 900000,
    authRateLimitMax: 50,
  },

  features: {
    enableMetrics: process.env.ENABLE_METRICS === 'true',
    enableHealthCheck: process.env.ENABLE_HEALTH_CHECK !== 'false',
  },
};
