# JWT Authentication Quick Reference

## Quick Start

### 1. Login and Get JWT Token
```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

**Response:**
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "roles": ["user"]
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "a1b2c3d4e5f6..."
}
```

### 2. Use JWT Token
```bash
# Store the token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Make authenticated request
curl http://localhost:4000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Refresh Token
```bash
curl -X POST http://localhost:4000/api/v1/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "a1b2c3d4e5f6..."
  }'
```

## Middleware Quick Reference

### Apply JWT Auth to Routes
```javascript
import { createJwtAuthMiddleware } from '@/core/http/index.js';

// Get middleware from container
const jwtAuthMiddleware = container.resolve('jwtAuthMiddleware');

// Apply to routes
router.get('/protected', jwtAuthMiddleware, controller.method());
router.post('/create', jwtAuthMiddleware, controller.create());
```

### Require Specific Roles
```javascript
import { requireRole } from '@/core/http/index.js';

// Single role
router.post('/venues', jwtAuthMiddleware, requireRole('venue_owner'), controller.create());

// Multiple roles (OR)
router.get('/admin', jwtAuthMiddleware, requireRole(['admin', 'superadmin']), controller.dashboard());
```

### Require Permissions
```javascript
import { requirePermission } from '@/core/http/index.js';

router.post('/venues', jwtAuthMiddleware, requirePermission('venue:create'), controller.create());
router.delete('/users/:id', jwtAuthMiddleware, requirePermission('user:delete:any'), controller.delete());
```

### Require Minimum Role Level
```javascript
import { requireMinRole } from '@/core/http/index.js';

// Requires moderator or higher (admin, superadmin)
router.post('/reports', jwtAuthMiddleware, requireMinRole('moderator'), controller.handle());
```

### Require Ownership
```javascript
import { requireOwnership } from '@/core/http/index.js';

router.put('/posts/:id', jwtAuthMiddleware, requireOwnership(async (req) => {
  const post = await Post.findById(req.params.id);
  return post.authorId;
}), controller.update());
```

## Access User in Controllers

```javascript
class MyController {
  myMethod() {
    return asyncHandler(async (req, res) => {
      // JWT middleware populates req.user
      const userId = req.user.id;
      const userEmail = req.user.email;
      const userRoles = req.user.roles; // ['user', 'admin', etc.]

      // Use the user info
      const data = await this.service.getData(userId);

      res.json(data);
    });
  }
}
```

## Role Hierarchy

```
guest: 0       → Unauthenticated
user: 1        → Regular users
venue_owner: 2 → Venue owners
moderator: 3   → Content moderators
admin: 4       → Administrators  
superadmin: 5  → Super administrators
```

## Common Permissions

| Permission | Roles | Description |
|------------|-------|-------------|
| `user:read` | All authenticated | View user profiles |
| `user:update:own` | All authenticated | Update own profile |
| `user:update:any` | moderator+ | Update any user |
| `venue:create` | venue_owner+ | Create venues |
| `venue:update:own` | venue_owner+ | Update own venues |
| `venue:update:any` | admin+ | Update any venue |
| `booking:approve` | venue_owner+ | Approve bookings |
| `admin:access` | admin+ | Access admin panel |
| `admin:system` | superadmin | System settings |

## Testing Endpoints

### Get Current User (JWT Required)
```bash
curl http://localhost:4000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### Change Password (JWT Required)
```bash
curl -X PUT http://localhost:4000/api/v1/auth/change-password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "OldPass123!",
    "newPassword": "NewPass456!",
    "confirmPassword": "NewPass456!"
  }'
```

### Deactivate Account (JWT Required)
```bash
curl -X DELETE http://localhost:4000/api/v1/auth/deactivate \
  -H "Authorization: Bearer $TOKEN"
```

## Error Responses

### 401 - No Token
```json
{
  "status": "error",
  "message": "No authorization token provided"
}
```

### 401 - Invalid Token
```json
{
  "status": "error",
  "message": "Invalid token",
  "code": "INVALID_TOKEN"
}
```

### 401 - Expired Token
```json
{
  "status": "error",
  "message": "Token has expired",
  "code": "TOKEN_EXPIRED"
}
```

### 403 - Insufficient Permissions
```json
{
  "status": "error",
  "message": "Insufficient permissions",
  "required": ["admin"],
  "current": ["user"]
}
```

## Environment Variables

```env
JWT_SECRET=your-secret-key-min-32-characters
JWT_EXPIRATION=7d
REFRESH_TOKEN_EXPIRATION=2592000000
```

## Complete Example Route File

```javascript
import express from 'express';
import { 
  createJwtAuthMiddleware, 
  requireRole, 
  requirePermission,
  requireOwnership 
} from '@/core/http/index.js';

export function createMyRoutes(controller, config) {
  const router = express.Router();
  const jwtAuth = createJwtAuthMiddleware(config);

  // Public routes (no auth)
  router.get('/', controller.list());
  router.get('/:id', controller.getById());

  // Authenticated routes (JWT required)
  router.post('/', jwtAuth, controller.create());
  router.put('/:id', jwtAuth, requireOwnership(async (req) => {
    const item = await Model.findById(req.params.id);
    return item.userId;
  }), controller.update());

  // Role-based routes
  router.delete('/:id', jwtAuth, requireRole('admin'), controller.delete());

  // Permission-based routes
  router.post('/approve/:id', jwtAuth, requirePermission('item:approve'), controller.approve());

  return router;
}
```

## Tips

1. **Always use HTTPS** in production
2. **Store tokens securely** on the client (httpOnly cookies preferred)
3. **Implement token refresh** before expiration
4. **Revoke tokens** on password change or logout
5. **Monitor token usage** for security anomalies

## Common Issues

**Q: "No authorization token provided"**
- Check that Authorization header is present
- Format: `Authorization: Bearer <token>`

**Q: "Invalid token"**
- Token may be malformed or tampered with
- Verify JWT_SECRET matches

**Q: "Token has expired"**
- Use refresh token to get new access token
- Implement auto-refresh in client

**Q: "Insufficient permissions"**
- User doesn't have required role/permission
- Check user roles in database
- Verify permission definitions

## Next Steps

- Read full guide: `docs/features/JWT_AUTHENTICATION_RBAC.md`
- Update your routes to use JWT middleware
- Test authentication flows
- Implement client-side token management
