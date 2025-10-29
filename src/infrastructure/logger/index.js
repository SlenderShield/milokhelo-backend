/**
 * Centralized Logging System
 * Using Winston for structured logging
 * Supports different formats and levels based on environment
 */
const winston = require('winston');
const path = require('path');

class Logger {
  constructor(config = {}) {
    this.config = config;
    this.logger = this.createLogger();
  }

  createLogger() {
    const { level = 'info', format: formatType = 'json', env = 'development' } = this.config;

    // Define log format
    const formats = [];

    // Add timestamp
    formats.push(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }));

    // Add errors format
    formats.push(winston.format.errors({ stack: true }));

    // Add format based on environment
    if (formatType === 'json') {
      formats.push(winston.format.json());
    } else {
      formats.push(
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
          return `${timestamp} [${level.toUpperCase()}]: ${message} ${metaString}`;
        })
      );
    }

    // Console format for development
    if (env === 'development') {
      formats.push(winston.format.colorize({ all: true }));
    }

    // Define transports
    const transports = [];

    // Console transport
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(...formats),
      })
    );

    // File transports for production
    if (env === 'production') {
      transports.push(
        new winston.transports.File({
          filename: path.join(process.cwd(), 'logs', 'error.log'),
          level: 'error',
          format: winston.format.json(),
        })
      );
      transports.push(
        new winston.transports.File({
          filename: path.join(process.cwd(), 'logs', 'combined.log'),
          format: winston.format.json(),
        })
      );
    }

    return winston.createLogger({
      level,
      transports,
      exitOnError: false,
    });
  }

  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  error(message, meta = {}) {
    this.logger.error(message, meta);
  }

  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }

  verbose(message, meta = {}) {
    this.logger.verbose(message, meta);
  }

  // Create child logger with context
  child(context) {
    return new ChildLogger(this.logger, context);
  }
}

class ChildLogger {
  constructor(logger, context) {
    this.logger = logger;
    this.context = context;
  }

  info(message, meta = {}) {
    this.logger.info(message, { ...this.context, ...meta });
  }

  error(message, meta = {}) {
    this.logger.error(message, { ...this.context, ...meta });
  }

  warn(message, meta = {}) {
    this.logger.warn(message, { ...this.context, ...meta });
  }

  debug(message, meta = {}) {
    this.logger.debug(message, { ...this.context, ...meta });
  }

  verbose(message, meta = {}) {
    this.logger.verbose(message, { ...this.context, ...meta });
  }
}

// Singleton instance
let loggerInstance = null;

function createLogger(config) {
  if (!loggerInstance) {
    loggerInstance = new Logger(config);
  }
  return loggerInstance;
}

function getLogger() {
  if (!loggerInstance) {
    throw new Error('Logger not initialized. Call createLogger first.');
  }
  return loggerInstance;
}

module.exports = { Logger, createLogger, getLogger };
