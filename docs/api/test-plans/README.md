# API Test Plans - Milokhelo Backend

## Overview

This directory contains comprehensive API test plans for all modules in the Milokhelo REST API v1. Each test plan documents endpoint specifications, request/response formats, validation rules, and detailed test cases including positive, negative, and edge scenarios.

## Test Plan Files

### 1. [Auth Module](./auth.md)

**21 endpoints** - Authentication & session management

- OAuth 2.0 (Google & Facebook)
- Email/password authentication
- Session management with HTTP-only cookies
- Password reset and email verification
- JWT token refresh

### 2. [Users Module](./users.md)

**11 endpoints** - User profiles, stats, achievements, and social features

- Profile management (CRUD)
- Statistics tracking (auto-updated via events)
- Achievement system (31 predefined achievements)
- Friends management (bidirectional)
- User search and discovery

### 3. [Teams Module](./teams.md)

**7 endpoints** - Team lifecycle management

- Team CRUD operations
- Member management (join/leave)
- Captain transfers
- Public/private teams with join codes
- Team statistics

### 4. [Matches Module](./matches.md)

**11 endpoints** - Match lifecycle and participant management

- Match CRUD with status transitions
- Participant management (join/leave)
- Scoring system (simple + detailed performance)
- Status management (scheduled → live → finished)
- Event-driven stats updates

### 5. [Tournaments Module](./tournaments.md)

**11 endpoints** - Tournament management and bracket generation

- Tournament CRUD
- Registration management
- Bracket generation (knockout/league)
- Match result updates
- Automatic standings calculation

### 6. [Chat Module](./chat.md)

**6 endpoints** - Real-time messaging

- Chat room management
- Message CRUD (send, edit, delete)
- WebSocket support
- Read tracking
- Reply and attachments

### 7. [Venues Module](./venues.md)

**6 endpoints** - Public venue discovery

- Venue listing and search
- Geospatial search (nearby venues)
- Availability checking
- Booking system
- Multi-sport support

### 8. [Venue Management Module](./venue-management.md)

**11 endpoints** - Venue owner/manager operations

- Venue CRUD (owner only)
- Time slot management
- Booking approval/rejection
- Revenue analytics
- Requires venue_owner role

### 9. [Calendar, Maps, Notifications, Invitations, Feedback, Admin](./calendar-maps-notifications-invitations-feedback-admin.md)

**24 endpoints** - Supporting modules

- **Calendar** (7): Device sync + Google Calendar OAuth2
- **Maps** (3): Geospatial entity tracking
- **Notifications** (8): FCM/APNS push notifications
- **Invitations** (3): Entity-based invitations
- **Feedback** (2): User feedback submission
- **Admin** (1+): System reports and moderation

---

## Total API Coverage

- **Total Modules**: 14
- **Total Endpoints**: 109+
- **Authentication Methods**: Cookie-based sessions, JWT tokens, OAuth 2.0
- **Authorization Levels**: 6-tier RBAC (guest to superadmin)

---

## Test Case Categories

Each endpoint includes the following test categories:

### ✅ Positive Tests

- Valid requests with expected success responses
- Different user roles and permissions
- Various data combinations and scenarios

### ❌ Negative Tests

- Invalid input data
- Missing required fields
- Unauthorized/unauthenticated access
- Forbidden operations
- Not found resources

### 🔒 Security Tests

- Authentication validation
- Authorization checks
- Input sanitization
- Rate limiting
- Token validation

### 📊 Edge Cases

- Boundary conditions
- Empty results
- Maximum/minimum values
- Concurrent operations
- Race conditions

---

## Key API Features Documented

### Event-Driven Architecture

- **Match Stats Updates**: Automatic stat updates when matches finish
- **Achievement Awards**: Automatic evaluation based on user stats
- **Friend Actions**: Event publication for social features
- **Notifications**: Real-time push notifications via FCM/APNS

### Validation Coverage

- **Input Validation**: 17+ validation schemas across 5 modules
- **Type Checking**: Email, URL, ObjectId, ISO dates, coordinates
- **Length Validation**: Min/max character limits
- **Enum Validation**: Sport types, statuses, roles
- **Custom Validators**: Business logic validation

### Geospatial Features

- **Nearby Search**: MongoDB 2dsphere indexes
- **Distance Calculation**: Radius-based venue discovery
- **Coordinate Validation**: Latitude/longitude bounds

### Real-Time Features

- **WebSocket Support**: Socket.IO for chat and live updates
- **Push Notifications**: Multi-device FCM and APNS
- **Live Match Updates**: Real-time score and status changes

---

## API Conventions

### HTTP Methods

- **GET**: Retrieve resources (read-only)
- **POST**: Create new resources
- **PUT**: Full resource update
- **PATCH**: Partial resource update
- **DELETE**: Remove resources (often soft delete)

