/**
 * Middlewares Module
 * Entry point for global middlewares
 */
const errorHandler = require('./errorHandler');
const notFoundHandler = require('./notFoundHandler');
const requestLogger = require('./requestLogger');

module.exports = {
  errorHandler,
  notFoundHandler,
  requestLogger,
};
