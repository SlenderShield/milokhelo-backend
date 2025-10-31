# Milokhelo Backend - Complete Feature & Module Index

**Last Updated:** 2025-10-31  
**Purpose:** Central reference for all features, modules, and implementation details to prevent duplication and ensure consistency

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Module Inventory](#module-inventory)
3. [Core Infrastructure](#core-infrastructure)
4. [Shared Libraries](#shared-libraries)
5. [Integration Points](#integration-points)
6. [Redundancy Analysis](#redundancy-analysis)
7. [Reusability Recommendations](#reusability-recommendations)

---

## 🏗️ Architecture Overview

**Architecture Style:** Modular Monolith with Clean Architecture Principles  
**Pattern:** Layered architecture within each module (Domain → Application → Infrastructure)  
**Total Modules:** 14 business modules + core infrastructure  
**Total Files:** 303 JavaScript files

### Layer Structure (Per Module)

```
module/
├── domain/          # Business entities, interfaces, domain logic
├── application/     # Use cases, business workflows, services
├── infrastructure/  # External concerns (HTTP, DB, email, etc.)
│   ├── http/       # Controllers, Routes
│   ├── persistence/# Models, Repositories
│   └── [other]/    # Email, Push notifications, etc.
└── index.js        # Module bootstrapper
```

### Design Principles Applied

- **Dependency Injection:** Via custom DI container
- **Repository Pattern:** Data access abstraction
- **DTO Pattern:** Data transfer objects for API responses (newly added)
- **Event-Driven:** EventBus for decoupled communication
- **SOLID:** Single responsibility, dependency inversion
- **DRY:** Reusable utilities and base classes

---

## 📦 Module Inventory

### 1. Authentication Module (`auth`)

**Location:** `src/api/v1/modules/auth/`  
**Purpose:** User authentication, authorization, session management, OAuth integration

**Key Components:**

| Component | Path | Purpose | Reusability |
|-----------|------|---------|-------------|
| AuthService | `application/AuthService.js` | Authentication business logic | ✅ Core service |
| AuthController | `infrastructure/http/AuthController.js` | HTTP endpoint handlers | ❌ HTTP-specific |
| AuthRepository | `infrastructure/persistence/AuthRepository.js` | User data access | ✅ Via interface |
| UserModel | `infrastructure/persistence/UserModel.js` | Mongoose schema | ⚠️ Schema reference |
| TokenModel | `infrastructure/persistence/TokenModel.js` | Token storage schema | ⚠️ Schema reference |
| PassportConfig | `infrastructure/passport/PassportConfig.js` | Passport.js setup | ✅ Auth strategy |
| GoogleStrategy | `infrastructure/passport/strategies/GoogleStrategy.js` | Google OAuth | ✅ OAuth strategy |
| FacebookStrategy | `infrastructure/passport/strategies/FacebookStrategy.js` | Facebook OAuth | ✅ OAuth strategy |
| EmailService | `infrastructure/email/EmailService.js` | Email notifications | ✅ Email utility |

**Features Implemented:**
- ✅ JWT token authentication
- ✅ Session management
- ✅ Role-based access control (RBAC)
- ✅ Google OAuth2 integration
- ✅ Facebook OAuth integration
- ✅ Password reset via email
- ✅ Email verification

**Dependencies:**
- passport, passport-google-oauth20, passport-facebook
- jsonwebtoken, bcryptjs
- nodemailer

**Notes:**
- Uses hybrid session + JWT approach
- Supports multiple authentication strategies
- Role hierarchy: user → coach → admin → superadmin

---

### 2. User Module (`user`)

**Location:** `src/api/v1/modules/user/`  
**Purpose:** User profile management, statistics, achievements

**Key Components:**

| Component | Path | Purpose | Reusability |
|-----------|------|---------|-------------|
| UserService | `application/UserService.js` | Profile management logic | ✅ Core service |
| StatsUpdateHandler | `application/StatsUpdateHandler.js` | Auto-update user stats | ✅ Event handler |
| AchievementEvaluator | `application/AchievementEvaluator.js` | Achievement unlock logic | ✅ Business logic |
| UserEntity | `domain/UserEntity.js` | Domain entity | ✅ Domain model |
| IUserRepository | `domain/IUserRepository.js` | Repository interface | ✅ Contract |
| UserController | `infrastructure/http/UserController.js` | HTTP handlers | ❌ HTTP-specific |
| UserRepository | `infrastructure/persistence/UserRepository.js` | User data access | ✅ Via interface |
| UserStatModel | `infrastructure/persistence/UserStatModel.js` | Stats schema | ⚠️ Schema reference |
| AchievementModel | `infrastructure/persistence/AchievementModel.js` | Achievement schema | ⚠️ Schema reference |
| AchievementRepository | `infrastructure/persistence/AchievementRepository.js` | Achievement data | ✅ Via interface |
| achievementSeeds | `infrastructure/persistence/achievementSeeds.js` | Seed data | ⚠️ One-time use |

**Features Implemented:**
- ✅ User profile CRUD
- ✅ Profile search with filters
- ✅ Privacy settings (phone, location)
- ✅ User statistics (matches, wins, goals)
- ✅ Auto-update stats on match completion
- ✅ Achievement system with unlock tracking
- ✅ Leaderboard/rankings

**Dependencies:**
- UserModel from auth module (shared)

**Event Subscriptions:**
- `match.completed` → Update user stats
- `user.stats.updated` → Evaluate achievements

**Notes:**
- Stats automatically updated via EventBus
- 15+ predefined achievements
- Achievement evaluator checks conditions on stats update

---

### 3. Team Module (`team`)

**Location:** `src/api/v1/modules/team/`  
**Purpose:** Team management, roster, captain permissions

**Key Components:**

| Component | Path | Purpose | Reusability |
|-----------|------|---------|-------------|
| TeamService | `application/TeamService.js` | Team business logic | ✅ Core service |
| TeamController | `infrastructure/http/TeamController.js` | HTTP handlers | ❌ HTTP-specific |
| TeamRepository | `infrastructure/persistence/TeamRepository.js` | Team data access | ✅ Via repository |
| TeamModel | `infrastructure/persistence/TeamModel.js` | Team schema | ⚠️ Schema reference |

**Features Implemented:**
- ✅ Team CRUD operations
- ✅ Captain role management
- ✅ Member roster management
- ✅ Join via code
- ✅ Team search and listing

**Schema Fields:**
- name, description, sport, captain, members
- joinCode (unique, 6-char)
- createdAt, updatedAt

**Notes:**
- Captain has full control
- Members can view but not modify
- JoinCode auto-generated

---

### 4. Match Module (`match`)

**Location:** `src/api/v1/modules/match/`  
**Purpose:** Match scheduling, scoring, result tracking

**Key Components:**

| Component | Path | Purpose | Reusability |
|-----------|------|---------|-------------|
| MatchService | `application/MatchService.js` | Match business logic | ✅ Core service |
| MatchController | `infrastructure/http/MatchController.js` | HTTP handlers | ❌ HTTP-specific |
| MatchRepository | `infrastructure/persistence/MatchRepository.js` | Match data access | ✅ Via repository |
| MatchModel | `infrastructure/persistence/MatchModel.js` | Match schema | ⚠️ Schema reference |

**Features Implemented:**
- ✅ Match CRUD operations
- ✅ Score tracking
- ✅ Match status workflow (scheduled → in_progress → completed)
- ✅ Team vs team matches
- ✅ Venue association
- ✅ Match history

**Event Publications:**
- `match.completed` → Triggers stats update

**Schema Fields:**
- homeTeam, awayTeam, venue, dateTime
- homeScore, awayScore, status
- sport, createdBy

**Notes:**
- Publishes event on completion
- Supports conflict detection with venue bookings

---

### 5. Tournament Module (`tournament`)

**Location:** `src/api/v1/modules/tournament/`  
**Purpose:** Tournament management, bracket generation, registration

**Key Components:**

| Component | Path | Purpose | Reusability |
|-----------|------|---------|-------------|
| TournamentService | `application/TournamentService.js` | Tournament logic | ✅ Core service |
| BracketGenerator | `domain/BracketGenerator.js` | Bracket creation | ✅ Algorithm |
| TournamentController | `infrastructure/http/TournamentController.js` | HTTP handlers | ❌ HTTP-specific |
| TournamentRepository | `infrastructure/persistence/TournamentRepository.js` | Tournament data | ✅ Via repository |
| TournamentModel | `infrastructure/persistence/TournamentModel.js` | Tournament schema | ⚠️ Schema reference |

**Features Implemented:**
- ✅ Tournament CRUD
- ✅ Registration system
- ✅ Single/double elimination brackets
- ✅ Round-robin format
- ✅ Bracket auto-generation
- ✅ Match scheduling within tournament
- ✅ Winner tracking

**Bracket Types:**
- Single elimination
- Double elimination
- Round-robin

**Schema Fields:**
- name, description, sport, type, format
- teams (registered), maxTeams
- bracket (structure), status
- startDate, endDate

**Notes:**
- BracketGenerator is reusable algorithm
- Supports multiple tournament formats
- Auto-creates matches from bracket

---

### 6. Venue Module (`venue`)

**Location:** `src/api/v1/modules/venue/`  
**Purpose:** Venue management, booking, availability

**Key Components:**

| Component | Path | Purpose | Reusability |
|-----------|------|---------|-------------|
| VenueService | `application/VenueService.js` | Venue business logic | ✅ Core service |
| VenueController | `infrastructure/http/VenueController.js` | HTTP handlers | ❌ HTTP-specific |
| VenueRepository | `infrastructure/persistence/VenueRepository.js` | Venue data access | ✅ Via repository |
| VenueModel | `infrastructure/persistence/VenueModel.js` | Venue schema | ⚠️ Schema reference |

**Features Implemented:**
- ✅ Venue CRUD operations
- ✅ Geo-location support (lat/lng)
- ✅ Search by location radius
- ✅ Availability checking
- ✅ Booking system
- ✅ Conflict prevention
- ✅ Facility listing

**Geo Features:**
- 2dsphere index for location
- Nearby venue search
- Distance calculation

**Schema Fields:**
- name, address, city, location (GeoJSON)
- sportsSupported, facilities
- ownerId, contactInfo
- bookings (array), operatingHours

**Notes:**
- Prevents double-booking via conflict check
- Uses MongoDB geospatial queries

---

### 7. Notification Module (`notification`)

**Location:** `src/api/v1/modules/notification/`  
**Purpose:** Push notifications, in-app notifications

**Key Components:**

| Component | Path | Purpose | Reusability |
|-----------|------|---------|-------------|
| NotificationService | `application/NotificationService.js` | Notification logic | ✅ Core service |
| PushNotificationService | `infrastructure/PushNotificationService.js` | Push dispatch | ✅ Push utility |
| FCMService | `infrastructure/FCMService.js` | Firebase Cloud Messaging | ✅ FCM integration |
| APNSService | `infrastructure/APNSService.js` | Apple Push Notification | ✅ APNS integration |
| NotificationController | `infrastructure/http/NotificationController.js` | HTTP handlers | ❌ HTTP-specific |
| NotificationRepository | `infrastructure/persistence/NotificationRepository.js` | Notification data | ✅ Via repository |
| NotificationModel | `infrastructure/persistence/NotificationModel.js` | Notification schema | ⚠️ Schema reference |

**Features Implemented:**
- ✅ In-app notifications
- ✅ Push notifications (iOS & Android)
- ✅ Device token registration
- ✅ Read/unread tracking
- ✅ Notification types (match, team, achievement, etc.)
- ✅ Batch sending

**Notification Types:**
- MATCH_REMINDER
- TEAM_INVITATION
- ACHIEVEMENT_UNLOCKED
- TOURNAMENT_UPDATE
- BOOKING_CONFIRMED

**Dependencies:**
- firebase-admin (FCM)
- apn (APNS)

**Notes:**
- Supports both platforms (iOS/Android)
- Can send to specific users or broadcast
- Integrates with EventBus for auto-notifications

---

### 8. Chat Module (`chat`)

**Location:** `src/api/v1/modules/chat/`  
**Purpose:** Real-time messaging, chat rooms

**Key Components:**

| Component | Path | Purpose | Reusability |
|-----------|------|---------|-------------|
| ChatService | `application/ChatService.js` | Chat business logic | ✅ Core service |
| ChatController | `infrastructure/http/ChatController.js` | HTTP handlers | ❌ HTTP-specific |
| ChatRepository | `infrastructure/persistence/ChatRepository.js` | Chat data access | ✅ Via repository |
| ChatModel | `infrastructure/persistence/ChatModel.js` | Chat schema | ⚠️ Schema reference |

**Features Implemented:**
- ✅ Chat room creation (team, match, tournament)
- ✅ Message sending/receiving
- ✅ Message history
- ✅ Read receipts
- ✅ Participant management
- ✅ Room archiving

**Room Types:**
- Team chat
- Match chat
- Tournament chat
- Direct message

**Schema Fields:**
- roomId, participants, messages
- type (team/match/tournament/dm)
- lastMessage, unreadCount
- archived

**Notes:**
- Can be extended with Socket.IO for real-time
- Currently REST-based
- Supports pagination for message history

---

### 9. Calendar Module (`calendar`)

**Location:** `src/api/v1/modules/calendar/`  
**Purpose:** Event management, Google Calendar sync

**Key Components:**

| Component | Path | Purpose | Reusability |
|-----------|------|---------|-------------|
| CalendarService | `application/CalendarService.js` | Calendar logic | ✅ Core service |
| GoogleCalendarService | `infrastructure/GoogleCalendarService.js` | Google Cal sync | ✅ Integration |
| CalendarController | `infrastructure/http/CalendarController.js` | HTTP handlers | ❌ HTTP-specific |
| CalendarRepository | `infrastructure/persistence/CalendarRepository.js` | Calendar data | ✅ Via repository |
| CalendarModel | `infrastructure/persistence/CalendarModel.js` | Calendar schema | ⚠️ Schema reference |

**Features Implemented:**
- ✅ Personal calendar events
- ✅ Match/tournament sync
- ✅ Google Calendar integration
- ✅ Event reminders
- ✅ Two-way sync with Google

**Event Types:**
- MATCH
- TOURNAMENT
- TRAINING
- PERSONAL

**Dependencies:**
- googleapis (Google Calendar API)

**Schema Fields:**
- userId, title, description, eventType
- startDateTime, endDateTime
- location, participants
- googleCalendarEventId (for sync)
- syncToken

**Notes:**
- OAuth required for Google sync
- Auto-creates calendar events for matches
- Two-way sync keeps data consistent

---

### 10. Invitation Module (`invitation`)

**Location:** `src/api/v1/modules/invitation/`  
**Purpose:** Invitation system for teams/matches/tournaments

**Key Components:**

| Component | Path | Purpose | Reusability |
|-----------|------|---------|-------------|
| InvitationService | `application/InvitationService.js` | Invitation logic | ✅ Core service |
| InvitationController | `infrastructure/http/InvitationController.js` | HTTP handlers | ❌ HTTP-specific |
| InvitationRepository | `infrastructure/persistence/InvitationRepository.js` | Invitation data | ✅ Via repository |
| InvitationModel | `infrastructure/persistence/InvitationModel.js` | Invitation schema | ⚠️ Schema reference |

**Features Implemented:**
- ✅ Send invitations
- ✅ Accept/decline invitations
- ✅ Invitation expiry
- ✅ Multi-type invitations

**Invitation Types:**
- TEAM (join team)
- MATCH (play match)
- TOURNAMENT (join tournament)

**Schema Fields:**
- senderId, recipientId
- type, entityId (team/match/tournament)
- status (pending/accepted/declined/expired)
- expiresAt

**Notes:**
- Triggers notifications on creation
- Auto-expires after set period
- Cascading actions (accept → add to team)

---

### 11. Feedback Module (`feedback`)

**Location:** `src/api/v1/modules/feedback/`  
**Purpose:** User feedback collection, admin review

**Key Components:**

| Component | Path | Purpose | Reusability |
|-----------|------|---------|-------------|
| FeedbackService | `application/FeedbackService.js` | Feedback logic | ✅ Core service |
| FeedbackController | `infrastructure/http/FeedbackController.js` | HTTP handlers | ❌ HTTP-specific |
| FeedbackRepository | `infrastructure/persistence/FeedbackRepository.js` | Feedback data | ✅ Via repository |
| FeedbackModel | `infrastructure/persistence/FeedbackModel.js` | Feedback schema | ⚠️ Schema reference |

**Features Implemented:**
- ✅ Submit feedback
- ✅ Admin review system
- ✅ Status tracking
- ✅ Response from admin

**Feedback Types:**
- BUG
- FEATURE_REQUEST
- COMPLAINT
- SUGGESTION
- OTHER

**Schema Fields:**
- userId, type, title, description
- status (pending/reviewed/resolved)
- adminResponse, reviewedBy
- priority

**Notes:**
- Only admins can view all feedback
- Users can only see their own feedback
- Admin can respond to feedback

---

### 12. Maps Module (`maps`)

**Location:** `src/api/v1/modules/maps/`  
**Purpose:** Location management, map markers

**Key Components:**

| Component | Path | Purpose | Reusability |
|-----------|------|---------|-------------|
| MapsService | `application/MapsService.js` | Maps logic | ✅ Core service |
| MapsController | `infrastructure/http/MapsController.js` | HTTP handlers | ❌ HTTP-specific |
| MapsRepository | `infrastructure/persistence/MapsRepository.js` | Maps data access | ✅ Via repository |
| MapsModel | `infrastructure/persistence/MapsModel.js` | Maps schema | ⚠️ Schema reference |

**Features Implemented:**
- ✅ Submit location markers
- ✅ Nearby location search
- ✅ Get location by entity

**Entity Types:**
- VENUE
- MATCH
- TOURNAMENT
- USER (optional)

**Schema Fields:**
- entityType, entityId
- name, location (GeoJSON)
- address, submittedBy

**Notes:**
- Links locations to other entities
- Used for map display
- Geo-indexed for performance

---

### 13. Admin Module (`admin`)

**Location:** `src/api/v1/modules/admin/`  
**Purpose:** Admin operations, reports

**Key Components:**

| Component | Path | Purpose | Reusability |
|-----------|------|---------|-------------|
| AdminController | `infrastructure/http/AdminController.js` | HTTP handlers | ❌ HTTP-specific |

**Features Implemented:**
- ⏳ Reports endpoint (TODO)
- ⏳ User management (planned)
- ⏳ System stats (planned)

**Notes:**
- Minimal implementation currently
- Placeholder for admin features
- RBAC already enforced

---

## 🔧 Core Infrastructure

### Container (`src/core/container/`)

**Purpose:** Dependency Injection container

**Files:**
- `container.js` - DI container implementation
- `index.js` - Export

**Features:**
- Service registration
- Dependency resolution
- Lifecycle management (singleton/transient)

**Usage:**
```javascript
container.register('userService', UserService, ['userRepository', 'logger']);
const userService = container.resolve('userService');
```

---

### Database (`src/core/database/`)

**Purpose:** MongoDB connection and base repository

**Files:**
- `connection.js` - MongoDB connection
- `healthCheck.js` - DB health monitoring
- `BaseRepository.js` - ✨ NEW - Base CRUD repository
- `index.js` - Exports

**Features:**
- Connection pooling
- Health checks
- BaseRepository with pagination, transactions
- Audit trails (createdBy, updatedBy)
- Schema versioning

---

### Events (`src/core/events/`)

**Purpose:** Event-driven communication

**Files:**
- `EventBusFactory.js` - Factory for creating event bus
- `IEventBus.js` - Interface definition
- `inMemoryBus.js` - ✨ ENHANCED - In-memory implementation with retry/DLQ
- `redisBus.js` - ✨ ENHANCED - Redis pub/sub with retry/DLQ

**Features:**
- ✅ Publish/subscribe pattern
- ✅ Event metadata (eventId, traceId, timestamp, source)
- ✅ Automatic retry (3 attempts, exponential backoff)
- ✅ Dead Letter Queue for failed events
- ✅ Event replay from DLQ
- ✅ Supports both InMemory and Redis adapters

**Enhancement Details:**
- Retry mechanism: 1s, 2s, 4s delays
- Event metadata for tracing
- DLQ storage (in-memory or Redis)
- Replay capability for debugging

---

### HTTP (`src/core/http/`)

**Purpose:** HTTP utilities, middleware, error handling

**Files:**
- `asyncHandler.js` - Async error wrapper
- `errorHandler.js` - ✨ ENHANCED - Central error handling with AppError
- `requireAuth.js` - Authentication middleware
- `requireRoles.js` - Authorization middleware
- `requestId.js` - Request correlation ID
- `sessionMiddleware.js` - Session setup
- `validate.js` - Input validation middleware
- `healthRoutes.js` - ✨ ENHANCED - Health + metrics endpoints
- `metricsMiddleware.js` - ✨ NEW - Prometheus metrics
- `errors/AppError.js` - ✨ NEW - Error classification system
- `errors/index.js` - ✨ NEW - Error class exports

**New Error Classes:**
- `AppError` - Base error with isOperational flag
- `ValidationError` - 400
- `UnauthorizedError` - 401
- `ForbiddenError` - 403
- `NotFoundError` - 404
- `ConflictError` - 409
- `InternalServerError` - 500
- `ServiceUnavailableError` - 503
- `BadRequestError` - 400
- `TooManyRequestsError` - 429
- `DatabaseError` - 500

---

### Logging (`src/core/logging/`)

**Purpose:** Structured logging

**Files:**
- `logger.js` - Winston logger setup
- `index.js` - Export

**Features:**
- JSON structured logs
- Multiple transports (console, file)
- Log levels (debug, info, warn, error)
- Context tracking

---

### Libs (`src/core/libs/`)

**Purpose:** Reusable libraries

**Files:**
- `redis.js` - Redis client setup
- `metrics.js` - ✨ NEW - Prometheus metrics collector
- `cache.js` - ✨ NEW - Cache abstraction layer

**Metrics Features:**
- HTTP request metrics (duration, count)
- EventBus metrics
- Database query metrics
- Process metrics (CPU, memory)
- Custom counter/histogram/gauge support

**Cache Features:**
- Get/set/delete with TTL
- Namespace isolation
- Pattern invalidation (SCAN-based)
- Cache statistics (hit rate)
- Cache-aside pattern (getOrSet)
- Counter operations

---

### Jobs (`src/core/jobs/`)

**Purpose:** ✨ NEW - Background job processing

**Files:**
- `QueueManager.js` - BullMQ queue manager
- `processors/notificationProcessor.js` - Example processors
- `index.js` - Exports

**Features:**
- Multiple queue support
- Retry with exponential backoff
- Scheduled jobs (delayed execution)
- Recurring jobs (cron patterns)
- Progress tracking
- Queue statistics
- Pause/resume functionality

---

## 📚 Shared Libraries

### Common (`src/common/`)

#### DTOs (`src/common/dto/`)

**Purpose:** ✨ NEW - Data Transfer Objects for secure API responses

**Files:**
- `BaseDTO.js` - Base DTO functionality
- `UserDTO.js` - User profile transforms
- `TeamDTO.js` - Team data transforms
- `MatchDTO.js` - Match data transforms
- `TournamentDTO.js` - Tournament data transforms
- `VenueDTO.js` - Venue data transforms
- `NotificationDTO.js` - Notification transforms
- `ChatDTO.js` - Chat message transforms
- `CalendarDTO.js` - Calendar event transforms
- `InvitationDTO.js` - Invitation transforms
- `FeedbackDTO.js` - Feedback transforms
- `UserStatDTO.js` - User stats transforms
- `AchievementDTO.js` - Achievement transforms
- `MapsDTO.js` - Location marker transforms
- `index.js` - Export all DTOs

**Features:**
- Automatic sensitive field exclusion
- Privacy-aware transforms
- Context-based transforms (owner, captain, admin)
- Multiple transform methods (full, minimal, custom)
- Performance-optimized for lists

**Security:**
- Passwords never exposed
- OAuth tokens excluded
- Internal MongoDB fields removed
- Privacy settings enforced

---

#### Validation (`src/common/validation/`)

**Purpose:** Input validation schemas

**Files:**
- `authValidation.js` - Auth input schemas
- `userValidation.js` - User input schemas
- `teamValidation.js` - Team input schemas
- `matchValidation.js` - Match input schemas
- `tournamentValidation.js` - Tournament schemas
- `calendarValidation.js` - Calendar schemas
- `notificationValidation.js` - Notification schemas
- `index.js` - Export all schemas

**Validation Library:** express-validator

**Features:**
- Field-level validation
- Custom validators
- Sanitization
- Error message formatting

---

#### Utils (`src/common/utils/`)

**Purpose:** Shared utility functions

**Files:**
- `mongooseTransform.js` - Mongoose transform helpers
- `validateEnv.js` - Environment validation
- `index.js` - Exports

---

#### Constants (`src/common/constants/`)

**Purpose:** Shared constants

**Files:**
- `index.js` - HTTP status codes, error messages

---

### Config (`src/config/` and `src/core/config/`)

**Purpose:** Application configuration

**Files:**
- `configLoader.js` - Config loading logic
- `validator.js` - ✨ NEW - Config validation at startup
- `env/development.js` - Dev config
- `env/production.js` - Prod config
- `env/test.js` - Test config
- `index.js` - Export

**Features:**
- Environment-based config
- Fail-fast validation
- Required keys enforcement

**Duplication Note:** ⚠️ Config exists in two places (src/config and src/core/config) - possible consolidation opportunity

---

## 🔗 Integration Points

### Module Dependencies

```
auth ← user (shared UserModel)
user → auth (UserModel reference)
match → team (team references)
match → venue (venue reference)
match → EventBus → user (stats update)
tournament → team (team registrations)
venue → maps (location data)
calendar → GoogleCalendarService (external)
notification → FCMService/APNSService (external)
invitation → notification (auto-notify)
chat → Socket.IO (optional, not yet implemented)
```

### External Service Integrations

| Service | Module | Purpose | Configuration |
|---------|--------|---------|---------------|
| Google OAuth | auth | User authentication | GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET |
| Facebook OAuth | auth | User authentication | FACEBOOK_APP_ID, FACEBOOK_APP_SECRET |
| Google Calendar API | calendar | Calendar sync | GOOGLE_CALENDAR_API_KEY |
| Firebase Cloud Messaging | notification | Push (Android) | FCM_SERVER_KEY |
| Apple Push Notification | notification | Push (iOS) | APNS_KEY, APNS_KEY_ID |
| MongoDB | all | Database | MONGODB_URI |
| Redis | cache, events, jobs | Cache, Pub/Sub, Jobs | REDIS_HOST, REDIS_PORT |
| Nodemailer | auth | Email | EMAIL_HOST, EMAIL_USER, EMAIL_PASS |

---

## 🔍 Redundancy Analysis

### Identified Duplications

1. **Config Directory Duplication** ⚠️
   - `src/config/` AND `src/core/config/`
   - **Recommendation:** Consolidate into `src/core/config/`
   - **Impact:** Low - both currently coexist

2. **Repository Pattern Consistency** ✅
   - All modules implement repositories
   - **Status:** Good - consistent pattern
   - **Enhancement:** All can extend new BaseRepository

3. **DTO Pattern** ✅
   - Newly added, no duplication
   - **Status:** Excellent - centralized in `src/common/dto/`

4. **Validation Schemas** ✅
   - Centralized in `src/common/validation/`
   - **Status:** Good - no duplication

5. **Error Handling** ✅
   - Previously scattered, now centralized with AppError
   - **Status:** Excellent - consistent error classes

6. **Middleware** ✅
   - Centralized in `src/core/http/`
   - **Status:** Good - reusable across modules

### Dead Code / Unused Files

1. **venue/examples.js** ⚠️
   - Contains example data
   - **Recommendation:** Move to docs or test fixtures

2. **Admin Module** ⚠️
   - Minimal implementation (TODO endpoint)
   - **Recommendation:** Expand or document as placeholder

---

## 🎯 Reusability Recommendations

### High Reusability Components

1. **BaseRepository** ✨
   - **Path:** `src/core/database/BaseRepository.js`
   - **Use:** Extend for all new repositories
   - **Features:** CRUD, pagination, transactions, audit trails

2. **BaseDTO** ✨
   - **Path:** `src/common/dto/BaseDTO.js`
   - **Use:** Extend for all new DTOs
   - **Features:** Clean, transform, transformMany helpers

3. **AppError Classes** ✨
   - **Path:** `src/core/http/errors/`
   - **Use:** Throw typed errors throughout app
   - **Benefits:** Consistent error handling, proper status codes

4. **CacheManager** ✨
   - **Path:** `src/core/libs/cache.js`
   - **Use:** Cache any data with namespace isolation
   - **Benefits:** Hit rate tracking, pattern invalidation

5. **QueueManager** ✨
   - **Path:** `src/core/jobs/QueueManager.js`
   - **Use:** Background job processing
   - **Benefits:** Retry, scheduling, monitoring

6. **EventBus** ✨
   - **Path:** `src/core/events/`
   - **Use:** Decouple modules via events
   - **Benefits:** Retry, DLQ, tracing

### Patterns to Follow

#### 1. Creating New Module

```
new-module/
├── domain/
│   ├── INewRepository.js      # Interface
│   └── NewEntity.js            # Domain entity
├── application/
│   └── NewService.js           # Business logic
├── infrastructure/
│   ├── http/
│   │   ├── NewController.js    # HTTP handlers
│   │   └── NewRoutes.js        # Route definitions
│   └── persistence/
│       ├── NewModel.js         # Mongoose schema
│       └── NewRepository.js    # Extends BaseRepository ✨
└── index.js                    # Module bootstrap
```

#### 2. Creating New DTO

```javascript
import BaseDTO from './BaseDTO.js';

class NewModelDTO extends BaseDTO {
  static transformOne(obj, options = {}) {
    const safe = {
      id: obj._id?.toString(),
      // Add public fields
      name: obj.name,
      // Conditional fields
      sensitiveField: options.isOwner ? obj.sensitiveField : undefined,
    };
    
    if (options.includeTimestamps) {
      safe.createdAt = obj.createdAt;
      safe.updatedAt = obj.updatedAt;
    }
    
    return this.clean(safe);
  }
  
  static transformMinimal(obj) {
    return {
      id: obj._id?.toString(),
      name: obj.name,
    };
  }
}

export default NewModelDTO;
```

#### 3. Using Repository

```javascript
import BaseRepository from '@/core/database/BaseRepository.js';

class NewRepository extends BaseRepository {
  constructor(model, logger) {
    super(model, logger);
  }
  
  // Add custom methods
  async findByCustomField(value) {
    return this.find({ customField: value });
  }
}
```

#### 4. Throwing Errors

```javascript
import { NotFoundError, ValidationError } from '@/core/http/errors/index.js';

// In service
if (!user) {
  throw new NotFoundError('User', { userId });
}

if (invalidInput) {
  throw new ValidationError('Invalid email format', { field: 'email' });
}
```

#### 5. Using Cache

```javascript
import { CacheManager } from '@/core/libs/cache.js';

const cache = new CacheManager(redis, logger, {
  namespace: 'user',
  defaultTTL: 3600,
});

// Cache-aside pattern
const user = await cache.getOrSet(
  userId,
  async () => await userRepository.findById(userId),
  3600
);

// Invalidate
await cache.invalidate(`user:${userId}`);
```

#### 6. Publishing Events

```javascript
// In service
await this.eventBus.publish('match.completed', {
  matchId: match._id,
  homeTeamId: match.homeTeam,
  awayTeamId: match.awayTeam,
  homeScore: match.homeScore,
  awayScore: match.awayScore,
}, {
  source: 'MatchService',
  traceId: req.requestId,
});
```

---

## 📊 Module Statistics

| Module | Files | LOC (est) | Complexity | Dependencies |
|--------|-------|-----------|------------|--------------|
| auth | 11 | 1,500 | High | passport, jwt, bcrypt, nodemailer |
| user | 11 | 1,200 | Medium | EventBus |
| team | 6 | 600 | Low | - |
| match | 6 | 700 | Medium | EventBus, team, venue |
| tournament | 7 | 900 | High | team, BracketGenerator |
| venue | 7 | 800 | Medium | MongoDB geospatial |
| notification | 8 | 900 | Medium | FCM, APNS |
| chat | 6 | 600 | Low | - |
| calendar | 7 | 700 | Medium | Google Calendar API |
| invitation | 6 | 500 | Low | notification |
| feedback | 6 | 400 | Low | - |
| maps | 6 | 400 | Low | MongoDB geospatial |
| admin | 3 | 100 | Low | - |
| **Core** | 25+ | 2,000+ | Medium | Various |
| **DTOs** | 15 | 1,500 | Low | - |
| **TOTAL** | **303** | **~13,000** | **Medium-High** | - |

---

## 🚀 Development Guidelines

### Before Creating New Code

1. **Search this index** for similar functionality
2. **Check if a base class exists** (BaseRepository, BaseDTO)
3. **Look for existing utilities** in `src/common/utils/`
4. **Review integration points** to understand dependencies
5. **Follow the established patterns** documented here

### Adding New Features

1. **Extend existing modules** when possible
2. **Reuse DTOs** for consistent data exposure
3. **Publish events** for cross-module communication
4. **Use BaseRepository** for data access
5. **Throw typed errors** (AppError classes)
6. **Add validation schemas** in `src/common/validation/`
7. **Document in this index** after implementation

### Refactoring Opportunities

1. **Consolidate config directories**
2. **Move example files to test fixtures**
3. **Expand admin module** with planned features
4. **Add Socket.IO** for real-time chat
5. **Consider microservice split** for high-traffic modules (chat, notifications)

---

## 📝 Summary

**Architecture:** Clean, modular monolith with strong separation of concerns  
**Patterns:** Repository, DTO, Event-Driven, Dependency Injection  
**Code Quality:** High consistency, low duplication  
**Reusability:** Excellent - many base classes and utilities  
**Maintainability:** Good - clear structure and documentation  

**Strengths:**
- ✅ Clear module boundaries
- ✅ Consistent layered architecture
- ✅ Comprehensive DTO system
- ✅ Strong infrastructure (cache, jobs, events)
- ✅ Good error handling
- ✅ Well-documented features

**Areas for Improvement:**
- ⚠️ Consolidate config directories
- ⚠️ Move example files
- ⚠️ Expand admin module
- ⚠️ Add real-time features (Socket.IO)

---

**This index should be updated whenever:**
- New modules are added
- Significant features are implemented
- Architectural changes are made
- Integration points change

**Maintain this as the single source of truth for codebase understanding.**