### Status Codes

- **200 OK**: Successful request
- **201 Created**: Resource created successfully
- **204 No Content**: Successful request with no response body
- **400 Bad Request**: Validation error or invalid input
- **401 Unauthorized**: Authentication required or failed
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource doesn't exist
- **409 Conflict**: Resource conflict (e.g., duplicate, booking conflict)

### Response Format

All responses follow consistent JSON structure:

```json
{
  "status": "success",
  "data": { ... },
  "message": "Optional message"
}
```

Error responses:

```json
{
  "status": "error",
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Validation error",
      "value": "invalid value"
    }
  ]
}
```

---

## Authentication & Authorization

### Authentication Methods

1. **Cookie-based Sessions**: Primary method with Redis store
2. **JWT Bearer Tokens**: Alternative for API access
3. **OAuth 2.0**: Google and Facebook integration

### Role Hierarchy (RBAC)

- **guest** (level 0): Unauthenticated users
- **user** (level 1): Registered users (default)
- **venue_owner** (level 2): Venue owners and managers
- **moderator** (level 3): Content moderators
- **admin** (level 4): System administrators
- **superadmin** (level 5): Super administrators

### Permission Pattern

`resource:action:scope`

- **resource**: user, venue, booking, match, tournament, admin
- **action**: create, read, update, delete, approve, reject
- **scope**: own (user's resources), any (all resources)

---

## Testing Strategy

### Manual Testing

Use these test plans to:

1. Create Postman/Insomnia collections
2. Write manual test cases
3. Verify API behavior
4. Document edge cases

### Automated Testing

Convert test cases to:

1. Integration tests (Jest/Mocha)
2. End-to-end tests (Cypress/Playwright)
3. Load tests (k6/Artillery)
4. Contract tests (Pact)

### Test Prioritization

1. **Critical Paths**: Auth, user registration, core workflows
2. **High Impact**: Match/tournament creation, booking system
3. **Security**: Authentication, authorization, input validation
4. **Edge Cases**: Boundary conditions, concurrent operations

---

## Usage Example

### Testing a Complete Workflow

Example: Creating and finishing a match with automatic stats update

1. **Authenticate**:

   ```http
   POST /auth/login
   Body: { "email": "...", "password": "..." }
   → Receive session cookie
   ```

2. **Create Match**:

   ```http
   POST /matches
   Cookie: session=...
   Body: { "title": "...", "sport": "football", ... }
   → Returns match ID
   ```

3. **Join Match**:

   ```http
   POST /matches/{id}/join
   Cookie: session=...
   → User added to participants
   ```

4. **Start Match**:

   ```http
   PUT /matches/{id}/status
   Body: { "status": "live" }
   → Match status changes to live
   ```

5. **Finish Match with Scores**:

   ```http
   PUT /matches/{id}/status
   Body: { "status": "finished" }

   PUT /matches/{id}/score
   Body: { "scores": { "teamA": 3, "teamB": 2 }, ... }
   → Publishes match.finished event
   → Stats auto-updated for all participants
   ```

6. **Verify Stats Update**:

   ```http
   GET /users/{id}/stats
   → Shows updated wins/losses, ELO rating, streaks
   ```

---

## Validation Rules Reference

### Common Patterns

**MongoDB ObjectId**: 24-character hex string  
**Email**: Valid format, auto-normalized  
**Date**: ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)  
**Coordinates**: Latitude (-90 to 90), Longitude (-180 to 180)  
**Pagination**: limit (1-100), skip (0+)  
**Username**: 3-30 chars, alphanumeric  
**Password**: 8+ chars, uppercase, lowercase, number  
**Bio**: Max 500 characters

---

## Related Documentation

- [OpenAPI Specification](../openapi.yaml) - Full API specification
- [Architecture Documentation](../../architecture/ARCHITECTURE.md) - System architecture
- [Development Guidelines](../../guides/DEVELOPMENT_GUIDELINES.md) - Coding standards
- [Quick Reference](../../guides/QUICK_REFERENCE.md) - Common patterns

---

## Contributing

When adding new endpoints or modifying existing ones:

1. Update the corresponding test plan file
2. Add test cases for all scenarios (positive, negative, edge)
3. Document validation rules and error responses
4. Include example requests and responses
5. Update this README with endpoint counts

---

## Questions or Issues?

For questions about API testing or to report issues:

- Review the [OpenAPI specification](../openapi.yaml)
- Check existing test plans for similar patterns
- Refer to [Quick Reference](../../guides/QUICK_REFERENCE.md)
- Open an issue in the repository

---

**Last Updated**: October 30, 2025  
**API Version**: v1  
**Test Plan Generator**: GitHub Copilot
