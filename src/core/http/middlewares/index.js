/**
 * Middlewares Module
 * Entry point for global middlewares
 */
import errorHandler from './errorHandler.js';
import notFoundHandler from './notFoundHandler.js';
import requestLogger from './requestLogger.js';
import metricsMiddleware from './metricsMiddleware.js';
import {
  configureHelmet,
  configureCORS,
  configureRateLimit,
  configureAuthRateLimit,
} from './security.js';
import { createSessionMiddleware } from './sessionMiddleware.js';
import { asyncHandler } from './asyncHandler.js';
import { validateRequest, validate } from './validationMiddleware.js';
import {
  requireAuth,
  requireRole,
  requirePermission,
  requireMinRole,
  requireOwnership,
  hasRole,
  hasPermission,
  ROLE_HIERARCHY,
  PERMISSIONS,
} from './authorizationMiddleware.js';
import {
  createJwtAuthMiddleware,
  createOptionalJwtAuthMiddleware,
  verifyJwtToken,
} from './jwtAuthMiddleware.js';

export {
  errorHandler,
  notFoundHandler,
  requestLogger,
  metricsMiddleware,
  configureHelmet,
  configureCORS,
  configureRateLimit,
  configureAuthRateLimit,
  createSessionMiddleware,
  asyncHandler,
  validateRequest,
  validate,
  requireAuth,
  requireRole,
  requirePermission,
  requireMinRole,
  requireOwnership,
  hasRole,
  hasPermission,
  ROLE_HIERARCHY,
  PERMISSIONS,
  createJwtAuthMiddleware,
  createOptionalJwtAuthMiddleware,
  verifyJwtToken,
};
