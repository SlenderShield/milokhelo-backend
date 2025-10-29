/**
 * Centralized Logging System
 * Using Winston for structured logging
 * Supports different formats, levels, and log rotation based on environment
 *
 * Features:
 * - Structured logging with metadata
 * - Environment-specific formatting
 * - Log rotation and archiving
 * - Performance tracking
 * - Request correlation
 * - Child loggers with context
 */
import winston from 'winston';
import path from 'path';

class Logger {
  constructor(config = {}) {
    this.config = config;
    this.logger = this.createLogger();
    this.performanceTrackers = new Map();
  }

  createLogger() {
    const { level = 'info', env = 'development', logDir = 'logs', format = 'pretty' } = this.config;

    // Define custom formats
    const customFormat = winston.format.printf((info) => {
      // Winston colorize adds a 'level' with color codes, keep original in [Symbol.for('level')]
      const { timestamp, message, context, requestId, duration, ...meta } = info;
      const ts = timestamp || new Date().toISOString();
      const lvl = info[Symbol.for('level')] || info.level || 'info';
      const lvlUpper = lvl.toUpperCase();

      const parts = [`[${ts}]`, `[${lvlUpper}]`];

      if (context) parts.push(`[${context}]`);
      if (requestId) parts.push(`[ReqID: ${requestId}]`);

      parts.push(message);

      if (duration !== undefined) parts.push(`(${duration}ms)`);

      const metaKeys = Object.keys(meta);
      if (metaKeys.length > 0) {
        // Filter out Winston internal fields and symbols
        const filteredMeta = Object.fromEntries(
          Object.entries(meta).filter(
            ([key]) => !['level', 'timestamp', 'message', 'splat'].includes(key)
          )
        );
        if (Object.keys(filteredMeta).length > 0) {
          parts.push('\n' + JSON.stringify(filteredMeta, null, 2));
        }
      }

      return parts.join(' ');
    });

    // Determine if we should use pretty or JSON format
    const usePrettyFormat = format === 'pretty' || (env === 'development' && format !== 'json');

    // Console format - respects the format config
    const consoleFormat = usePrettyFormat
      ? winston.format.combine(
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
          winston.format.errors({ stack: true }),
          winston.format.colorize({ all: true }),
          customFormat
        )
      : winston.format.combine(
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
          winston.format.errors({ stack: true }),
          winston.format.json()
        );

    // JSON format for production/file logs
    const fileFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
      winston.format.errors({ stack: true }),
      winston.format.json()
    );

    // Define transports
    const transports = [];

    // Console transport (always enabled)
    transports.push(
      new winston.transports.Console({
        format: consoleFormat,
        handleExceptions: true,
        handleRejections: true,
      })
    );

    // File transports for production and test
    if (env === 'production' || env === 'test') {
      const logPath = path.join(process.cwd(), logDir);

      // Error logs
      transports.push(
        new winston.transports.File({
          filename: path.join(logPath, 'error.log'),
          level: 'error',
          format: fileFormat,
          maxsize: 5242880, // 5MB
          maxFiles: 5,
          handleExceptions: true,
        })
      );

      // Combined logs
      transports.push(
        new winston.transports.File({
          filename: path.join(logPath, 'combined.log'),
          format: fileFormat,
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        })
      );

      // Separate file for warnings
      transports.push(
        new winston.transports.File({
          filename: path.join(logPath, 'warnings.log'),
          level: 'warn',
          format: fileFormat,
          maxsize: 5242880, // 5MB
          maxFiles: 3,
        })
      );
    }

