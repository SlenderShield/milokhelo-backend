/**
 * Development Environment Configuration
 */
export default {
  env: 'development',

  app: {
    name: process.env.APP_NAME || 'milokhelo-backend',
    port: parseInt(process.env.PORT || '4000', 10),
    host: process.env.HOST || 'localhost',
    apiPrefix: process.env.API_PREFIX || '/api',
  },

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/milokhelo_dev',
    options: {
      // Mongoose 6+ handles these automatically
    },
  },

  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },

  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    format: process.env.LOG_FORMAT || 'json',
    enabled: process.env.LOGGING_ENABLED !== 'false',
  },

  eventBus: {
    adapter: process.env.EVENT_BUS_ADAPTER || 'memory', // 'memory' or 'redis'
  },

  features: {
    enableMetrics: process.env.ENABLE_METRICS === 'true',
    enableHealthCheck: process.env.ENABLE_HEALTH_CHECK !== 'false',
  },
};
