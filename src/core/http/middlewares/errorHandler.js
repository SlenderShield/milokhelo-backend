/**
 * Global Error Handler Middleware
 * Handles all errors in the application with AppError classification
 */
import { HTTP_STATUS, ERROR_CODES } from '@/common/constants/index.js';
import { AppError } from '@/core/http/errors/index.js';
import { BookingConflictError } from '@/core/http/errors/BookingConflictError.js';

function errorHandler(logger, config) {
  // eslint-disable-next-line no-unused-vars
  return (err, req, res, next) => {
    // Handle AppError and its subclasses
    if (err instanceof AppError) {
      const level = err.isOperational ? 'warn' : 'error';
      logger[level]('Application error', {
        name: err.name,
        code: err.errorCode,
        message: err.message,
        context: err.context,
        url: req.url,
        method: req.method,
        ...(level === 'error' && { stack: err.stack }),
      });

      return res.status(err.statusCode).json({
        success: false,
        error: {
          code: err.errorCode,
          message: err.message,
          ...(err.context && Object.keys(err.context).length > 0 && { context: err.context }),
          ...(config.isDevelopment() && { stack: err.stack }),
        },
      });
    }

    // Handle BookingConflictError specifically (legacy support)
    if (err instanceof BookingConflictError) {
      logger.warn('Booking conflict detected', {
        error: err.message,
        conflictingBookings: err.conflictingBookings,
        url: req.url,
        method: req.method,
      });

      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        error: {
          code: 'BOOKING_CONFLICT',
          message: err.message,
          conflictingBookings: err.conflictingBookings,
        },
      });
    }

    // Log all other errors as unexpected
    logger.error('Unexpected error', {
      error: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
    });

    const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const errorCode = err.code || ERROR_CODES.INTERNAL_ERROR;

    res.status(statusCode).json({
      success: false,
      error: {
        code: errorCode,
        message: config.isProduction() ? 'Internal server error' : err.message,
        ...(config.isDevelopment() && { stack: err.stack }),
      },
    });
  };
}

export default errorHandler;
