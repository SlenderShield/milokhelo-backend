# Milokhelo Backend - Complete System Architecture Map

**Last Updated:** 2025-11-01  
**Purpose:** Comprehensive internal map of the entire codebase - all files, modules, features, patterns, dependencies, and integrations

> ⚠️ **NOTE**: This is the master reference document for understanding the complete system architecture. It consolidates knowledge from all documentation and source code into a single comprehensive map.

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Project Structure](#project-structure)
3. [Core Infrastructure](#core-infrastructure)
4. [Business Modules (13)](#business-modules)
5. [Shared Components](#shared-components)
6. [Design Patterns & Conventions](#design-patterns--conventions)
7. [Dependencies & Integrations](#dependencies--integrations)
8. [API Surface](#api-surface)
9. [Quick Reference Index](#quick-reference-index)

---

## 🎯 System Overview

### Architecture Style
**Modular Monolith** with Clean Architecture principles, designed for future microservices migration

> **Note:** The system has 13 business modules. The 14th count in some documentation refers to the dual nature of the venue module which has both user-facing routes (/venues) and management routes (/venue-management).

### Key Metrics
- **Total Files:** 303 JavaScript files
- **Business Modules:** 13 independent modules
- **API Endpoints:** 70+ REST endpoints
- **Documentation Files:** 40+ files (organized in subdirectories)
- **Test Coverage:** 13 test files (unit + integration)

### Technology Stack
```
Runtime:       Node.js 18+
Framework:     Express.js 5.x
Database:      MongoDB 5+ (Mongoose ODM)
Cache/Queue:   Redis 6+
WebSocket:     Socket.IO 4.x
Auth:          Passport.js, JWT, OAuth 2.0
Push:          Firebase Cloud Messaging, APNS
Calendar:      Google Calendar API
Logging:       Winston 3.x
Testing:       Mocha, Chai, Sinon, Supertest
```

### Architecture Principles
- ✅ **SOLID Principles** - Single responsibility, dependency inversion, interface segregation
- ✅ **DRY** - Shared utilities, base classes, centralized constants
- ✅ **Event-Driven** - Decoupled inter-module communication via EventBus
- ✅ **Dependency Injection** - IoC container for loose coupling
- ✅ **Repository Pattern** - Data access abstraction
- ✅ **DTO Pattern** - Consistent API responses
- ✅ **Clean Architecture** - Domain → Application → Infrastructure layers

---

## 📁 Project Structure

```
milokhelo-backend/
├── src/                           # Source code (303 files)
│   ├── api/                       # API layer
│   │   └── v1/                   # API version 1
│   │       ├── modules/          # 14 business modules (bounded contexts)
│   │       └── routes.js         # Central API router
│   ├── core/                      # Core infrastructure (67 files)
│   │   ├── config/               # Configuration management
│   │   ├── container/            # Dependency injection
│   │   ├── database/             # MongoDB connection & health
│   │   ├── events/               # EventBus (in-memory & Redis)
│   │   ├── http/                 # HTTP layer (middlewares, errors)
│   │   ├── jobs/                 # Job queue management (BullMQ)
│   │   ├── logging/              # Winston logging setup
│   │   ├── websocket/            # Socket.IO setup
│   │   └── utils/                # Core utilities
│   ├── common/                    # Shared code (29 files)
│   │   ├── constants/            # Application constants
│   │   ├── dto/                  # Data Transfer Objects (14 DTOs)
│   │   ├── utils/                # Common utilities
│   │   └── validation/           # Express-validator schemas (7 modules)
│   ├── app.js                     # Express app factory
│   ├── bootstrap.js               # Application initialization
│   └── server.js                  # Server entry point
├── test/                          # Test suite
│   ├── unit/                     # Unit tests
│   └── integration/              # Integration tests
├── docs/                          # Documentation (45 files)
│   ├── architecture/             # Architecture & design docs
│   ├── features/                 # Feature-specific docs
│   ├── guides/                   # Development guides
│   └── api/                      # OpenAPI spec + test plans
├── scripts/                       # Utility scripts
├── loader.js                      # Path alias loader
├── register-loader.js             # Module loader registration
├── jsconfig.json                  # Path aliasing config
├── package.json                   # Dependencies & scripts
├── docker-compose.yml             # Infrastructure setup
└── .env.example                   # Environment template
```

---

## 🏗️ Core Infrastructure

### 1. Configuration System (`src/core/config/`)

**Purpose:** Centralized configuration management with environment-specific settings

**Files:**
- `configLoader.js` - Loads and merges environment configs
- `index.js` - Config service exports
- `validator.js` - Config validation (fail-fast on startup)
- `env/development.js` - Development settings
- `env/test.js` - Test settings
- `env/production.js` - Production settings

**Usage:**
```javascript
import { getConfig } from '@/config/index.js';
const config = await getConfig();
const port = config.get('app.port');
```

**Key Features:**
- Environment-based configuration (NODE_ENV)
- Nested config access via dot notation
- Validation on startup (fail-fast)
- Default values with overrides

---

### 2. Dependency Injection Container (`src/core/container/`)

**Purpose:** IoC container for managing service dependencies and lifecycles

**Files:**
- `container.js` - DIContainer implementation
- `index.js` - Container exports

**Key Methods:**
```javascript
const container = getContainer();

// Register singleton
container.registerSingleton('serviceName', () => new Service());

// Register instance
container.registerInstance('config', configObject);

// Resolve dependency
const service = container.resolve('serviceName');

// Check registration
container.has('serviceName'); // boolean

// Get all services
container.getRegisteredServices(); // string[]
```

**Lifecycle:**
- Singleton services created once and cached
- Transient services created on each resolve
- Instance registration for pre-created objects

---

### 3. Database Layer (`src/core/database/`)

**Purpose:** MongoDB connection management and base repository

**Files:**
- `connection.js` - MongoDBConnection class (connect, disconnect, health check)
- `healthCheck.js` - DatabaseHealthCheck service
- `BaseRepository.js` - Abstract repository with common CRUD operations
- `index.js` - Database exports

**BaseRepository Methods:**
```javascript
// Create
create(data)
createMany(dataArray)

// Read
findById(id)
findOne(query)
findAll(query, options)
findWithPagination(query, page, limit, sort)

// Update
updateById(id, data)
updateOne(query, data)
updateMany(query, data)

// Delete
deleteById(id)
deleteOne(query)
deleteMany(query)

// Transactions
withTransaction(callback)
```

**Connection Features:**
- Auto-reconnection
- Connection pooling
- Health checks
- Graceful shutdown

---

### 4. EventBus System (`src/core/events/`)

**Purpose:** Event-driven inter-module communication (pub/sub pattern)

**Files:**
- `EventBusFactory.js` - Factory for creating EventBus instances
- `IEventBus.js` - EventBus interface
- `inMemoryBus.js` - In-memory implementation (development)
- `redisBus.js` - Redis implementation (production, distributed)
- `index.js` - EventBus exports

**Usage:**
```javascript
const eventBus = container.resolve('eventBus');

// Publish event
await eventBus.publish('match.finished', { matchId, winnerId });

// Subscribe to event
eventBus.subscribe('match.finished', async (data) => {
  // Handle event
});

// Unsubscribe
eventBus.unsubscribe('match.finished', handler);
```

**Adapters:**
- **InMemory** - Single process, fast, development
- **Redis** - Multi-process, distributed, production

**Events Published:** (See EVENTS constant in constants/index.js)
- System: `system.startup`, `system.shutdown`
- Match: `match.finished`, `match.created`
- User: `user.stats_updated`, `user.registered`
- Notification: `notification.created`

---

### 5. HTTP Layer (`src/core/http/`)

**Purpose:** HTTP server setup, middlewares, and error handling

#### Middlewares (`src/core/http/middlewares/`)

**Files & Purpose:**

| File | Purpose | When to Use |
|------|---------|-------------|
| `asyncHandler.js` | Wraps async route handlers to catch errors | Every async controller method |
| `authorizationMiddleware.js` | RBAC (role-based access control) | Protected routes requiring roles/permissions |
| `errorHandler.js` | Centralized error handling | Automatically applied to all routes |
| `jwtAuthMiddleware.js` | JWT token authentication | Routes requiring authentication |
| `metricsMiddleware.js` | Performance metrics collection | All routes (automatic) |
| `notFoundHandler.js` | 404 error handler | Automatic for undefined routes |
| `requestLogger.js` | Request/response logging | All routes (automatic) |
| `security.js` | Security headers (helmet, CORS, rate limiting) | All routes (automatic) |
| `sessionMiddleware.js` | Session management (Redis store) | OAuth flows, cookie-based auth |
| `validationMiddleware.js` | Request validation (express-validator) | Routes with input validation |

**Authorization Functions:**
```javascript
// Require authentication
requireAuth()

// Require specific role
requireRole('admin')

// Require minimum role level
requireMinRole('moderator') // includes admin, superadmin

// Require specific permission
requirePermission('users.delete')

// Require ownership (resource creator)
requireOwnership((req) => req.params.userId)

// Check role (returns boolean)
hasRole(user, 'admin')

// Check permission (returns boolean)
hasPermission(user, 'users.delete')
```

**Role Hierarchy:**
```javascript
ROLE_HIERARCHY = {
  guest: 0,          // Unauthenticated
  user: 1,           // Basic user
  venue_owner: 2,    // Venue management
  moderator: 3,      // Content moderation
  admin: 4,          // User/system management
  superadmin: 5      // Full access
}
```

**Permissions Matrix:**
```javascript
PERMISSIONS = {
  users: {
    read: ['user', 'moderator', 'admin', 'superadmin'],
    update: ['user', 'admin', 'superadmin'],
    delete: ['admin', 'superadmin']
  },
  venues: {
    create: ['venue_owner', 'admin', 'superadmin'],
    manage: ['venue_owner', 'admin', 'superadmin']
  }
  // ... more permissions
}
```

#### Error Handling (`src/core/http/errors/`)

**Files:**
- `AppError.js` - Base application error class
- `BookingConflictError.js` - Venue booking conflict error
- `index.js` - Error exports

**AppError Usage:**
```javascript
import { AppError, HTTP_STATUS } from '@/core/http/errors/index.js';

throw new AppError('User not found', HTTP_STATUS.NOT_FOUND, 'USER_NOT_FOUND');
```

---

### 6. Logging System (`src/core/logging/`)

**Purpose:** Structured logging with Winston

**Files:**
- `logger.js` - Winston logger factory
- `config.js` - Logging configuration
- `utils.js` - Logging utilities (redaction, sanitization)
- `index.js` - Logging exports

**Usage:**
```javascript
import { getLogger } from '@/core/logging/index.js';

const logger = getLogger();

// Basic logging
logger.info('User logged in', { userId: '123' });
logger.error('Operation failed', { error: error.message });
logger.warn('Resource low', { available: 10 });
logger.debug('Debug info', { data });

// Child logger with context
const serviceLogger = logger.child({ service: 'PaymentService' });

// Performance tracking
const trackingId = logger.startTimer('database-query');
// ... operation ...
logger.endTimer(trackingId);

// Security logging
logger.security('failed-login-attempt', { email, ip });

// Audit logging
logger.audit('user-deleted', { performedBy, targetUser });

// Request logger (automatic)
req.logger.info('Processing request', { userId: req.user.id });
```

**Features:**
- Structured JSON logging (production)
- Pretty console output (development)
- Log levels: error, warn, info, debug
- Request correlation (unique IDs)
- Performance tracking (timers)
- Automatic redaction of sensitive data
- File rotation (5MB max, 5 files)
- Security & audit logging

---

### 7. WebSocket Layer (`src/core/websocket/`)

**Purpose:** Real-time communication via Socket.IO

**Files:**
- `index.js` - WebSocket setup and event handlers

**Usage:**
```javascript
// Server-side (in service/controller)
const io = container.resolve('io');
io.to(`user:${userId}`).emit('notification', data);
io.to(`room:${roomId}`).emit('chat:message', message);

// Helper functions
emitToRoom(io, roomId, event, data);
emitToUser(io, userId, event, data);
```

**Client Events:**
- `chat:join_room` - Join chat room
- `chat:leave_room` - Leave chat room
- `chat:typing` - Typing indicator
- `chat:stop_typing` - Stop typing indicator

**Server Events:**
- `chat:message` - New message
- `chat:user_typing` - User typing
- `notification` - New notification

**Features:**
- User-based rooms (`user:{userId}`)
- Chat rooms (`room:{roomId}`)
- Authentication via handshake
- CORS support
- Auto-reconnection

---

### 8. Job Queue System (`src/core/jobs/`)

**Purpose:** Background job processing with BullMQ

**Files:**
- `QueueManager.js` - Queue management (create, add, process)
- `processors/notificationProcessor.js` - Notification job processor
- `index.js` - Jobs exports

**Usage:**
```javascript
const queueManager = container.resolve('queueManager');

// Add job to queue
await queueManager.addJob('notifications', {
  type: 'push',
  userId: '123',
  message: 'New match invitation'
});

// Process jobs
queueManager.processQueue('notifications', async (job) => {
  // Process job data
  await sendPushNotification(job.data);
});
```

**Features:**
- Redis-backed persistence
- Retry logic
- Job priorities
- Delayed jobs
- Job status tracking
- Dead letter queue

---

## �� Business Modules

### Module Structure Pattern

Every business module follows Clean Architecture with three layers:

```
module-name/
├── domain/                    # Business logic layer
│   ├── Entity.js             # Domain entity (business object)
│   └── IRepository.js        # Repository interface
├── application/               # Application logic layer
│   └── Service.js            # Use cases, business workflows
├── infrastructure/            # Technical implementation layer
│   ├── http/                 # HTTP layer
│   │   ├── Controller.js    # Route handlers
│   │   └── Routes.js        # Route definitions
│   ├── persistence/          # Data access layer
│   │   ├── Model.js         # Mongoose schema
│   │   └── Repository.js    # Repository implementation
│   └── [other]/             # Email, Push, etc.
└── index.js                   # Module bootstrapper
```

**Key Principle:** Each module owns its complete domain including all models. No shared persistence layer.

---

### Module Inventory (13 Modules)

#### 1. Authentication Module (`auth`)
**Location:** `src/api/v1/modules/auth/`  
**Purpose:** User authentication, authorization, OAuth integration

**Features:**
- JWT authentication, Session management, Google/Facebook OAuth
- Email/password registration, Password reset, Email verification
- Role-based access control (6 levels)

**API:** 9 endpoints - /providers, /oauth/google, /oauth/facebook, /session, /register, /login, /logout

---

#### 2. User Module (`user`)
**Location:** `src/api/v1/modules/user/`  
**Purpose:** User profile management, statistics, achievements

**Features:**
- Profile management, Friend system (bidirectional)
- Automatic stats updates (ELO, wins, losses, streaks)
- Achievement system (31 predefined achievements)

**API:** 9 endpoints - /me, /search, /:userId/stats, /:userId/achievements, /:friendId/friend

---

#### 3. Team Module (`team`)
**Location:** `src/api/v1/modules/team/`  
**Purpose:** Team management, member operations

**Features:**
- Team CRUD, Captain management
- Private teams with join codes, Public teams

**API:** 7 endpoints - /, /:teamId, /:teamId/join, /:teamId/leave

---

#### 4. Match Module (`match`)
**Location:** `src/api/v1/modules/match/`  
**Purpose:** Match scheduling, management, scoring

**Features:**
- Match CRUD, Join/leave, Score tracking
- Status management, Geo-spatial nearby search
- Types: friendly, competitive, tournament

**API:** 11 endpoints - /, /nearby, /:matchId, /:matchId/join, /:matchId/score, /:matchId/status

---

#### 5. Tournament Module (`tournament`)
**Location:** `src/api/v1/modules/tournament/`  
**Purpose:** Tournament management, bracket generation

**Features:**
- Knockout (single-elimination) & League (round-robin)
- Automatic bracket generation, Seeding, bye handling
- Match result tracking, Winner advancement

**API:** 11 endpoints - /, /:tournamentId, /:tournamentId/join, /:tournamentId/start, /:tournamentId/bracket

---

#### 6. Chat Module (`chat`)
**Location:** `src/api/v1/modules/chat/`  
**Purpose:** Real-time chat with WebSocket

**Features:**
- Chat rooms (team, match, tournament)
- Real-time messaging, Typing indicators

**API:** 4 endpoints + WebSocket events

---

#### 7. Venue Module (`venue`)
**Location:** `src/api/v1/modules/venue/`  
**Purpose:** Venue management, bookings, conflict prevention

**Features:**
- Venue registration, Geo-spatial search
- Atomic bookings with transactions
- Conflict prevention (optimistic locking)
- Approval/rejection workflow

**API:** 15 endpoints (8 user + 7 management)

---

#### 8. Maps Module (`maps`)
**Location:** `src/api/v1/modules/maps/`  
**Purpose:** Location management for venues

**API:** 3 endpoints - /locations

---

#### 9. Calendar Module (`calendar`)
**Location:** `src/api/v1/modules/calendar/`  
**Purpose:** Calendar integration with Google Calendar API

**Features:**
- Google Calendar OAuth 2.0, Import/export events
- Bidirectional sync, Auto-refresh tokens

**API:** 7 endpoints - /events, /sync, /google/auth, /google/sync

---

#### 10. Notification Module (`notification`)
**Location:** `src/api/v1/modules/notification/`  
**Purpose:** In-app and push notifications

**Features:**
- FCM (Android/Web) & APNS (iOS)
- Multi-device support, Priority levels
- Topic messaging, Batch notifications

**API:** 8 endpoints - /, /:id/read, /unread/count, /push-token

---

#### 11. Invitation Module (`invitation`)
**Location:** `src/api/v1/modules/invitation/`  
**Purpose:** Team/match invitations

**API:** 3 endpoints - /, /:invitationId/respond

---

#### 12. Feedback Module (`feedback`)
**Location:** `src/api/v1/modules/feedback/`  
**Purpose:** User feedback collection

**API:** 2 endpoints - / (submit and list)

---

#### 13. Admin Module (`admin`)
**Location:** `src/api/v1/modules/admin/`  
**Purpose:** Administrative operations

**API:** 3 endpoints - /users, /reports, /reports/:reportId/resolve

---

## 🔧 Shared Components

### 1. Constants (`src/common/constants/`)
Exports: EVENTS, HTTP_STATUS, ERROR_CODES

### 2. Data Transfer Objects (`src/common/dto/`)
14 DTOs for consistent API responses - UserDTO, TeamDTO, MatchDTO, etc.

### 3. Utilities (`src/common/utils/`)
Functions: delay, isEmpty, deepClone, pick, omit, retry

### 4. Validation Schemas (`src/common/validation/`)
7 validation modules using express-validator (auth, user, team, match, tournament, calendar, notification)

---

## 🎨 Design Patterns & Conventions

### 1. Module Structure Pattern
Clean Architecture: domain/ → application/ → infrastructure/

### 2. Repository Pattern
Abstract data access, enable testing

### 3. Service Pattern
Business logic orchestration

### 4. Controller Pattern
HTTP request/response handling

### 5. DTO Pattern
Consistent API responses

### 6. Event-Driven Pattern
Decoupled inter-module communication

### 7. Dependency Injection Pattern
Loose coupling, testability

### Naming Conventions
**Files:** PascalCase for classes, camelCase for functions
**Variables:** camelCase, UPPER_SNAKE_CASE for constants
**Functions:** camelCase with prefixes (get, find, create, update, delete)
**Database:** camelCase for fields, lowercase plural for collections
**Routes:** kebab-case
**Events:** Dot notation (module.action)

---

## 🔗 Dependencies & Integrations

### NPM Dependencies
- Express.js 5.x, Mongoose 8.x, Redis 5.x, Socket.IO 4.x
- Winston 3.x, JWT, Bcrypt, Passport
- Express-validator, Helmet, Rate limiter
- BullMQ, Firebase Admin, APNS, Google APIs

### External Service Integrations
1. **MongoDB** - Primary database
2. **Redis** - Session, EventBus, Jobs, Cache
3. **Google OAuth 2.0** - User authentication
4. **Facebook OAuth** - User authentication
5. **Google Calendar API** - Calendar integration
6. **Firebase Cloud Messaging** - Push (Android, Web)
7. **Apple Push Notification Service** - Push (iOS)

---

## 🌐 API Surface

- **Base URL:** `http://localhost:4000/api/v1`
- **Total Endpoints:** 70+
- **Authentication:** JWT (Bearer token) + Session (OAuth)
- **Response Format:** JSON with DTOs
- **Error Format:** Consistent error objects

---

## 📚 Quick Reference Index

### For New Developers
1. Read `docs/guides/QUICKSTART.md`
2. Review this document
3. Check `docs/guides/DEVELOPMENT_GUIDELINES.md`

### Common Tasks
- Add new module → See module pattern
- Add validation → See `src/common/validation/`
- Add DTO → See `src/common/dto/`
- Publish event → See EventBus pattern

### Key Files
- `src/bootstrap.js` - Application initialization
- `src/app.js` - Express app setup
- `src/api/v1/routes.js` - API routing

### Testing
```bash
npm test                  # All tests
npm run test:unit         # Unit tests
npm run test:integration  # Integration tests
```

### Development
```bash
npm run dev               # Start dev server
npm start                 # Production server
npm run lint              # Check code
npm run format            # Format code
```

---

## 🎓 Learning Path

**Week 1:** Foundation (read docs, explore core)
**Week 2:** Modules (study simple then complex modules)
**Week 3:** Patterns (repository, service, controller, DTOs)
**Week 4:** Advanced (WebSocket, OAuth, Push, Calendar)

---

## 📝 Maintenance Notes

**When Adding Features:**
1. Check if similar feature exists
2. Identify module to extend
3. Follow established patterns
4. Update this document

---

**For Questions:** Refer to `docs/features/` or `docs/guides/DEVELOPMENT_GUIDELINES.md`

**End of System Architecture Map**
