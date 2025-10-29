# Authorization & Role-Based Access Control (RBAC)

Complete guide to the authorization system with role-based access control, permissions, and security middleware.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Role Hierarchy](#role-hierarchy)
- [Permission System](#permission-system)
- [Middleware Functions](#middleware-functions)
- [Usage Examples](#usage-examples)
- [API Integration](#api-integration)
- [Testing](#testing)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The Milokhelo backend implements a comprehensive Role-Based Access Control (RBAC) system that provides:

- **6-level role hierarchy** from guest to superadmin
- **Granular permission system** with resource:action:scope pattern
- **Flexible middleware** for authentication and authorization
- **Ownership-based access** control for user resources
- **Admin and moderator** capabilities
- **Type-safe** role and permission checks

The RBAC system ensures that users can only access and modify resources they're authorized for, while providing flexible permission management for administrators.

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│              Authorization Middleware                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Authentication Layer                       │  │
│  │  • requireAuth() - Session validation                │  │
│  │  • Session cookie verification                        │  │
│  │  • User identity establishment                        │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       │                                      │
│  ┌────────────────────▼─────────────────────────────────┐  │
│  │            Authorization Layer                        │  │
│  │  • requireRole() - Role-based checks                  │  │
│  │  • requirePermission() - Permission checks            │  │
│  │  • requireMinRole() - Hierarchical role checks        │  │
│  │  • requireOwnership() - Resource ownership            │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       │                                      │
│  ┌────────────────────▼─────────────────────────────────┐  │
│  │           Utility Functions                           │  │
│  │  • hasRole() - Check user role                        │  │
│  │  • hasPermission() - Check user permission            │  │
│  │  • ROLE_HIERARCHY - Role level mapping                │  │
│  │  • PERMISSIONS - Permission definitions               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow

```
Incoming Request
    │
    ▼
requireAuth() - Is user authenticated?
    │ No → 401 Unauthorized
    │ Yes ↓
    ▼
requireRole() / requirePermission() / requireMinRole()
    │ Check user's roles against required roles/permissions
    │ No → 403 Forbidden
    │ Yes ↓
    ▼
requireOwnership() (optional)
    │ Is user owner OR admin/moderator?
    │ No → 403 Forbidden
    │ Yes ↓
    ▼
Route Handler - Process request ✅
```

## Role Hierarchy

The system implements a 6-level hierarchy where higher levels inherit permissions from lower levels:

| Level | Role | Description | Use Case |
|-------|------|-------------|----------|
| 0 | `guest` | Unauthenticated users | Public read-only access |
| 1 | `user` | Registered users | Create matches, join teams, basic features |
| 2 | `venue_owner` | Venue owners/managers | Manage venues, approve bookings |
| 3 | `moderator` | Content moderators | Moderate content, manage reports |
| 4 | `admin` | System administrators | Manage users, full content control |
| 5 | `superadmin` | Super administrators | System configuration, all permissions |

### Role Assignment

Users can have **multiple roles**. The system uses the **highest role level** for hierarchical checks:

```javascript
// User with multiple roles
user.roles = ['user', 'venue_owner'];
// Effective level: 2 (venue_owner)

// Admin can do everything
admin.roles = ['admin'];
// Effective level: 4 (admin)
```

### Default Role

New users are assigned the `user` role by default:

```javascript
// On registration
const newUser = {
  email: 'user@example.com',
  roles: ['user'], // Default role
};
```

## Permission System

### Permission Pattern

Permissions follow the pattern: `resource:action:scope`

**Components:**
- **resource**: The entity being accessed (user, venue, match, etc.)
- **action**: The operation (create, read, update, delete, etc.)
- **scope**: Ownership level (own, any)

**Examples:**
```
user:read              - Read any user profile
user:update:own        - Update own profile
user:update:any        - Update any user profile
venue:create           - Create venues
booking:approve        - Approve bookings
admin:system           - System-level admin operations
```

### Permission Definitions

#### User Permissions

```javascript
'user:read'        → ['user', 'venue_owner', 'moderator', 'admin', 'superadmin']
'user:update:own'  → ['user', 'venue_owner', 'moderator', 'admin', 'superadmin']
'user:update:any'  → ['moderator', 'admin', 'superadmin']
'user:delete:own'  → ['user', 'venue_owner', 'moderator', 'admin', 'superadmin']
'user:delete:any'  → ['admin', 'superadmin']
```

#### Venue Permissions

```javascript
'venue:create'      → ['venue_owner', 'admin', 'superadmin']
'venue:read'        → ['user', 'venue_owner', 'moderator', 'admin', 'superadmin']
'venue:update:own'  → ['venue_owner', 'admin', 'superadmin']
'venue:update:any'  → ['admin', 'superadmin']
'venue:delete:own'  → ['venue_owner', 'admin', 'superadmin']
'venue:delete:any'  → ['admin', 'superadmin']
```

#### Booking Permissions

```javascript
'booking:create'   → ['user', 'venue_owner', 'moderator', 'admin', 'superadmin']
'booking:approve'  → ['venue_owner', 'admin', 'superadmin']
'booking:reject'   → ['venue_owner', 'admin', 'superadmin']
```

#### Admin Permissions

```javascript
'admin:access'         → ['admin', 'superadmin']
'admin:manage:users'   → ['admin', 'superadmin']
'admin:manage:content' → ['moderator', 'admin', 'superadmin']
'admin:manage:reports' → ['moderator', 'admin', 'superadmin']
'admin:system'         → ['superadmin']
```

#### Match & Tournament Permissions

```javascript
'match:create'       → ['user', 'venue_owner', 'moderator', 'admin', 'superadmin']
'match:update:own'   → ['user', 'venue_owner', 'moderator', 'admin', 'superadmin']
'match:update:any'   → ['moderator', 'admin', 'superadmin']
'match:delete:own'   → ['user', 'venue_owner', 'moderator', 'admin', 'superadmin']
'match:delete:any'   → ['moderator', 'admin', 'superadmin']

'tournament:create'     → ['user', 'venue_owner', 'moderator', 'admin', 'superadmin']
'tournament:update:own' → ['user', 'venue_owner', 'moderator', 'admin', 'superadmin']
'tournament:update:any' → ['moderator', 'admin', 'superadmin']
```

## Middleware Functions

### requireAuth()

Ensures user is authenticated. Must be the **first middleware** in protected routes.

**Usage:**
```javascript
import { requireAuth } from '@/core/http/middlewares/index.js';

// All routes in this router require authentication
router.use(requireAuth());

// Or single route
router.get('/profile', requireAuth(), controller.getProfile());
```

**Behavior:**
- ✅ User has valid session → Continue
- ❌ No session → 401 Unauthorized

### requireRole(roles)

Checks if user has at least one of the specified roles.

**Parameters:**
- `roles` - String or array of role names

**Usage:**
```javascript
import { requireRole } from '@/core/http/middlewares/index.js';

// Single role
router.delete('/users/:id', 
  requireAuth(),
  requireRole('admin'),
  controller.deleteUser()
);

// Multiple roles (user needs at least one)
router.post('/venues', 
  requireAuth(),
  requireRole(['venue_owner', 'admin']),
  controller.createVenue()
);
```

**Behavior:**
- ✅ User has any required role → Continue
- ❌ User lacks all required roles → 403 Forbidden

### requirePermission(permission)

Checks if user has a specific permission.

**Parameters:**
- `permission` - Permission string (e.g., 'venue:create')

**Usage:**
```javascript
import { requirePermission } from '@/core/http/middlewares/index.js';

// Permission-based check
router.post('/venues', 
  requireAuth(),
  requirePermission('venue:create'),
  controller.createVenue()
);

// Update any user (admin only)
router.patch('/users/:id', 
  requireAuth(),
  requirePermission('user:update:any'),
  controller.updateUser()
);
```

**Behavior:**
- ✅ User has permission → Continue
- ❌ User lacks permission → 403 Forbidden
- ❌ Unknown permission → 403 Forbidden

### requireMinRole(minRole)

Checks if user has a role at or above the minimum level in the hierarchy.

**Parameters:**
- `minRole` - Minimum role name required

**Usage:**
```javascript
import { requireMinRole } from '@/core/http/middlewares/index.js';

// Requires moderator or higher (moderator, admin, superadmin)
router.get('/admin/reports', 
  requireAuth(),
  requireMinRole('moderator'),
  controller.getReports()
);

// Requires admin or higher (admin, superadmin)
router.post('/admin/system-config', 
  requireAuth(),
  requireMinRole('admin'),
  controller.updateSystemConfig()
);
```

**Behavior:**
- ✅ User's highest role ≥ required level → Continue
- ❌ User's highest role < required level → 403 Forbidden

### requireOwnership(getResourceUserId)

Checks if user owns the resource OR has elevated permissions (admin/moderator bypass).

**Parameters:**
- `getResourceUserId` - Async function that returns resource owner's user ID

**Usage:**
```javascript
import { requireOwnership } from '@/core/http/middlewares/index.js';

// Update own profile
router.patch('/users/:id', 
  requireAuth(),
  requireOwnership(async (req) => {
    // Return the user ID from the resource
    return req.params.id;
  }),
  controller.updateUser()
);

// Update own match
router.patch('/matches/:id', 
  requireAuth(),
  requireOwnership(async (req) => {
    // Fetch match and return organizer ID
    const match = await matchRepository.findById(req.params.id);
    return match.organizerId;
  }),
  controller.updateMatch()
);
```

**Behavior:**
- ✅ User is resource owner → Continue
- ✅ User is admin/superadmin/moderator → Continue (bypass)
- ❌ User is neither owner nor privileged → 403 Forbidden

## Usage Examples

### Example 1: Public Endpoint (No Auth)

```javascript
// Anyone can view match list
router.get('/matches', controller.listMatches());
```

### Example 2: Authenticated Users Only

```javascript
// Only logged-in users can view their profile
router.get('/users/me', 
  requireAuth(),
  controller.getCurrentUser()
);
```

### Example 3: Role-Based Access

```javascript
// Only admins can delete users
router.delete('/users/:id', 
  requireAuth(),
  requireRole('admin'),
  controller.deleteUser()
);

// Venue owners or admins can create venues
router.post('/venues', 
  requireAuth(),
  requireRole(['venue_owner', 'admin']),
  controller.createVenue()
);
```

### Example 4: Permission-Based Access

```javascript
// Check specific permission
router.patch('/venues/:id', 
  requireAuth(),
  requirePermission('venue:update:own'),
  requireOwnership(async (req) => {
    const venue = await venueRepository.findById(req.params.id);
    return venue.ownerId;
  }),
  controller.updateVenue()
);
```

### Example 5: Hierarchical Role Check

```javascript
// Moderators and above can access
router.get('/admin/reports', 
  requireAuth(),
  requireMinRole('moderator'),
  controller.getReports()
);
```

### Example 6: Combined Checks

```javascript
// Must be authenticated, own the resource OR be admin
router.patch('/matches/:matchId', 
  requireAuth(),
  requireOwnership(async (req) => {
    const match = await matchRepository.findById(req.params.matchId);
    return match.organizerId;
  }),
  controller.updateMatch()
);
```

### Example 7: Utility Functions

```javascript
// In controller or service
import { hasRole, hasPermission } from '@/core/http/middlewares/index.js';

class UserController {
  async getUser(req, res) {
    const user = req.session.user;
    
    // Check if user has role
    if (hasRole(user, 'admin')) {
      // Show admin-only fields
      return this.userService.getUserWithAdminFields(req.params.id);
    }
    
    // Check if user has permission
    if (hasPermission(user, 'user:read:any')) {
      // Can view any user
      return this.userService.getUser(req.params.id);
    }
    
    // Regular user - only own profile
    if (req.params.id !== req.session.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    return this.userService.getUser(req.params.id);
  }
}
```

## API Integration

### Route Protection Patterns

#### Admin Routes

```javascript
// routes/admin.js
import { requireAuth, requireMinRole } from '@/core/http/middlewares/index.js';

const router = express.Router();

// All admin routes require admin role or higher
router.use(requireAuth());
router.use(requireMinRole('admin'));

router.get('/users', adminController.listUsers());
router.delete('/users/:id', adminController.deleteUser());
router.get('/system-stats', adminController.getSystemStats());

export default router;
```

#### Venue Management Routes

```javascript
// routes/venue-management.js
import { requireAuth, requirePermission, requireOwnership } from '@/core/http/middlewares/index.js';

const router = express.Router();

router.use(requireAuth());

// Create venue - requires venue_owner role
router.post('/', 
  requirePermission('venue:create'),
  controller.createVenue()
);

// Update venue - must own it or be admin
router.patch('/:venueId', 
  requirePermission('venue:update:own'),
  requireOwnership(async (req) => {
    const venue = await venueRepository.findById(req.params.venueId);
    return venue.ownerId;
  }),
  controller.updateVenue()
);

export default router;
```

#### User Routes

```javascript
// routes/user.js
import { requireAuth, requireOwnership, requirePermission } from '@/core/http/middlewares/index.js';

const router = express.Router();

// View own profile - requires auth only
router.get('/me', 
  requireAuth(),
  controller.getCurrentUser()
);

// Update own profile - must own it
router.patch('/:userId', 
  requireAuth(),
  requireOwnership(async (req) => req.params.userId),
  controller.updateUser()
);

// Delete any user - admin only
router.delete('/:userId', 
  requireAuth(),
  requirePermission('user:delete:any'),
  controller.deleteUser()
);

export default router;
```

## Testing

### Unit Tests

```javascript
import { requireAuth, requireRole, requirePermission, hasRole, hasPermission } from '@/core/http/middlewares/index.js';

describe('Authorization Middleware', () => {
  describe('requireAuth()', () => {
    it('should allow authenticated users', () => {
      const req = { session: { userId: '123' } };
      const res = { status: sinon.stub().returnsThis(), json: sinon.stub() };
      const next = sinon.stub();
      
      requireAuth()(req, res, next);
      
      expect(next.calledOnce).to.be.true;
    });
    
    it('should reject unauthenticated users', () => {
      const req = { session: null };
      const res = { status: sinon.stub().returnsThis(), json: sinon.stub() };
      const next = sinon.stub();
      
      requireAuth()(req, res, next);
      
      expect(res.status.calledWith(401)).to.be.true;
    });
  });
  
  describe('requireRole()', () => {
    it('should allow users with required role', () => {
      const req = { 
        session: { 
          userId: '123',
          user: { roles: ['admin'] }
        } 
      };
      const res = { status: sinon.stub().returnsThis(), json: sinon.stub() };
      const next = sinon.stub();
      
      requireRole('admin')(req, res, next);
      
      expect(next.calledOnce).to.be.true;
    });
  });
  
  describe('hasRole()', () => {
    it('should return true if user has role', () => {
      const user = { roles: ['user', 'venue_owner'] };
      expect(hasRole(user, 'venue_owner')).to.be.true;
    });
    
    it('should return false if user lacks role', () => {
      const user = { roles: ['user'] };
      expect(hasRole(user, 'admin')).to.be.false;
    });
  });
});
```

### Integration Tests

```javascript
describe('Protected Routes Integration', () => {
  it('should reject unauthenticated requests to protected routes', async () => {
    const response = await request(app)
      .get('/api/v1/users/me')
      .expect(401);
    
    expect(response.body.message).to.include('Authentication required');
  });
  
  it('should reject unauthorized role access', async () => {
    // Login as regular user
    const session = await loginAs('user');
    
    // Try to access admin endpoint
    const response = await request(app)
      .get('/api/v1/admin/users')
      .set('Cookie', session)
      .expect(403);
    
    expect(response.body.message).to.include('Insufficient permissions');
  });
  
  it('should allow admin to access admin routes', async () => {
    // Login as admin
    const session = await loginAs('admin');
    
    // Access admin endpoint
    const response = await request(app)
      .get('/api/v1/admin/users')
      .set('Cookie', session)
      .expect(200);
    
    expect(response.body).to.be.an('array');
  });
});
```

## Best Practices

### 1. Always Start with requireAuth()

```javascript
// ✅ Good
router.patch('/users/:id',
  requireAuth(),              // First: authenticate
  requireOwnership(...),      // Then: authorize
  controller.updateUser()
);

// ❌ Bad
router.patch('/users/:id',
  requireOwnership(...),      // Will fail - no session
  requireAuth(),
  controller.updateUser()
);
```

### 2. Use Specific Permissions Over Roles

```javascript
// ✅ Good - Permission-based (more flexible)
router.post('/venues',
  requireAuth(),
  requirePermission('venue:create'),
  controller.createVenue()
);

// ⚠️ Acceptable - Role-based (less flexible)
router.post('/venues',
  requireAuth(),
  requireRole('venue_owner'),
  controller.createVenue()
);
```

### 3. Combine requireOwnership with Permissions

```javascript
// ✅ Good - Check permission AND ownership
router.patch('/venues/:id',
  requireAuth(),
  requirePermission('venue:update:own'),  // Has update permission
  requireOwnership(getVenueOwnerId),      // Owns this specific venue
  controller.updateVenue()
);
```

### 4. Use requireMinRole for Hierarchical Access

```javascript
// ✅ Good - Any role above moderator can access
router.get('/admin/reports',
  requireAuth(),
  requireMinRole('moderator'),  // moderator, admin, superadmin
  controller.getReports()
);

// ❌ Bad - Must list all roles
router.get('/admin/reports',
  requireAuth(),
  requireRole(['moderator', 'admin', 'superadmin']),
  controller.getReports()
);
```

### 5. Fail Securely

```javascript
// ✅ Good - Default deny
if (!hasPermission(user, 'admin:access')) {
  return res.status(403).json({ error: 'Forbidden' });
}

// ❌ Bad - Default allow
if (hasPermission(user, 'admin:access')) {
  // Allow
} // Implicit allow if not matched
```

### 6. Log Authorization Failures

```javascript
// ✅ Good - Log for security monitoring
router.delete('/users/:id',
  requireAuth(),
  requireRole('admin'),
  (req, res, next) => {
    req.logger.warn('Admin action attempted', {
      userId: req.session.userId,
      action: 'delete_user',
      targetUserId: req.params.id
    });
    next();
  },
  controller.deleteUser()
);
```

## Troubleshooting

### Issue: Getting 401 even with valid session

**Cause**: Session not being passed correctly

**Solution**:
```javascript
// Frontend - ensure credentials included
fetch('/api/v1/users/me', {
  credentials: 'include'  // Send cookies
});

// Backend - ensure session middleware loaded
app.use(sessionMiddleware);
```

### Issue: Getting 403 with correct role

**Cause**: User object or roles not in session

**Solution**:
```javascript
// Check session structure
console.log(req.session);
// Should have: { userId: '...', user: { roles: [...] } }

// If missing, update login to store roles
req.session.user = {
  roles: user.roles || ['user']
};
```

### Issue: Permission checks not working

**Cause**: Permission string mismatch or not defined

**Solution**:
```javascript
// Check exact permission string
import { PERMISSIONS } from '@/core/http/middlewares/authorizationMiddleware.js';
console.log(PERMISSIONS);

// Ensure permission exists
requirePermission('venue:create')  // ✅ Exists
requirePermission('venue:make')    // ❌ Doesn't exist
```

### Issue: Ownership check failing for admins

**Cause**: Admin bypass not working

**Solution**:
```javascript
// Admins should bypass ownership checks automatically
// Check user roles in session
console.log(req.session.user.roles);

// Should include 'admin', 'superadmin', or 'moderator'
```

## Security Considerations

### 1. Session Security

```javascript
// Use HTTP-only cookies
app.use(session({
  cookie: {
    httpOnly: true,    // Prevent XSS
    secure: true,      // HTTPS only (production)
    sameSite: 'strict' // CSRF protection
  }
}));
```

### 2. Rate Limiting

```javascript
import rateLimit from 'express-rate-limit';

// Rate limit admin endpoints
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

router.use('/admin', requireAuth(), requireMinRole('admin'), adminLimiter);
```

### 3. Audit Logging

```javascript
// Log sensitive operations
router.delete('/users/:id',
  requireAuth(),
  requireRole('admin'),
  (req, res, next) => {
    logger.audit('user-delete', {
      performedBy: req.session.userId,
      targetUser: req.params.id,
      timestamp: new Date()
    });
    next();
  },
  controller.deleteUser()
);
```

### 4. Input Validation

```javascript
// Always validate inputs even with RBAC
router.post('/venues',
  requireAuth(),
  requirePermission('venue:create'),
  validate(venueCreateValidation),  // Validate input
  controller.createVenue()
);
```

## Further Reading

- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [RBAC Best Practices](https://www.okta.com/identity-101/role-based-access-control-rbac/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

**Next Steps:**
1. Review role definitions for your use case
2. Apply appropriate middleware to routes
3. Test authorization with different user roles
4. Monitor authorization failures
5. Audit admin actions in production