    return winston.createLogger({
      level,
      transports,
      exitOnError: false,
      silent: this.config.silent || false,
    });
  }

  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  error(message, meta = {}) {
    // Ensure error objects are properly logged
    if (meta.error instanceof Error) {
      meta.error = {
        message: meta.error.message,
        stack: meta.error.stack,
        ...meta.error,
      };
    }
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

  /**
   * Log HTTP request
   */
  http(message, meta = {}) {
    this.logger.http(message, meta);
  }

  /**
   * Start performance tracking
   * @param {string} label - Unique label for the operation
   * @param {object} meta - Additional metadata
   * @returns {string} trackingId
   */
  startTimer(label, meta = {}) {
    const trackingId = `${label}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.performanceTrackers.set(trackingId, {
      label,
      startTime: Date.now(),
      meta,
    });
    this.debug(`Started timer: ${label}`, { trackingId, ...meta });
    return trackingId;
  }

  /**
   * End performance tracking and log duration
   * @param {string} trackingId - ID returned from startTimer
   * @param {object} additionalMeta - Additional metadata to log
   */
  endTimer(trackingId, additionalMeta = {}) {
    const tracker = this.performanceTrackers.get(trackingId);
    if (!tracker) {
      this.warn(`Timer not found: ${trackingId}`);
      return;
    }

    const duration = Date.now() - tracker.startTime;
    this.performanceTrackers.delete(trackingId);

    this.info(`Completed: ${tracker.label}`, {
      duration,
      ...tracker.meta,
      ...additionalMeta,
    });

    return duration;
  }

  /**
   * Log with performance timing
   * @param {string} label - Label for the operation
   * @param {Function} fn - Function to execute and time
   * @param {object} meta - Additional metadata
   */
  async logWithTiming(label, fn, meta = {}) {
    const trackingId = this.startTimer(label, meta);
    try {
      const result = await fn();
      this.endTimer(trackingId, { success: true });
      return result;
    } catch (error) {
      this.endTimer(trackingId, { success: false, error: error.message });
      throw error;
    }
  }

  /**
   * Log structured event
   * @param {string} eventName - Name of the event
   * @param {object} data - Event data
   */
  logEvent(eventName, data = {}) {
    this.info(`Event: ${eventName}`, {
      eventName,
      eventType: 'business_event',
      ...data,
    });
  }

  /**
   * Log security event
   * @param {string} action - Security action
   * @param {object} details - Security event details
   */
  security(action, details = {}) {
    this.warn(`Security: ${action}`, {
      securityEvent: true,
      action,
      timestamp: new Date().toISOString(),
      ...details,
    });
  }

  /**
   * Log audit trail
   * @param {string} action - Action performed
   * @param {object} details - Audit details
   */
  audit(action, details = {}) {
    this.info(`Audit: ${action}`, {
      auditLog: true,
      action,
      timestamp: new Date().toISOString(),
      ...details,
    });
  }

  // Create child logger with context
  child(context) {
    return new ChildLogger(this.logger, context, this.performanceTrackers);
  }
}

class ChildLogger {
  constructor(logger, context, performanceTrackers) {
    this.logger = logger;
    this.context = context;
    this.performanceTrackers = performanceTrackers;
  }

  _addContext(meta) {
    return { ...this.context, ...meta };
  }

  info(message, meta = {}) {
    this.logger.info(message, this._addContext(meta));
  }

  error(message, meta = {}) {
    // Ensure error objects are properly logged
    if (meta.error instanceof Error) {
      meta.error = {
        message: meta.error.message,
        stack: meta.error.stack,
        ...meta.error,
      };
    }
    this.logger.error(message, this._addContext(meta));
  }

  warn(message, meta = {}) {
    this.logger.warn(message, this._addContext(meta));
  }

  debug(message, meta = {}) {
    this.logger.debug(message, this._addContext(meta));
  }

  verbose(message, meta = {}) {
    this.logger.verbose(message, this._addContext(meta));
  }

  http(message, meta = {}) {
    this.logger.http(message, this._addContext(meta));
  }

  startTimer(label, meta = {}) {
    const trackingId = `${label}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.performanceTrackers.set(trackingId, {
      label,
      startTime: Date.now(),
      meta: this._addContext(meta),
    });
    this.debug(`Started timer: ${label}`, { trackingId, ...meta });
    return trackingId;
  }

  endTimer(trackingId, additionalMeta = {}) {
    const tracker = this.performanceTrackers.get(trackingId);
    if (!tracker) {
      this.warn(`Timer not found: ${trackingId}`);
      return;
    }

    const duration = Date.now() - tracker.startTime;
    this.performanceTrackers.delete(trackingId);

    this.info(`Completed: ${tracker.label}`, {
      duration,
      ...tracker.meta,
      ...additionalMeta,
    });

    return duration;
  }

  async logWithTiming(label, fn, meta = {}) {
    const trackingId = this.startTimer(label, meta);
    try {
      const result = await fn();
      this.endTimer(trackingId, { success: true });
      return result;
    } catch (error) {
      this.endTimer(trackingId, { success: false, error: error.message });
      throw error;
    }
  }

  logEvent(eventName, data = {}) {
    this.info(`Event: ${eventName}`, {
      eventName,
      eventType: 'business_event',
      ...data,
    });
  }

  security(action, details = {}) {
    this.warn(`Security: ${action}`, {
      securityEvent: true,
      action,
      timestamp: new Date().toISOString(),
      ...details,
    });
  }

  audit(action, details = {}) {
    this.info(`Audit: ${action}`, {
      auditLog: true,
      action,
      timestamp: new Date().toISOString(),
      ...details,
    });
  }

  // Create nested child logger
  child(additionalContext) {
    return new ChildLogger(
      this.logger,
      { ...this.context, ...additionalContext },
      this.performanceTrackers
    );
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

export { Logger, createLogger, getLogger };
