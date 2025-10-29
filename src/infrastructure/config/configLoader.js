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
    this.config = this.loadConfig();
    this.validateConfig();
  }

  loadEnvironmentVariables() {
    // Load base .env file
    dotenv.config();

    // Load environment-specific .env file
    const envFile = `.env.${this.env}`;
    dotenv.config({ path: envFile, override: true });
  }

  loadConfig() {
    try {
      // Load environment-specific configuration
      const envConfig = require(`./env/${this.env}`);
      return envConfig;
    } catch (error) {
      console.error(`Failed to load config for environment: ${this.env}`);
      throw error;
    }
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
      if (this.config.redis.host === 'localhost' || this.config.redis.host === '127.0.0.1') {
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

module.exports = ConfigLoader;
