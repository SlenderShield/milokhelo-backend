/**
 * Unit Tests for Authorization Middleware (RBAC)
 */
import '../helpers/setup.js';
import { describe, it, beforeEach, afterEach } from 'mocha';
import {
  requireAuth,
  requireRole,
  requirePermission,
  requireMinRole,
  hasRole,
  hasPermission,
  ROLE_HIERARCHY,
} from '../../src/core/http/middlewares/authorizationMiddleware.js';

describe('Authorization Middleware (RBAC)', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      session: {
        userId: 'user123',
        user: {
          roles: ['user'],
        },
      },
    };
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
    };
    next = sinon.stub();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('requireAuth()', () => {
    it('should call next() when user is authenticated', () => {
      const middleware = requireAuth();
      middleware(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(res.status.called).to.be.false;
    });

    it('should return 401 when user is not authenticated', () => {
      req.session = null;
      const middleware = requireAuth();
      middleware(req, res, next);

      expect(res.status.calledWith(401)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(next.called).to.be.false;
    });

    it('should return 401 when session exists but no userId', () => {
      req.session = {};
      const middleware = requireAuth();
      middleware(req, res, next);

      expect(res.status.calledWith(401)).to.be.true;
      expect(next.called).to.be.false;
    });
  });

  describe('requireRole()', () => {
    it('should allow access when user has required role', () => {
      req.session.user.roles = ['admin'];
      const middleware = requireRole('admin');
      middleware(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(res.status.called).to.be.false;
    });

    it('should allow access when user has one of multiple required roles', () => {
      req.session.user.roles = ['moderator'];
      const middleware = requireRole(['admin', 'moderator']);
      middleware(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(res.status.called).to.be.false;
    });

    it('should deny access when user lacks required role', () => {
      req.session.user.roles = ['user'];
      const middleware = requireRole('admin');
      middleware(req, res, next);

      expect(res.status.calledWith(403)).to.be.true;
      expect(next.called).to.be.false;
    });

    it('should return 401 when user is not authenticated', () => {
      req.session = null;
      const middleware = requireRole('user');
      middleware(req, res, next);

      expect(res.status.calledWith(401)).to.be.true;
      expect(next.called).to.be.false;
    });
  });

  describe('requirePermission()', () => {
    it('should allow access when user has permission', () => {
      req.session.user.roles = ['venue_owner'];
      const middleware = requirePermission('venue:create');
      middleware(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(res.status.called).to.be.false;
    });

    it('should deny access when user lacks permission', () => {
      req.session.user.roles = ['user'];
      const middleware = requirePermission('admin:access');
      middleware(req, res, next);

      expect(res.status.calledWith(403)).to.be.true;
      expect(next.called).to.be.false;
    });

    it('should allow admin access to all permissions', () => {
      req.session.user.roles = ['admin'];
      const middleware = requirePermission('venue:delete:own');
      middleware(req, res, next);

      expect(next.calledOnce).to.be.true;
    });
  });

  describe('requireMinRole()', () => {
    it('should allow access when user has minimum role level', () => {
      req.session.user.roles = ['admin'];
      const middleware = requireMinRole('moderator');
      middleware(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(res.status.called).to.be.false;
    });

    it('should allow access when user has exact minimum role', () => {
      req.session.user.roles = ['moderator'];
      const middleware = requireMinRole('moderator');
      middleware(req, res, next);

      expect(next.calledOnce).to.be.true;
    });

    it('should deny access when user role is below minimum', () => {
      req.session.user.roles = ['user'];
      const middleware = requireMinRole('moderator');
      middleware(req, res, next);

      expect(res.status.calledWith(403)).to.be.true;
      expect(next.called).to.be.false;
    });
  });

  describe('hasRole()', () => {
    it('should return true when user has role', () => {
      const user = { roles: ['admin'] };
      expect(hasRole(user, 'admin')).to.be.true;
    });

    it('should return true when user has one of multiple roles', () => {
      const user = { roles: ['moderator'] };
      expect(hasRole(user, ['admin', 'moderator'])).to.be.true;
    });

    it('should return false when user lacks role', () => {
      const user = { roles: ['user'] };
      expect(hasRole(user, 'admin')).to.be.false;
    });

    it('should return false for null user', () => {
      expect(hasRole(null, 'user')).to.be.false;
    });
  });

  describe('hasPermission()', () => {
    it('should return true when user has permission', () => {
      const user = { roles: ['admin'] };
      expect(hasPermission(user, 'admin:access')).to.be.true;
    });

    it('should return false when user lacks permission', () => {
      const user = { roles: ['user'] };
      expect(hasPermission(user, 'admin:access')).to.be.false;
    });

    it('should return false for unknown permission', () => {
      const user = { roles: ['admin'] };
      expect(hasPermission(user, 'unknown:permission')).to.be.false;
    });
  });

  describe('ROLE_HIERARCHY', () => {
    it('should have proper hierarchy levels', () => {
      expect(ROLE_HIERARCHY.guest).to.equal(0);
      expect(ROLE_HIERARCHY.user).to.equal(1);
      expect(ROLE_HIERARCHY.venue_owner).to.equal(2);
      expect(ROLE_HIERARCHY.moderator).to.equal(3);
      expect(ROLE_HIERARCHY.admin).to.equal(4);
      expect(ROLE_HIERARCHY.superadmin).to.equal(5);
    });
  });
});
