/**
 * Logging Utilities
 * Helper functions for structured logging
 */

/**
 * Format error for logging
 * @param {Error} error - Error object
 * @returns {object} Formatted error
 */
export function formatError(error) {
  if (!(error instanceof Error)) {
    return { message: String(error) };
  }

  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    code: error.code,
    ...(error.statusCode && { statusCode: error.statusCode }),
    ...(error.details && { details: error.details }),
  };
}

/**
 * Format database query for logging
 * @param {string} operation - Database operation (find, insert, update, delete)
 * @param {string} collection - Collection/table name
 * @param {object} filter - Query filter
 * @returns {object} Formatted query info
 */
export function formatDatabaseQuery(operation, collection, filter = {}) {
  return {
    operation,
    collection,
    filter: sanitizeFilter(filter),
    type: 'database_query',
  };
}

/**
 * Sanitize filter to avoid logging sensitive data
 * @param {object} filter - Query filter
 * @returns {object} Sanitized filter
 */
function sanitizeFilter(filter) {
  const sanitized = { ...filter };

  // Remove password fields
  if (sanitized.password) sanitized.password = '[FILTERED]';
  if (sanitized.$or) {
    sanitized.$or = sanitized.$or.map((f) => sanitizeFilter(f));
  }

  return sanitized;
}

/**
 * Format API call for logging
 * @param {string} method - HTTP method
 * @param {string} url - URL
 * @param {number} statusCode - Response status code
 * @param {number} duration - Duration in ms
 * @returns {object} Formatted API call info
 */
export function formatApiCall(method, url, statusCode, duration) {
  return {
    method,
    url,
    statusCode,
    duration,
    type: 'api_call',
  };
}

/**
 * Format event for logging
 * @param {string} eventName - Event name
 * @param {object} data - Event data
 * @returns {object} Formatted event info
 */
export function formatEvent(eventName, data = {}) {
  return {
    eventName,
    eventData: data,
    type: 'event',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Format user action for audit logging
 * @param {string} userId - User ID
 * @param {string} action - Action performed
 * @param {object} details - Action details
 * @returns {object} Formatted audit info
 */
export function formatAuditLog(userId, action, details = {}) {
  return {
    userId,
    action,
    details,
    type: 'audit',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Format security event for logging
 * @param {string} event - Security event type
 * @param {object} details - Event details
 * @returns {object} Formatted security event
 */
export function formatSecurityEvent(event, details = {}) {
  return {
    event,
    details,
    type: 'security',
    severity: determineSeverity(event),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Determine severity of security event
 * @param {string} event - Security event type
 * @returns {string} Severity level
 */
function determineSeverity(event) {
  const highSeverityEvents = [
    'unauthorized_access',
    'brute_force_attempt',
    'sql_injection',
    'xss_attempt',
  ];

  if (highSeverityEvents.some((e) => event.toLowerCase().includes(e))) {
    return 'high';
  }

  return 'medium';
}

/**
 * Create correlation context for distributed tracing
 * @param {string} requestId - Request ID
 * @param {string} userId - User ID
 * @param {string} sessionId - Session ID
 * @returns {object} Correlation context
 */
export function createCorrelationContext(requestId, userId = null, sessionId = null) {
  return {
    requestId,
    ...(userId && { userId }),
    ...(sessionId && { sessionId }),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Measure and log async operation
 * @param {Function} logger - Logger instance
 * @param {string} operationName - Name of operation
 * @param {Function} operation - Async operation to measure
 * @param {object} meta - Additional metadata
 * @returns {Promise} Operation result
 */
export async function measureOperation(logger, operationName, operation, meta = {}) {
  const startTime = Date.now();

  try {
    const result = await operation();
    const duration = Date.now() - startTime;

    logger.info(`${operationName} completed`, {
      operation: operationName,
      duration,
      success: true,
      ...meta,
    });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error(`${operationName} failed`, {
      operation: operationName,
      duration,
      success: false,
      error: formatError(error),
      ...meta,
    });

    throw error;
  }
}

/**
 * Create performance summary
 * @param {object} metrics - Performance metrics
 * @returns {object} Performance summary
 */
export function createPerformanceSummary(metrics) {
  return {
    type: 'performance',
    metrics,
    timestamp: new Date().toISOString(),
  };
}
