/**
 * MongoDB Connection Manager
 * Handles MongoDB connection lifecycle
 */
const mongoose = require('mongoose');

class MongoDBManager {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected) {
      this.logger.info('MongoDB already connected');
      return;
    }

    try {
      mongoose.set('strictQuery', false);

      // Connection event handlers
      mongoose.connection.on('connected', () => {
        this.logger.info('MongoDB connected successfully');
        this.isConnected = true;
      });

      mongoose.connection.on('error', (err) => {
        this.logger.error('MongoDB connection error', { error: err.message });
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        this.logger.warn('MongoDB disconnected');
        this.isConnected = false;
      });

      // Handle process termination
      process.on('SIGINT', async () => {
        await this.disconnect();
        process.exit(0);
      });

      await mongoose.connect(this.config.mongodb.uri, this.config.mongodb.options);
      this.logger.info('Connecting to MongoDB...', { uri: this.maskUri(this.config.mongodb.uri) });
    } catch (error) {
      this.logger.error('Failed to connect to MongoDB', { error: error.message });
      throw error;
    }
  }

  async disconnect() {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      this.logger.info('MongoDB disconnected successfully');
    } catch (error) {
      this.logger.error('Error disconnecting from MongoDB', { error: error.message });
      throw error;
    }
  }

  getConnection() {
    return mongoose.connection;
  }

  isHealthy() {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  // Mask sensitive parts of URI for logging
  maskUri(uri) {
    try {
      const url = new URL(uri);
      if (url.password) {
        url.password = '****';
      }
      return url.toString();
    } catch {
      return uri.replace(/:[^:@]+@/, ':****@');
    }
  }
}

module.exports = MongoDBManager;
