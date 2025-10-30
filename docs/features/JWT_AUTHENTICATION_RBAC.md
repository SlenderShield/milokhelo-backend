# JWT Authentication & RBAC Implementation Guide

## Overview

The Milokhelo Backend now uses **JWT (JSON Web Tokens)** as the primary authentication mechanism with **Role-Based Access Control (RBAC)** for authorization. This provides a stateless, scalable authentication system.

## Authentication Flow

### 1. User Registration/Login
```bash
# Register
POST /api/v1/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}

# Response includes JWT tokens
{
  "user": { "id": "...", "email": "...", "roles": ["user"] },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "a1b2c3d4..."
}
```

### 2. Using JWT Tokens

Include the access token in the Authorization header for all protected endpoints:

```bash
curl -X GET http://localhost:4000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. Token Refresh

When the access token expires, use the refresh token to get a new access token:

```bash
POST /api/v1/auth/refresh-token
{
  "refreshToken": "your-refresh-token"
}

# Response
{
  "accessToken": "new-jwt-token",
  "user": { ... }
}
```

## JWT Token Structure

### Access Token (JWT)
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "john@example.com",
  "roles": ["user"],
  "iat": 1698667200,
  "exp": 1699272000
}
```

**Lifetime:** 7 days (configurable via `JWT_EXPIRATION`)

### Refresh Token
- Stored in database with device information
- Used to obtain new access tokens
- **Lifetime:** 30 days (configurable via `REFRESH_TOKEN_EXPIRATION`)

## Middleware Usage

### JWT Authentication Middleware

Protects endpoints by verifying JWT tokens:

```javascript
import { createJwtAuthMiddleware } from '@/core/http/index.js';

// In module initialization
const jwtAuthMiddleware = createJwtAuthMiddleware(config);

// Apply to routes
router.get('/protected', jwtAuthMiddleware, controller.method());
```

### Authorization Middlewares

#### 1. Require Authentication
```javascript
import { requireAuth } from '@/core/http/index.js';

// User must be authenticated (JWT or session)
router.get('/profile', requireAuth(), userController.getProfile());
```

#### 2. Require Specific Role
```javascript
import { requireRole } from '@/core/http/index.js';

// Single role
router.post('/venues', requireRole('venue_owner'), venueController.create());

// Multiple roles (any match)
router.get('/admin', requireRole(['admin', 'superadmin']), adminController.dashboard());
```

#### 3. Require Permission
```javascript
import { requirePermission } from '@/core/http/index.js';

// Check specific permission
router.post('/venues', requirePermission('venue:create'), venueController.create());
router.delete('/users/:id', requirePermission('user:delete:any'), userController.delete());
```

#### 4. Require Minimum Role Level
```javascript
import { requireMinRole } from '@/core/http/index.js';

// Requires moderator level or higher
router.post('/reports', requireMinRole('moderator'), reportController.handle());
```

#### 5. Require Ownership
```javascript
import { requireOwnership } from '@/core/http/index.js';

// User must own the resource (admins bypass)
router.put('/posts/:id', requireOwnership(async (req) => {
  const post = await Post.findById(req.params.id);
  return post.authorId;
}), postController.update());
```

## Role Hierarchy

```javascript
const ROLE_HIERARCHY = {
  guest: 0,          // Unauthenticated users
  user: 1,           // Regular users
  venue_owner: 2,    // Venue owners
  moderator: 3,      // Content moderators
  admin: 4,          // Administrators
  superadmin: 5,     // Super administrators
};
```

Higher roles inherit permissions from lower roles.

## Permissions System

### Permission Format
`resource:action:scope`

Examples:
- `user:read` - Read user data
- `user:update:own` - Update own user data
- `user:update:any` - Update any user data
- `venue:create` - Create venues
- `admin:access` - Access admin panel

### Available Permissions

#### User Permissions
- `user:read` - View user profiles
- `user:update:own` - Update own profile
- `user:update:any` - Update any user
- `user:delete:own` - Delete own account
- `user:delete:any` - Delete any account

