/**
 * Global Error Handler Middleware
 * Handles all errors in the application
 */
import { HTTP_STATUS, ERROR_CODES } from '../../../common/constants/index.js';
import { BookingConflictError } from '../errors/BookingConflictError.js';

function errorHandler(logger, config) {
  // eslint-disable-next-line no-unused-vars
  return (err, req, res, next) => {
    // Handle BookingConflictError specifically
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

    // Log all other errors
    logger.error('Unhandled error', {
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