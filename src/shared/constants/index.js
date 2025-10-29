/**
 * Application Constants
 * Centralized location for application-wide constants
 */

// Event names
const EVENTS = {
  // System events
  SYSTEM: {
    STARTUP: 'system.startup',
    SHUTDOWN: 'system.shutdown',
    HEALTH_CHECK: 'system.health_check',
  },

  // Example module events (for demonstration)
  EXAMPLE: {
    CREATED: 'example.created',
    UPDATED: 'example.updated',
    DELETED: 'example.deleted',
  },

  // Add your module events here
};

// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// Error Codes
const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
};

module.exports = {
  EVENTS,
  HTTP_STATUS,
  ERROR_CODES,
};