#### Venue Permissions
- `venue:create` - Create venues
- `venue:read` - View venues
- `venue:update:own` - Update own venues
- `venue:update:any` - Update any venue
- `venue:delete:own` - Delete own venues
- `venue:delete:any` - Delete any venue

#### Booking Permissions
- `booking:create` - Create bookings
- `booking:approve` - Approve bookings
- `booking:reject` - Reject bookings

#### Admin Permissions
- `admin:access` - Access admin panel
- `admin:manage:users` - Manage users
- `admin:manage:content` - Manage content
- `admin:manage:reports` - Manage reports
- `admin:system` - System administration

#### Match/Tournament Permissions
- `match:create` - Create matches
- `match:update:own` - Update own matches
- `match:update:any` - Update any match
- `match:delete:own` - Delete own matches
- `match:delete:any` - Delete any match
- `tournament:create` - Create tournaments
- `tournament:update:own` - Update own tournaments
- `tournament:update:any` - Update any tournament

## Implementation Examples

### Example 1: Protected User Route
```javascript
import { createJwtAuthMiddleware, requireAuth } from '@/core/http/index.js';

export function createUserRoutes(userController, jwtAuthMiddleware) {
  const router = express.Router();

  // Public route - no authentication
  router.get('/:id', userController.getUser());

  // Protected routes - require JWT authentication
  router.get('/me', jwtAuthMiddleware, userController.getCurrentUser());
  router.put('/me', jwtAuthMiddleware, userController.updateProfile());
  router.delete('/me', jwtAuthMiddleware, userController.deleteAccount());

  return router;
}
```

### Example 2: Role-Based Venue Routes
```javascript
import { requireRole, requirePermission, requireOwnership } from '@/core/http/index.js';

export function createVenueRoutes(venueController, jwtAuthMiddleware) {
  const router = express.Router();

  // Anyone can view venues
  router.get('/', venueController.list());
  router.get('/:id', venueController.getById());

  // Only venue owners can create
  router.post('/', 
    jwtAuthMiddleware,
    requireRole('venue_owner'), 
    venueController.create()
  );

  // Owner can update their own, admins can update any
  router.put('/:id', 
    jwtAuthMiddleware,
    requireOwnership(async (req) => {
      const venue = await Venue.findById(req.params.id);
      return venue.ownerId;
    }),
    venueController.update()
  );

  // Only admins can delete any venue
  router.delete('/:id',
    jwtAuthMiddleware,
    requirePermission('venue:delete:any'),
    venueController.delete()
  );

  return router;
}
```

### Example 3: Admin Routes
```javascript
import { requireMinRole, requirePermission } from '@/core/http/index.js';

export function createAdminRoutes(adminController, jwtAuthMiddleware) {
  const router = express.Router();

  // All admin routes require authentication
  router.use(jwtAuthMiddleware);

  // Minimum admin role required
  router.get('/dashboard', requireMinRole('admin'), adminController.dashboard());

  // Specific permissions
  router.get('/users', requirePermission('admin:manage:users'), adminController.listUsers());
  router.post('/users/:id/ban', requirePermission('admin:manage:users'), adminController.banUser());
  
  // System admin only
  router.post('/settings', requirePermission('admin:system'), adminController.updateSettings());

  return router;
}
```

### Example 4: Accessing User in Controller
```javascript
class UserController {
  getCurrentUser() {
    return asyncHandler(async (req, res) => {
      // JWT middleware populates req.user
      const userId = req.user.id;
      const userRoles = req.user.roles;

      const user = await this.userService.getUserById(userId);

      res.status(200).json(user);
    });
  }

  updateProfile() {
    return asyncHandler(async (req, res) => {
      // User is authenticated via JWT
      const userId = req.user.id;
      const updates = req.body;

      const user = await this.userService.updateUser(userId, updates);

      res.status(200).json(user);
    });
  }
}
```

## Utility Functions

### Check Role in Code
```javascript
import { hasRole } from '@/core/http/index.js';

if (hasRole(req.user, 'admin')) {
  // User is an admin
}

if (hasRole(req.user, ['moderator', 'admin'])) {
  // User is moderator or admin
}
```

