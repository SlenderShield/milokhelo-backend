/**
 * Configuration Loader
 * Loads and validates configuration based on NODE_ENV
 * Supports: development, test, production
 */
const dotenv = require('dotenv');

class ConfigLoader {
  constructor() {
    this.env = process.env.NODE_ENV || 'development';
    this.loadEnvironmentVariables();
    this.config = this.buildConfig();
    this.validateConfig();
  }

  loadEnvironmentVariables() {
    // Load base .env file
    dotenv.config();

    // Load environment-specific .env file
    const envFile = `.env.${this.env}`;
    dotenv.config({ path: envFile, override: true });
  }

  buildConfig() {
    return {
      env: this.env,

      app: {
        name: process.env.APP_NAME || 'milokhelo-backend',
        port: parseInt(process.env.PORT || '3000', 10),
        host: process.env.HOST || 'localhost',
        apiPrefix: process.env.API_PREFIX || '/api',
      },

      mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/milokhelo',
        options: {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        },
      },

      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB || '0', 10),
      },

      logging: {
        level: process.env.LOG_LEVEL || (this.env === 'production' ? 'info' : 'debug'),
        format: process.env.LOG_FORMAT || 'json',
        enabled: process.env.LOGGING_ENABLED !== 'false',
      },

      eventBus: {
        adapter: process.env.EVENT_BUS_ADAPTER || 'memory', // 'memory' or 'redis'
      },

      // Feature flags
      features: {
        enableMetrics: process.env.ENABLE_METRICS === 'true',
        enableHealthCheck: process.env.ENABLE_HEALTH_CHECK !== 'false',
      },
    };
  }

  validateConfig() {
    // Validate required configuration
    if (!this.config.app.name) {
      throw new Error('APP_NAME is required');
    }

    if (this.config.env === 'production') {
      if (this.config.mongodb.uri.includes('localhost')) {
        console.warn('⚠️  Warning: Using localhost MongoDB in production');
      }
      if (this.config.redis.host === 'localhost') {
        console.warn('⚠️  Warning: Using localhost Redis in production');
      }
    }
  }

  get(key) {
    const keys = key.split('.');
    let value = this.config;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return undefined;
      }
    }

    return value;
  }

  getAll() {
    return { ...this.config };
  }

  isProduction() {
    return this.env === 'production';
  }

  isDevelopment() {
    return this.env === 'development';
  }

  isTest() {
    return this.env === 'test';
  }
}

// Singleton instance
let configInstance = null;

function getConfig() {
  if (!configInstance) {
    configInstance = new ConfigLoader();
  }
  return configInstance;
}

module.exports = { ConfigLoader, getConfig };
