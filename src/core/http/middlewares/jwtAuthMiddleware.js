/**
 * JWT Authentication Middleware
 * Handles JWT token verification and user authentication
 */
import jwt from 'jsonwebtoken';
import { HTTP_STATUS } from '@/common/constants/index.js';

/**
 * Middleware to authenticate JWT tokens
 * Extracts token from Authorization header and verifies it
 * Adds user info to req.user if valid
 *
 * @param {Object} config - Configuration object with JWT secret
 * @returns {Function} Express middleware
 */
export function createJwtAuthMiddleware(config) {
  const jwtSecret = config.get('auth.jwtSecret');

  if (!jwtSecret) {
    throw new Error('JWT secret is not configured');
  }

  return (req, res, next) => {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        status: 'error',
        message: 'No authorization token provided',
      });
    }

    // Check if it's a Bearer token
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        status: 'error',
        message: 'Invalid authorization format. Use: Bearer <token>',
      });
    }

    const token = parts[1];

    try {
      // Verify and decode token
      const decoded = jwt.verify(token, jwtSecret);

      // Add user info to request
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        roles: decoded.roles || ['user'],
      };

      // Also set userId for backward compatibility
      req.userId = decoded.userId;

      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: 'error',
          message: 'Token has expired',
          code: 'TOKEN_EXPIRED',
        });
      }

      if (error.name === 'JsonWebTokenError') {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: 'error',
          message: 'Invalid token',
          code: 'INVALID_TOKEN',
        });
      }

      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        status: 'error',
        message: 'Token verification failed',
      });
    }
  };
}

/**
 * Optional JWT authentication middleware
 * Same as above but doesn't fail if no token is provided
 * Useful for endpoints that work differently for authenticated/unauthenticated users
 *
 * @param {Object} config - Configuration object with JWT secret
 * @returns {Function} Express middleware
 */
export function createOptionalJwtAuthMiddleware(config) {
  const jwtSecret = config.get('auth.jwtSecret');

  if (!jwtSecret) {
    throw new Error('JWT secret is not configured');
  }

  return (req, res, next) => {
    const authHeader = req.headers.authorization;

    // If no token, just continue without authentication
    if (!authHeader) {
      return next();
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      // Invalid format, but don't fail - just continue unauthenticated
      return next();
    }

    const token = parts[1];

    try {
      const decoded = jwt.verify(token, jwtSecret);

      req.user = {
        id: decoded.userId,
        email: decoded.email,
        roles: decoded.roles || ['user'],
      };

      req.userId = decoded.userId;
    } catch {
      // Token is invalid, but this is optional auth, so just continue
      // Could log the error for monitoring
    }

    next();
  };
}

/**
 * Utility function to extract user from JWT token without middleware
 * Useful for WebSocket authentication or other non-HTTP contexts
 *
 * @param {string} token - JWT token
 * @param {string} jwtSecret - JWT secret key
 * @returns {Object|null} Decoded user info or null if invalid
 */
export function verifyJwtToken(token, jwtSecret) {
  try {
    const decoded = jwt.verify(token, jwtSecret);
    return {
      id: decoded.userId,
      email: decoded.email,
      roles: decoded.roles || ['user'],
    };
  } catch {
    return null;
  }
}

export default createJwtAuthMiddleware;
