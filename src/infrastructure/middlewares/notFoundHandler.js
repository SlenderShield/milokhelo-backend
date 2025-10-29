/**
 * Not Found Handler Middleware
 * Handles 404 errors for undefined routes
 */
import {  HTTP_STATUS, ERROR_CODES  } from '../../shared/constants/index.js';

function notFoundHandler() {
  return (req, res) => {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      error: {
        code: ERROR_CODES.NOT_FOUND,
        message: 'Route not found',
        path: req.url,
        method: req.method,
      },
    });
  };
}

export default notFoundHandler;