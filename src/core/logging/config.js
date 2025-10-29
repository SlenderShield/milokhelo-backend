/**
 * Logging Configuration
 * Centralized configuration for logging behavior
 */

export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  HTTP: 'http',
  VERBOSE: 'verbose',
  DEBUG: 'debug',
  SILLY: 'silly',
};

export const LOG_FORMATS = {
  JSON: 'json',
  PRETTY: 'pretty',
};

/**
 * Get logging configuration based on environment
 * @param {string} env - Environment name
 * @returns {object} Logging configuration
 */
export function getLoggingConfig(env = 'development') {
  const baseConfig = {
    logDir: 'logs',
    maxFileSize: 5242880, // 5MB
    maxFiles: 5,
  };

  switch (env) {
    case 'production':
      return {
        ...baseConfig,
        level: LOG_LEVELS.INFO,
        format: LOG_FORMATS.JSON,
        enableConsole: true,
        enableFile: true,
        enableErrorFile: true,
        enableWarningFile: true,
        silent: false,
      };

    case 'test':
      return {
        ...baseConfig,
        level: LOG_LEVELS.ERROR,
        format: LOG_FORMATS.JSON,
        enableConsole: false,
        enableFile: true,
        enableErrorFile: true,
        enableWarningFile: false,
        silent: false, // Set to true to suppress all logs during tests
      };

    case 'development':
    default:
      return {
        ...baseConfig,
        level: LOG_LEVELS.DEBUG,
        format: LOG_FORMATS.PRETTY,
        enableConsole: true,
        enableFile: false,
        enableErrorFile: false,
        enableWarningFile: false,
        silent: false,
      };
  }
}

/**
 * Log levels for different HTTP status codes
 */
export const HTTP_STATUS_LOG_LEVELS = {
  5: LOG_LEVELS.ERROR, // 5xx
  4: LOG_LEVELS.WARN,  // 4xx
  3: LOG_LEVELS.INFO,  // 3xx
  2: LOG_LEVELS.INFO,  // 2xx
  1: LOG_LEVELS.INFO,  // 1xx
};

/**
 * Get log level for HTTP status code
 * @param {number} statusCode - HTTP status code
 * @returns {string} Log level
 */
export function getLogLevelForStatus(statusCode) {
  const category = Math.floor(statusCode / 100);
  return HTTP_STATUS_LOG_LEVELS[category] || LOG_LEVELS.INFO;
}

/**
 * Sensitive fields that should be redacted from logs
 */
export const SENSITIVE_FIELDS = [
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'apiKey',
  'secret',
  'creditCard',
  'ssn',
  'authorization',
];

/**
 * Redact sensitive information from object
 * @param {object} obj - Object to redact
 * @returns {object} Redacted object
 */
export function redactSensitiveInfo(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  const redacted = Array.isArray(obj) ? [...obj] : { ...obj };

  for (const key in redacted) {
    const lowerKey = key.toLowerCase();
    
    if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field.toLowerCase()))) {
      redacted[key] = '[REDACTED]';
    } else if (typeof redacted[key] === 'object' && redacted[key] !== null) {
      redacted[key] = redactSensitiveInfo(redacted[key]);
    }
  }

  return redacted;
}
