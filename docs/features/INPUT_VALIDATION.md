# Input Validation

Complete guide to the input validation system with express-validator middleware, validation schemas, and security best practices.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Validation Middleware](#validation-middleware)
- [Validation Schemas](#validation-schemas)
- [Usage Examples](#usage-examples)
- [API Integration](#api-integration)
- [Testing](#testing)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Security Considerations](#security-considerations)

## Overview

The Milokhelo backend implements a comprehensive input validation system that provides:

- **Request validation** for all API endpoints
- **17+ validation schemas** across 5 modules
- **Express-validator** integration for declarative validation
- **Automatic error formatting** with detailed field-level errors
- **Type coercion** and sanitization
- **Custom validation rules** for complex business logic
- **Chainable validation** for clean, readable code

The validation system ensures that all user input is validated before reaching business logic, preventing invalid data from entering the system and improving API security.

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│              Input Validation System                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │       Validation Middleware Layer                     │  │
│  │  • validate() - Chain wrapper                         │  │
│  │  • validateRequest() - Error handler                  │  │
│  │  • express-validator integration                      │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       │                                      │
│  ┌────────────────────▼─────────────────────────────────┐  │
│  │       Validation Schema Definitions                   │  │
│  │  • authValidation.js - Auth endpoints                 │  │
│  │  • userValidation.js - User endpoints                 │  │
│  │  • matchValidation.js - Match endpoints               │  │
│  │  • calendarValidation.js - Calendar endpoints         │  │
│  │  • notificationValidation.js - Notification endpoints │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       │                                      │
│  ┌────────────────────▼─────────────────────────────────┐  │
│  │         express-validator Core                        │  │
│  │  • body() - Request body validation                   │  │
│  │  • param() - URL parameter validation                 │  │
│  │  • query() - Query string validation                  │  │
│  │  • validationResult() - Error extraction              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow

```
Incoming Request
    │
    ▼
Route Handler with validate() middleware
    │
    ▼
Express-Validator Chains Execute
    │ • Check field presence
    │ • Validate field types
    │ • Validate field formats
    │ • Apply custom validators
    │ • Sanitize/normalize data
    ▼
validateRequest() Middleware
    │ Check validation result
    │ No errors? → Continue to next middleware/controller
    │ Has errors? ↓
    ▼
Format Error Response
    │ • Extract field errors
    │ • Format error objects
    │ • Return 400 Bad Request with detailed errors
    ▼
Client receives validation error ❌
```

## Validation Middleware

### Core Functions

Located in `src/core/http/middlewares/validationMiddleware.js`:

#### validateRequest()

Checks validation results and returns formatted errors if validation fails.

```javascript
export function validateRequest() {
  return (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().map((error) => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value,
      }));

      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        status: 'error',
        message: 'Validation failed',
        errors: formattedErrors,
      });
    }

    next();
  };
}
```

**Error Response Format:**
```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Must be a valid email address",
      "value": "invalid-email"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters long",
      "value": "123"
    }
  ]
}
```

#### validate()

Wraps validation chains with automatic error handling.

```javascript
export function validate(validations) {
  return [...validations, validateRequest()];
}
```

**Usage:**
```javascript
router.post('/register', validate(registerValidation), controller.register());
```

## Validation Schemas

### Authentication Validation (`authValidation.js`)

#### registerValidation

Validates user registration data.

```javascript
export const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail()
    .trim(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('username')
    .optional()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens')
    .trim(),
  body('firstName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters')
    .trim(),
  body('lastName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters')
    .trim(),
];
```

**Validation Rules:**
- ✅ Email: Valid format, normalized
- ✅ Password: Min 8 chars, 1 uppercase, 1 lowercase, 1 number
- ✅ Username: 3-30 chars, alphanumeric with `_` and `-`
- ✅ Names: 1-50 characters, trimmed

#### loginValidation

Validates user login credentials.

```javascript
export const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail()
    .trim(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];
```

### User Validation (`userValidation.js`)

#### updateUserValidation

Validates user profile updates.

```javascript
export const updateUserValidation = [
  body('username')
    .optional()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens')
    .trim(),
  body('firstName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters')
    .trim(),
  body('lastName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters')
    .trim(),
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio must not exceed 500 characters')
    .trim(),
  body('location')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Location must not exceed 100 characters')
    .trim(),
  body('favoriteVenue')
    .optional()
    .isMongoId()
    .withMessage('Invalid venue ID'),
];
```

#### userIdValidation

Validates MongoDB ObjectId in URL parameters.

```javascript
export const userIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid user ID'),
];
```

#### searchUsersValidation

Validates user search query parameters.

```javascript
export const searchUsersValidation = [
  query('query')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters')
    .trim(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  query('skip')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Skip must be a non-negative integer')
    .toInt(),
];
```

### Match Validation (`matchValidation.js`)

#### createMatchValidation

Validates match creation data.

```javascript
export const createMatchValidation = [
  body('title')
    .notEmpty()
    .withMessage('Match title is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters')
    .trim(),
  body('sport')
    .notEmpty()
    .withMessage('Sport is required')
    .isIn(['football', 'basketball', 'volleyball', 'tennis', 'badminton', 'cricket', 'other'])
    .withMessage('Invalid sport type'),
  body('matchType')
    .notEmpty()
    .withMessage('Match type is required')
    .isIn(['individual', 'team', 'friendly', 'competitive'])
    .withMessage('Invalid match type'),
  body('date')
    .notEmpty()
    .withMessage('Match date is required')
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date')
    .custom((date) => {
      if (new Date(date) < new Date()) {
        throw new Error('Match date cannot be in the past');
      }
      return true;
    }),
  body('location')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Location must not exceed 200 characters')
    .trim(),
  body('venueId')
    .optional()
    .isMongoId()
    .withMessage('Invalid venue ID'),
  body('maxParticipants')
    .optional()
    .isInt({ min: 2, max: 100 })
    .withMessage('Max participants must be between 2 and 100')
    .toInt(),
  body('skillLevel')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced', 'professional'])
    .withMessage('Invalid skill level'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters')
    .trim(),
];
```

**Key Features:**
- ✅ Custom validator for date (no past dates)
- ✅ Enum validation for sport and skill level
- ✅ Type coercion (toInt()) for numeric fields
- ✅ MongoDB ObjectId validation

#### updateMatchValidation

```javascript
export const updateMatchValidation = [
  param('matchId')
    .isMongoId()
    .withMessage('Invalid match ID'),
  body('title')
    .optional()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters')
    .trim(),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date'),
  body('location')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Location must not exceed 200 characters')
    .trim(),
  body('status')
    .optional()
    .isIn(['scheduled', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
];
```

#### finishMatchValidation

```javascript
export const finishMatchValidation = [
  param('matchId')
    .isMongoId()
    .withMessage('Invalid match ID'),
  body('winnerId')
    .optional()
    .isMongoId()
    .withMessage('Invalid winner ID'),
  body('score')
    .optional()
    .isObject()
    .withMessage('Score must be an object'),
  body('stats')
    .optional()
    .isArray()
    .withMessage('Stats must be an array'),
];
```

#### nearbyMatchesValidation

Validates geo-spatial search parameters.

```javascript
export const nearbyMatchesValidation = [
  query('latitude')
    .notEmpty()
    .withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90')
    .toFloat(),
  query('longitude')
    .notEmpty()
    .withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180')
    .toFloat(),
  query('maxDistance')
    .optional()
    .isInt({ min: 100, max: 100000 })
    .withMessage('Max distance must be between 100 and 100000 meters')
    .toInt(),
];
```

### Calendar Validation (`calendarValidation.js`)

#### createEventValidation

```javascript
export const createEventValidation = [
  body('title')
    .notEmpty()
    .withMessage('Event title is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters')
    .trim(),
  body('startTime')
    .notEmpty()
    .withMessage('Start time is required')
    .isISO8601()
    .withMessage('Start time must be a valid ISO 8601 date'),
  body('endTime')
    .notEmpty()
    .withMessage('End time is required')
    .isISO8601()
    .withMessage('End time must be a valid ISO 8601 date')
    .custom((endTime, { req }) => {
      if (new Date(endTime) <= new Date(req.body.startTime)) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),
  body('location')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Location must not exceed 200 characters')
    .trim(),
  body('eventType')
    .optional()
    .isIn(['match', 'tournament', 'training', 'booking', 'other'])
    .withMessage('Invalid event type'),
  body('relatedEntityId')
    .optional()
    .isMongoId()
    .withMessage('Invalid entity ID'),
];
```

**Key Features:**
- ✅ Cross-field validation (endTime > startTime)
- ✅ Access to other request fields via `{ req }`

#### getEventsValidation

```javascript
export const getEventsValidation = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  query('eventType')
    .optional()
    .isIn(['match', 'tournament', 'training', 'booking', 'other'])
    .withMessage('Invalid event type'),
];
```

### Notification Validation (`notificationValidation.js`)

#### registerPushTokenValidation

```javascript
export const registerPushTokenValidation = [
  body('token')
    .notEmpty()
    .withMessage('Push token is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Push token must be between 10 and 500 characters')
    .trim(),
  body('platform')
    .notEmpty()
    .withMessage('Platform is required')
    .isIn(['ios', 'android', 'web'])
    .withMessage('Platform must be ios, android, or web'),
  body('deviceId')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Device ID must not exceed 100 characters')
    .trim(),
];
```

#### getNotificationsValidation

```javascript
export const getNotificationsValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  query('skip')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Skip must be a non-negative integer')
    .toInt(),
  query('unreadOnly')
    .optional()
    .isBoolean()
    .withMessage('unreadOnly must be a boolean')
    .toBoolean(),
];
```

#### createNotificationValidation

```javascript
export const createNotificationValidation = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid user ID'),
  body('type')
    .notEmpty()
    .withMessage('Notification type is required')
    .isIn(['match', 'tournament', 'team', 'invitation', 'achievement', 'system', 'booking'])
    .withMessage('Invalid notification type'),
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters')
    .trim(),
  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 1, max: 500 })
    .withMessage('Message must be between 1 and 500 characters')
    .trim(),
  body('relatedEntityId')
    .optional()
    .isMongoId()
    .withMessage('Invalid entity ID'),
  body('priority')
    .optional()
    .isIn(['low', 'normal', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
];
```

## Usage Examples

### Example 1: Simple Validation

```javascript
import { validate } from '@/core/http/middlewares/index.js';
import { loginValidation } from '@/common/validation/index.js';

router.post('/login', validate(loginValidation), controller.login());
```

**Valid Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Invalid Request:**
```json
{
  "email": "invalid-email",
  "password": ""
}
```

**Error Response:**
```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Must be a valid email address",
      "value": "invalid-email"
    },
    {
      "field": "password",
      "message": "Password is required",
      "value": ""
    }
  ]
}
```

### Example 2: Parameter Validation

```javascript
import { validate } from '@/core/http/middlewares/index.js';
import { userIdValidation } from '@/common/validation/index.js';

router.get('/users/:id', validate(userIdValidation), controller.getUser());
```

**Valid Request:**
```
GET /users/507f1f77bcf86cd799439011
```

**Invalid Request:**
```
GET /users/invalid-id
```

**Error Response:**
```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "field": "id",
      "message": "Invalid user ID",
      "value": "invalid-id"
    }
  ]
}
```

### Example 3: Query Parameter Validation

```javascript
import { validate } from '@/core/http/middlewares/index.js';
import { searchUsersValidation } from '@/common/validation/index.js';

router.get('/users', validate(searchUsersValidation), controller.searchUsers());
```

**Valid Request:**
```
GET /users?query=john&limit=20&skip=0
```

**Invalid Request:**
```
GET /users?query=&limit=500&skip=-1
```

**Error Response:**
```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "field": "limit",
      "message": "Limit must be between 1 and 100",
      "value": "500"
    },
    {
      "field": "skip",
      "message": "Skip must be a non-negative integer",
      "value": "-1"
    }
  ]
}
```

### Example 4: Custom Validation

```javascript
body('date')
  .notEmpty()
  .withMessage('Date is required')
  .isISO8601()
  .withMessage('Date must be valid ISO 8601 format')
  .custom((date) => {
    if (new Date(date) < new Date()) {
      throw new Error('Date cannot be in the past');
    }
    return true;
  })
```

### Example 5: Cross-Field Validation

```javascript
body('endTime')
  .notEmpty()
  .withMessage('End time is required')
  .isISO8601()
  .withMessage('End time must be a valid ISO 8601 date')
  .custom((endTime, { req }) => {
    if (new Date(endTime) <= new Date(req.body.startTime)) {
      throw new Error('End time must be after start time');
    }
    return true;
  })
```

### Example 6: Multiple Validations

```javascript
router.post('/matches',
  requireAuth(),                          // Authentication
  validate(createMatchValidation),        // Input validation
  requirePermission('match:create'),      // Authorization
  controller.createMatch()                // Controller
);
```

## API Integration

### Notification Routes

```javascript
import { validate } from '@/core/http/middlewares/index.js';
import {
  registerPushTokenValidation,
  markAsReadValidation,
  getNotificationsValidation,
} from '@/common/validation/index.js';

router.get('/', validate(getNotificationsValidation), controller.getNotifications());
router.patch('/:id/read', validate(markAsReadValidation), controller.markAsRead());
router.post('/push-token', validate(registerPushTokenValidation), controller.registerPushToken());
```

### Calendar Routes

```javascript
import { validate } from '@/core/http/middlewares/index.js';
import {
  createEventValidation,
  syncEventsValidation,
  getEventsValidation,
} from '@/common/validation/index.js';

router.get('/events', validate(getEventsValidation), controller.getEvents());
router.post('/events', validate(createEventValidation), controller.createEvent());
router.post('/sync', validate(syncEventsValidation), controller.syncEvents());
```

## Testing

### Unit Tests

Located in `test/unit/validationMiddleware.test.js`:

```javascript
import { validateRequest, validate } from '@/core/http/middlewares/validationMiddleware.js';
import { body } from 'express-validator';

describe('Validation Middleware', () => {
  describe('validateRequest()', () => {
    it('should format errors correctly when validation fails', () => {
      const mockErrors = [
        {
          path: 'email',
          msg: 'Must be a valid email',
          value: 'invalid-email',
          param: 'email',
        },
      ];

      const formattedErrors = mockErrors.map((error) => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value,
      }));

      expect(formattedErrors).to.have.lengthOf(1);
      expect(formattedErrors[0]).to.deep.equal({
        field: 'email',
        message: 'Must be a valid email',
        value: 'invalid-email',
      });
    });
  });

  describe('validate()', () => {
    it('should return array with validations and validateRequest', () => {
      const validations = [
        body('email').isEmail(),
        body('password').isLength({ min: 8 }),
      ];

      const result = validate(validations);

      expect(result).to.be.an('array');
      expect(result).to.have.lengthOf(3); // 2 validations + validateRequest
    });
  });
});
```

### Integration Tests

Test validation in actual API calls:

```javascript
describe('POST /auth/register', () => {
  it('should reject invalid email', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'invalid-email',
        password: 'Password123'
      })
      .expect(400);

    expect(response.body.status).to.equal('error');
    expect(response.body.message).to.equal('Validation failed');
    expect(response.body.errors).to.be.an('array');
    expect(response.body.errors[0].field).to.equal('email');
  });

  it('should reject weak password', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'user@example.com',
        password: '123'
      })
      .expect(400);

    expect(response.body.errors).to.have.lengthOf.at.least(1);
    const passwordError = response.body.errors.find(e => e.field === 'password');
    expect(passwordError).to.exist;
  });
});
```

## Best Practices

### 1. Validate All Inputs

```javascript
// ✅ Good - Validate all input sources
router.post('/:id/items',
  validate([
    param('id').isMongoId(),           // URL parameter
    query('sort').optional().isIn(['asc', 'desc']),  // Query string
    body('name').notEmpty(),           // Request body
  ]),
  controller.create()
);

// ❌ Bad - No validation
router.post('/:id/items', controller.create());
```

### 2. Use Specific Validators

```javascript
// ✅ Good - Specific validators
body('email').isEmail().normalizeEmail()
body('age').isInt({ min: 0, max: 120 })
body('url').isURL()

// ❌ Bad - Generic validators
body('email').notEmpty()
body('age').notEmpty()
body('url').notEmpty()
```

### 3. Provide Clear Error Messages

```javascript
// ✅ Good - Clear, actionable messages
body('password')
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters long')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')

// ❌ Bad - Vague messages
body('password')
  .isLength({ min: 8 })
  .withMessage('Invalid password')
```

### 4. Sanitize Inputs

```javascript
// ✅ Good - Sanitize inputs
body('email')
  .isEmail()
  .normalizeEmail()    // Sanitize
  .trim()              // Remove whitespace

body('name')
  .isLength({ min: 1, max: 50 })
  .trim()
  .escape()            // Prevent XSS

// ❌ Bad - No sanitization
body('email').isEmail()
body('name').isLength({ min: 1, max: 50 })
```

### 5. Use Custom Validators for Business Logic

```javascript
// ✅ Good - Custom validator for business rules
body('date')
  .isISO8601()
  .custom((date) => {
    if (new Date(date) < new Date()) {
      throw new Error('Date cannot be in the past');
    }
    return true;
  })

// ❌ Bad - Validation in controller
router.post('/matches', controller.createMatch()); // validates inside controller
```

### 6. Chain Validators Logically

```javascript
// ✅ Good - Logical order (presence → type → format → business rules)
body('email')
  .notEmpty().withMessage('Email is required')       // 1. Presence
  .isEmail().withMessage('Must be valid email')      // 2. Format
  .normalizeEmail()                                  // 3. Sanitize
  .custom(checkEmailAvailable)                       // 4. Business rule

// ❌ Bad - Illogical order
body('email')
  .custom(checkEmailAvailable)                       // Runs even if empty!
  .notEmpty()
  .isEmail()
```

### 7. Validate Arrays

```javascript
// ✅ Good - Array validation
body('tags')
  .optional()
  .isArray()
  .withMessage('Tags must be an array'),
body('tags.*')
  .isString()
  .withMessage('Each tag must be a string')
  .isLength({ min: 1, max: 50 })
  .withMessage('Each tag must be between 1 and 50 characters')

// ❌ Bad - No array element validation
body('tags').optional().isArray()
```

## Troubleshooting

### Issue: Validation not running

**Cause**: Missing `validate()` wrapper

**Solution**:
```javascript
// ❌ Wrong
router.post('/register', registerValidation, controller.register());

// ✅ Correct
router.post('/register', validate(registerValidation), controller.register());
```

### Issue: Always getting validation errors

**Cause**: Field name mismatch

**Solution**:
```javascript
// Check field names match request body
body('email')  // Must match req.body.email
param('id')    // Must match req.params.id
query('sort')  // Must match req.query.sort
```

### Issue: Type coercion not working

**Cause**: Missing type conversion

**Solution**:
```javascript
// ❌ Wrong - String "10" stays as string
query('limit').isInt({ min: 1, max: 100 })

// ✅ Correct - Converts to number
query('limit')
  .isInt({ min: 1, max: 100 })
  .toInt()  // Convert to integer
```

### Issue: Custom validator not working

**Cause**: Not throwing error or returning false

**Solution**:
```javascript
// ✅ Correct - Throw error
.custom((value) => {
  if (invalid) {
    throw new Error('Custom error message');
  }
  return true;  // Must return true if valid
})

// ❌ Wrong - Just returns false
.custom((value) => {
  return !invalid;  // Error message not clear
})
```

### Issue: Optional field always required

**Cause**: Using `notEmpty()` with `optional()`

**Solution**:
```javascript
// ❌ Wrong
body('bio')
  .notEmpty()      // Always required!
  .optional()

// ✅ Correct
body('bio')
  .optional()      // First mark as optional
  .isLength({ max: 500 })
```

## Security Considerations

### 1. Always Validate and Sanitize

```javascript
// Prevent XSS
body('comment')
  .trim()
  .escape()
  .isLength({ max: 1000 });

// Prevent NoSQL injection in MongoDB IDs
param('id')
  .isMongoId()  // Ensures valid ObjectId format
```

### 2. Rate Limiting

Combine validation with rate limiting for brute force protection:

```javascript
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later'
});

router.post('/login', 
  loginLimiter,
  validate(loginValidation),
  controller.login()
);
```

### 3. Content Type Validation

```javascript
// Only accept JSON
router.use(express.json({ 
  limit: '1mb',  // Prevent large payloads
  strict: true   // Reject non-JSON
}));
```

### 4. File Upload Validation

```javascript
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});
```

### 5. SQL/NoSQL Injection Prevention

```javascript
// ✅ Good - Validate all database queries
body('userId')
  .isMongoId()  // Only accept valid ObjectIds
  
query('sort')
  .optional()
  .isIn(['asc', 'desc'])  // Whitelist allowed values

// ❌ Bad - Direct string interpolation
// const query = `SELECT * FROM users WHERE name = '${req.body.name}'`;
```

## Express-Validator API Reference

### Common Validators

- `isEmail()` - Valid email address
- `isMongoId()` - Valid MongoDB ObjectId
- `isISO8601()` - Valid ISO 8601 date
- `isURL()` - Valid URL
- `isInt(options)` - Integer with optional min/max
- `isFloat(options)` - Float with optional min/max
- `isLength(options)` - String length validation
- `isIn(values)` - Enum validation
- `isBoolean()` - Boolean value
- `isArray()` - Array type
- `isObject()` - Object type
- `matches(pattern)` - Regex pattern matching

### Common Sanitizers

- `trim()` - Remove leading/trailing whitespace
- `escape()` - HTML entity encoding
- `normalizeEmail()` - Normalize email format
- `toInt()` - Convert to integer
- `toFloat()` - Convert to float
- `toBoolean()` - Convert to boolean
- `toLowerCase()` - Convert to lowercase
- `toUpperCase()` - Convert to uppercase

### Chain Methods

- `optional()` - Mark field as optional
- `notEmpty()` - Require non-empty value
- `withMessage(msg)` - Custom error message
- `custom(fn)` - Custom validation function

## Further Reading

- [Express-Validator Documentation](https://express-validator.github.io/docs/)
- [OWASP Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

**Next Steps:**
1. Review validation schemas for your endpoints
2. Add validation to unprotected routes
3. Test validation with invalid inputs
4. Monitor validation errors in logs
5. Update validation rules as requirements change
