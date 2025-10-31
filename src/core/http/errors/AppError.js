/**
 * Application Error Base Class
 * Provides consistent error structure with classification
 * 
 * Features:
 * - errorCode: Machine-readable error code
 * - statusCode: HTTP status code
 * - isOperational: Whether error is operational (expected) or programming error
 * - context: Additional error context
 */

export class AppError extends Error {
  constructor(message, options = {}) {
    super(message);
    
    this.name = this.constructor.name;
    this.errorCode = options.errorCode || 'INTERNAL_ERROR';
    this.statusCode = options.statusCode || 500;
    this.isOperational = options.isOperational !== undefined ? options.isOperational : true;
    this.context = options.context || {};
    
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: {
        name: this.name,
        message: this.message,
        code: this.errorCode,
        statusCode: this.statusCode,
        context: this.context,
        ...(process.env.NODE_ENV !== 'production' && { stack: this.stack }),
      },
    };
  }
}

// Common application errors
export class ValidationError extends AppError {
  constructor(message, context = {}) {
    super(message, {
      errorCode: 'VALIDATION_ERROR',
      statusCode: 400,
      isOperational: true,
      context,
    });
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required', context = {}) {
    super(message, {
      errorCode: 'AUTHENTICATION_ERROR',
      statusCode: 401,
      isOperational: true,
      context,
    });
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Access forbidden', context = {}) {
    super(message, {
      errorCode: 'AUTHORIZATION_ERROR',
      statusCode: 403,
      isOperational: true,
      context,
    });
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource', context = {}) {
    super(`${resource} not found`, {
      errorCode: 'NOT_FOUND',
      statusCode: 404,
      isOperational: true,
      context,
    });
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', context = {}) {
    super(message, {
      errorCode: 'CONFLICT',
      statusCode: 409,
      isOperational: true,
      context,
    });
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests', context = {}) {
    super(message, {
      errorCode: 'RATE_LIMIT_EXCEEDED',
      statusCode: 429,
      isOperational: true,
      context,
    });
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable', context = {}) {
    super(message, {
      errorCode: 'SERVICE_UNAVAILABLE',
      statusCode: 503,
      isOperational: true,
      context,
    });
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', context = {}) {
    super(message, {
      errorCode: 'DATABASE_ERROR',
      statusCode: 500,
      isOperational: false,
      context,
    });
  }
}

export class ExternalServiceError extends AppError {
  constructor(service, message, context = {}) {
    super(`${service}: ${message}`, {
      errorCode: 'EXTERNAL_SERVICE_ERROR',
      statusCode: 502,
      isOperational: true,
      context: { service, ...context },
    });
  }
}
