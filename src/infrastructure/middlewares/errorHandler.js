/**
 * Global Error Handler Middleware
 * Handles all errors in the application
 */
import {  HTTP_STATUS, ERROR_CODES  } from '../../shared/constants.js';

function errorHandler(logger, config) {
  // eslint-disable-next-line no-unused-vars
  return (err, req, res, next) => {
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