### Check Permission in Code
```javascript
import { hasPermission } from '@/core/http/index.js';

if (hasPermission(req.user, 'venue:create')) {
  // User can create venues
}
```

## Backward Compatibility

The system supports **both JWT and session-based authentication**:

- JWT tokens are checked first (via `Authorization` header)
- Falls back to session authentication (via cookies)
- All authorization middlewares work with both methods
- Existing session-based routes continue to work

## Security Best Practices

### 1. Token Storage (Client-Side)
```javascript
// ❌ BAD - Don't store in localStorage
localStorage.setItem('token', accessToken);

// ✅ GOOD - Use httpOnly cookies or secure storage
// Let the backend set httpOnly cookies
// Or use secure storage mechanisms like IndexedDB with encryption
```

### 2. Token Expiration
- Access tokens expire after 7 days
- Refresh tokens expire after 30 days
- Implement token refresh logic before expiration

### 3. HTTPS Only
Always use HTTPS in production to prevent token interception.

### 4. Token Revocation
Refresh tokens can be revoked:
```javascript
// When user changes password
await authRepository.revokeAllUserTokens(userId);

// When user logs out
await authRepository.revokeRefreshToken(refreshToken);
```

## Environment Variables

```env
# JWT Configuration
JWT_SECRET=your-secret-key-min-32-characters
JWT_EXPIRATION=7d

# Refresh Token Configuration
REFRESH_TOKEN_EXPIRATION=2592000000  # 30 days in ms
```

## Error Responses

### 401 Unauthorized - No Token
```json
{
  "status": "error",
  "message": "No authorization token provided"
}
```

### 401 Unauthorized - Invalid Token
```json
{
  "status": "error",
  "message": "Invalid token",
  "code": "INVALID_TOKEN"
}
```

### 401 Unauthorized - Expired Token
```json
{
  "status": "error",
  "message": "Token has expired",
  "code": "TOKEN_EXPIRED"
}
```

### 403 Forbidden - Insufficient Permissions
```json
{
  "status": "error",
  "message": "Insufficient permissions",
  "required": ["admin"],
  "current": ["user"]
}
```

## Testing with JWT

### Using curl
```bash
# Get token
TOKEN=$(curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Pass123!"}' \
  | jq -r '.accessToken')

# Use token
curl http://localhost:4000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### Using Postman
1. Login and copy the `accessToken`
2. Go to Authorization tab
3. Select "Bearer Token"
4. Paste the token
5. Send requests

## Migration Guide

### For New Routes
```javascript
// Old (session-based)
router.get('/profile', userController.getProfile());

// New (JWT-based)
router.get('/profile', jwtAuthMiddleware, userController.getProfile());
```

### For Controllers
```javascript
// Old - get user from session
const userId = req.session.userId;

// New - get user from JWT (with fallback)
const userId = req.user?.id || req.session?.userId;
```

## WebSocket Authentication

For WebSocket connections, verify JWT tokens manually:

```javascript
import { verifyJwtToken } from '@/core/http/index.js';

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  const config = container.resolve('config');
  
  const user = verifyJwtToken(token, config.get('auth.jwtSecret'));
  
  if (user) {
    socket.user = user;
    next();
  } else {
    next(new Error('Authentication failed'));
  }
});
```

## Troubleshooting

### "No authorization token provided"
- Ensure `Authorization` header is present
- Format: `Authorization: Bearer <token>`

### "Invalid token"
- Token may be malformed
- JWT secret may not match
- Token may have been tampered with

### "Token has expired"
- Use the refresh token endpoint to get a new access token
- Implement automatic token refresh in your client

### "Insufficient permissions"
- User doesn't have required role/permission
- Check role assignments in user document
- Verify permission definitions in `authorizationMiddleware.js`

## Next Steps

1. **Update all protected routes** to use JWT middleware
2. **Test authentication flows** thoroughly
3. **Implement token refresh** logic in client applications
4. **Monitor token usage** and expiration patterns
5. **Set up proper token revocation** on security events
