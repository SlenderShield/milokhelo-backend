/**
 * Not Found Handler Middleware
 * Handles 404 errors for undefined routes
 */
const { HTTP_STATUS, ERROR_CODES } = require('../../shared/constants');

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

module.exports = notFoundHandler;
