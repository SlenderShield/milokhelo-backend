/**
 * Middlewares Module
 * Entry point for global middlewares
 */
import errorHandler from './errorHandler.js';
import notFoundHandler from './notFoundHandler.js';
import requestLogger from './requestLogger.js';
import {
  configureHelmet,
  configureCORS,
  configureRateLimit,
  configureAuthRateLimit,
} from './security.js';

export {
  errorHandler,
  notFoundHandler,
  requestLogger,
  configureHelmet,
  configureCORS,
  configureRateLimit,
  configureAuthRateLimit,
};
