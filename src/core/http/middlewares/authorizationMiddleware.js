/**
 * Authorization Middleware (RBAC - Role-Based Access Control)
 * Handles role-based and permission-based authorization
 */
import { HTTP_STATUS } from '../errors/index.js';

/**
 * Default role hierarchy (higher value = more permissions)
 */
const ROLE_HIERARCHY = {
  guest: 0,
  user: 1,
  venue_owner: 2,
  moderator: 3,
  admin: 4,
  superadmin: 5,
};

/**
 * Permission definitions for different roles
 */
const PERMISSIONS = {
  // User permissions
  'user:read': ['user', 'venue_owner', 'moderator', 'admin', 'superadmin'],
  'user:update:own': ['user', 'venue_owner', 'moderator', 'admin', 'superadmin'],
  'user:update:any': ['moderator', 'admin', 'superadmin'],
  'user:delete:own': ['user', 'venue_owner', 'moderator', 'admin', 'superadmin'],
  'user:delete:any': ['admin', 'superadmin'],

  // Venue permissions
  'venue:create': ['venue_owner', 'admin', 'superadmin'],
  'venue:read': ['user', 'venue_owner', 'moderator', 'admin', 'superadmin'],
  'venue:update:own': ['venue_owner', 'admin', 'superadmin'],
  'venue:update:any': ['admin', 'superadmin'],
  'venue:delete:own': ['venue_owner', 'admin', 'superadmin'],
  'venue:delete:any': ['admin', 'superadmin'],

  // Booking permissions
  'booking:create': ['user', 'venue_owner', 'moderator', 'admin', 'superadmin'],
  'booking:approve': ['venue_owner', 'admin', 'superadmin'],
  'booking:reject': ['venue_owner', 'admin', 'superadmin'],

  // Admin permissions
  'admin:access': ['admin', 'superadmin'],
  'admin:manage:users': ['admin', 'superadmin'],
  'admin:manage:content': ['moderator', 'admin', 'superadmin'],
  'admin:manage:reports': ['moderator', 'admin', 'superadmin'],
  'admin:system': ['superadmin'],

  // Match and tournament permissions
  'match:create': ['user', 'venue_owner', 'moderator', 'admin', 'superadmin'],
  'match:update:own': ['user', 'venue_owner', 'moderator', 'admin', 'superadmin'],
  'match:update:any': ['moderator', 'admin', 'superadmin'],
  'match:delete:own': ['user', 'venue_owner', 'moderator', 'admin', 'superadmin'],
  'match:delete:any': ['moderator', 'admin', 'superadmin'],

  'tournament:create': ['user', 'venue_owner', 'moderator', 'admin', 'superadmin'],
  'tournament:update:own': ['user', 'venue_owner', 'moderator', 'admin', 'superadmin'],
  'tournament:update:any': ['moderator', 'admin', 'superadmin'],
};

/**
 * Middleware to check if user is authenticated
 * @returns {Function} Express middleware
 */
export function requireAuth() {
  return (req, res, next) => {
    if (!req.session || !req.session.userId) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        status: 'error',
        message: 'Authentication required',
      });
    }
    next();
  };
}

/**
 * Middleware to check if user has required role(s)
 * @param {string|string[]} requiredRoles - Role or array of roles
 * @returns {Function} Express middleware
 */
export function requireRole(requiredRoles) {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  return (req, res, next) => {
    if (!req.session || !req.session.userId) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    const userRoles = req.session.user?.roles || ['user'];

    const hasRequiredRole = roles.some((role) => userRoles.includes(role));

    if (!hasRequiredRole) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        status: 'error',
        message: 'Insufficient permissions',
        required: roles,
        current: userRoles,
      });
    }

    next();
  };
}

/**
 * Middleware to check if user has required permission
 * @param {string} permission - Permission string (e.g., 'venue:create')
 * @returns {Function} Express middleware
 */
export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.session || !req.session.userId) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    const userRoles = req.session.user?.roles || ['user'];
    const allowedRoles = PERMISSIONS[permission];

    if (!allowedRoles) {
      console.warn(`Unknown permission: ${permission}`);
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        status: 'error',
        message: 'Invalid permission',
      });
    }

    const hasPermission = userRoles.some((role) => allowedRoles.includes(role));

    if (!hasPermission) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        status: 'error',
        message: 'Insufficient permissions',
        permission,
      });
    }

    next();
  };
}

/**
 * Middleware to check if user has minimum role level
 * @param {string} minRole - Minimum role required
 * @returns {Function} Express middleware
 */
export function requireMinRole(minRole) {
  const minLevel = ROLE_HIERARCHY[minRole];

  if (minLevel === undefined) {
    throw new Error(`Unknown role: ${minRole}`);
  }

  return (req, res, next) => {
    if (!req.session || !req.session.userId) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    const userRoles = req.session.user?.roles || ['user'];
    const maxUserLevel = Math.max(...userRoles.map((role) => ROLE_HIERARCHY[role] || 0));

    if (maxUserLevel < minLevel) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        status: 'error',
        message: 'Insufficient permissions',
        required: minRole,
      });
    }

    next();
  };
}

/**
 * Middleware to check if user owns the resource
 * Combines with role check - admins bypass ownership check
 * @param {Function} getResourceUserId - Function to extract resource owner ID from request
 * @returns {Function} Express middleware
 */
export function requireOwnership(getResourceUserId) {
  return async (req, res, next) => {
    if (!req.session || !req.session.userId) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    const userRoles = req.session.user?.roles || ['user'];

    // Admins and moderators bypass ownership check
    if (userRoles.includes('admin') || userRoles.includes('superadmin') || userRoles.includes('moderator')) {
      return next();
    }

    try {
      const resourceUserId = await getResourceUserId(req);

      if (!resourceUserId || resourceUserId.toString() !== req.session.userId.toString()) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          status: 'error',
          message: 'You do not have permission to access this resource',
        });
      }

      next();
    } catch (err) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to verify resource ownership',
        error: err.message,
      });
    }
  };
}

/**
 * Utility to check if user has role
 * @param {Object} user - User object with roles array
 * @param {string|string[]} roles - Role or roles to check
 * @returns {boolean}
 */
export function hasRole(user, roles) {
  const rolesToCheck = Array.isArray(roles) ? roles : [roles];
  const userRoles = user?.roles || ['user'];
  return rolesToCheck.some((role) => userRoles.includes(role));
}

/**
 * Utility to check if user has permission
 * @param {Object} user - User object with roles array
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
export function hasPermission(user, permission) {
  const userRoles = user?.roles || ['user'];
  const allowedRoles = PERMISSIONS[permission];
  
  if (!allowedRoles) return false;
  
  return userRoles.some((role) => allowedRoles.includes(role));
}

export { ROLE_HIERARCHY, PERMISSIONS };
