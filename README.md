# Milokhelo Backend

A comprehensive sports platform backend built with Node.js, Express, MongoDB, and Redis. This is a clean modular monolith with Clean Architecture principles, featuring hybrid OAuth authentication, real-time chat with WebSocket, geo-spatial venue search, and event-driven inter-module communication.

## 🏗️ Architecture Overview

This project implements a **Modular Monolith** architecture that provides:

- **Clean separation of concerns** with distinct layers (Domain, Application, Infrastructure)
- **Event-driven communication** between modules via EventBus (in-memory or Redis)
- **Dependency Injection** for loose coupling and testability
- **Centralized configuration** with environment-specific settings
- **Structured logging** using Winston
- **Easy migration path** to microservices when needed

### Architecture Diagram

```
src/
├── core/                      # Core infrastructure services
│   ├── container/            # Dependency injection container
│   ├── database/             # Database connection management
│   ├── events/               # Event bus implementations
│   ├── http/                 # HTTP layer (middlewares, health checks)
│   │   ├── middlewares/     # Express middlewares
│   │   └── errors/          # Error handling
│   └── logging/              # Centralized logging
├── config/                   # Configuration management
│   └── environments/         # Environment-specific configs
├── api/                      # API layer
│   └── v1/                  # API version 1
│       ├── modules/         # Business modules (bounded contexts)
│       │   ├── auth/        # Authentication module
│       │   ├── user/        # User management module
│       │   └── ...          # Other modules (team, match, tournament, etc.)
│       └── routes.js        # API v1 router configuration
├── common/                   # Shared code across modules
│   ├── constants/           # Application constants
│   ├── utils/               # Utility functions
│   ├── types/               # Type definitions
│   └── interfaces/          # Shared interfaces
├── app.js                    # Express app configuration
├── bootstrap.js              # Application initialization
└── server.js                 # Server entry point
```

## 🚀 Features

- ✅ **14 Complete Modules**: Auth, Users, Teams, Matches, Tournaments, Chat, Venues, Maps, Calendar, Notifications, Invitations, Feedback, Admin
- ✅ **OAuth Authentication**: Full Google & Facebook OAuth 2.0 with Passport.js + Email/Password authentication
- ✅ **Session Management**: HTTP-only cookies with Redis store
- ✅ **Tournament Brackets**: Automatic bracket generation for knockout and league tournaments
- ✅ **Stats Auto-Update**: Event-driven automatic stats updates on match completion (ELO, streaks, performance metrics)
- ✅ **Achievement System**: Automatic achievement evaluation with 31 predefined achievements (milestones, skills, participation)
- ✅ **Booking Conflict Prevention**: Atomic venue bookings with MongoDB transactions and optimistic locking
- ✅ **Real-time Chat**: WebSocket support with Socket.IO
- ✅ **Geo-spatial Search**: Find nearby venues with 2dsphere indexes
- ✅ **70+ API Endpoints**: Complete REST API with Swagger documentation
- ✅ **Event-Driven**: Modules communicate via events (in-memory or Redis)
- ✅ **Dependency Injection**: Loose coupling with IoC container
- ✅ **Advanced Logging**: Structured logging with Winston, request correlation, performance tracking
- ✅ **Path Aliasing**: Clean imports with `@/core`, `@/modules`, `@/common` aliases
- ✅ **Clean Architecture**: Domain/Application/Infrastructure layers
- ✅ **Production Ready**: Docker support, health checks, security middleware

## 📋 Prerequisites

- Node.js >= 18.x
- MongoDB >= 5.x
- Redis >= 6.x
- Docker & Docker Compose (for local development)

## 🛠️ Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd milokhelo-backend
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

```bash
cp .env.example .env
# Edit .env with your configuration
```

Key environment variables:

```env
# Auth & Sessions
JWT_SECRET=your-jwt-secret-here
SESSION_SECRET=your-session-secret-here

# OAuth Configuration (Google & Facebook)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
OAUTH_CALLBACK_URL=http://localhost:4000/api/v1/auth/oauth/callback
FRONTEND_URL=http://localhost:3000
```

> **📖 For detailed OAuth setup instructions, see [`docs/features/OAUTH_SETUP.md`](docs/features/OAUTH_SETUP.md)**

4. **Start infrastructure services (MongoDB & Redis)**

```bash
docker-compose up -d
```

## 🏃 Running the Application

### Development Mode (with auto-reload)

```bash
# Using in-memory event bus
npm run dev

# Using Redis event bus
npm run dev:redis
```

The server will start at:
- **API**: <http://localhost:4000/api/v1>
- **API Documentation**: <http://localhost:4000/docs>
- **WebSocket**: `ws://localhost:4000`
- **Health Check**: <http://localhost:4000/health>

### Production Mode

```bash
npm start
```

### Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## 📡 API Overview

The Milokhelo backend provides 70+ API endpoints across 14 modules:

### 🔐 Authentication (`/api/v1/auth`)

- `GET /providers` - List available OAuth providers
- `GET /oauth/google` - Initiate Google OAuth flow
- `GET /oauth/facebook` - Initiate Facebook OAuth flow
- `GET /oauth/callback/google` - Google OAuth callback
- `GET /oauth/callback/facebook` - Facebook OAuth callback
- `GET /session` - Get current session
- `POST /logout` - Logout user
- `POST /register` - Register with email/password
- `POST /login` - Login with email/password

### 👤 Users (`/api/v1/users`)

- `GET /me` - Get current user profile
- `PATCH /me` - Update profile
- `GET /me/stats` - Get user statistics (auto-updated from matches)
- `GET /me/achievements` - List user's earned achievements
- `GET /:userId` - Get user by ID
- `GET /:userId/achievements` - Get user's achievements
- `GET /search` - Search users

### 👥 Teams (`/api/v1/teams`)

- `POST /` - Create team
- `GET /` - List teams
- `GET /:teamId` - Get team details
- `PATCH /:teamId` - Update team
- `DELETE /:teamId` - Delete team
- `POST /:teamId/join` - Join team
- `POST /:teamId/leave` - Leave team

### ⚽ Matches (`/api/v1/matches`)

- `POST /` - Create match
- `GET /` - List matches (with filters)
- `GET /nearby` - Find nearby matches
- `GET /:matchId` - Get match details
- `PATCH /:matchId` - Update match
- `POST /:matchId/join` - Join match
- `POST /:matchId/leave` - Leave match
- `POST /:matchId/start` - Start match
- `POST /:matchId/finish` - Finish match (auto-updates participant stats via events)

**Stats Auto-Update Features:**

- ✅ Automatic win/loss/draw tracking
- ✅ ELO rating system (±32 competitive, ±16 friendly)
- ✅ Winning/losing streak tracking
- ✅ Detailed performance metrics (goals, assists, fouls)
- ✅ Multi-sport support with separate stats

**Achievement System Features:**

- ✅ 31 predefined achievements (milestones, skills, participation)
- ✅ Automatic evaluation when stats update
- ✅ 5 criteria types (threshold, total, ratio, streak, composite)
- ✅ Multiple rarity levels (common, rare, epic, legendary)
- ✅ Points system for gamification
- ✅ Sport-specific and cross-sport achievements
- ✅ Event-driven architecture for reliability

### 🏆 Tournaments (`/api/v1/tournaments`)

- `POST /` - Create tournament
- `GET /` - List tournaments
- `GET /:tournamentId` - Get tournament details
- `PATCH /:tournamentId` - Update tournament
- `POST /:tournamentId/register` - Register team
- `POST /:tournamentId/start` - Start tournament and generate bracket
- `GET /:tournamentId/bracket` - Get tournament bracket
- `POST /:tournamentId/match-result` - Update match result

**Bracket Features:**
- ✅ Knockout (single-elimination) tournaments
- ✅ League (round-robin) tournaments  
- ✅ Automatic seeding and bye handling
- ✅ Real-time standings and progression
- ✅ Winner advancement and elimination tracking

> **📖 For detailed bracket documentation, see [`docs/features/BRACKET_GENERATION.md`](docs/features/BRACKET_GENERATION.md)**

### 💬 Chat (`/api/v1/chat`)

- `POST /rooms` - Create chat room
- `GET /rooms` - List rooms
- `GET /rooms/:roomId/messages` - Get messages
- `POST /rooms/:roomId/messages` - Send message
- Real-time events via WebSocket (join_room, send_message, typing)

### 🏟️ Venues (`/api/v1/venues`)

- `GET /` - List all venues
- `GET /search` - Search venues by name/sport
- `GET /nearby` - Find venues near coordinates (geo-spatial)
- `GET /:venueId` - Get venue details
- `POST /:venueId/bookings` - Create booking request
- `GET /me/bookings` - List user bookings
- `PATCH /bookings/:bookingId/cancel` - Cancel booking

### 🔧 Venue Management (`/api/v1/venue-management`)

- `POST /venues` - Register new venue (owner)
- `PATCH /venues/:venueId` - Update venue
- `DELETE /venues/:venueId` - Delete venue
- `GET /venues/:venueId/bookings` - List venue bookings
- `PATCH /bookings/:bookingId/approve` - Approve booking
- `PATCH /bookings/:bookingId/reject` - Reject booking

### 🗺️ Maps (`/api/v1/maps`)

- `GET /locations` - List map locations
- `POST /locations` - Submit new location
- `PATCH /locations/:locationId` - Update location

### 📅 Calendar (`/api/v1/calendar`)

- `GET /events` - List calendar events
- `POST /sync` - Sync with Google Calendar

### 🔔 Notifications (`/api/v1/notifications`)

- `GET /` - List notifications
- `POST /mark-read` - Mark as read
- `POST /device-tokens` - Register device for push
- `DELETE /device-tokens/:tokenId` - Unregister device

### 📨 Invitations (`/api/v1/invitations`)

- `POST /` - Send invitation
- `GET /` - List invitations
- `POST /:invitationId/respond` - Accept/decline

### 📝 Feedback (`/api/v1/feedback`)

- `POST /` - Submit feedback
- `GET /` - List feedback (admin)

### 🛡️ Admin (`/api/v1/admin`)

- `GET /users` - List all users
- `GET /reports` - List reports
- `POST /reports/:reportId/resolve` - Resolve report

For detailed API documentation with request/response schemas, visit `/docs` when running the server.

## 🔌 WebSocket Events

Connect to `ws://localhost:4000` for real-time features:

### Chat Events

**Client → Server:**

- `join_room` - Join a chat room
- `leave_room` - Leave a chat room
- `send_message` - Send a message
- `typing` - Indicate typing status

**Server → Client:**

- `new_message` - Receive new message
- `user_typing` - User typing notification
- `room_joined` - Room join confirmation
- `error` - Error notification

### Production Mode

```bash
NODE_ENV=production npm start
```

### Test Mode

```bash
npm run test
```

## 🔧 Configuration

Configuration is managed through environment variables. See `.env.example` for all available options.

### Environment Files

- `.env.development` - Development environment
- `.env.test` - Test environment
- `.env.production` - Production environment

### Key Configuration Options

| Variable            | Description                                 | Default                                   |
| ------------------- | ------------------------------------------- | ----------------------------------------- |
| `NODE_ENV`          | Environment (development, test, production) | `development`                             |
| `PORT`              | Server port                                 | `3000`                                    |
| `MONGODB_URI`       | MongoDB connection string                   | `mongodb://localhost:27017/milokhelo_dev` |
| `REDIS_HOST`        | Redis host                                  | `localhost`                               |
| `EVENT_BUS_ADAPTER` | Event bus adapter (memory, redis)           | `memory`                                  |
| `LOG_LEVEL`         | Logging level                               | `debug`                                   |

## 📦 Module Structure

Each module follows the same clean architecture pattern with **complete ownership** of its persistence layer:

```
modules/[module-name]/
├── domain/              # Business logic layer
│   ├── Entity.js       # Domain entities
│   └── IRepository.js  # Repository interface
├── application/         # Application logic layer
│   └── Service.js      # Business services
└── infrastructure/      # Technical implementation
    ├── persistence/    # Data access layer (module-owned)
    │   ├── Model.js    # Mongoose schemas and models
    │   └── Repository.js   # Repository implementation
    ├── http/           # HTTP layer
    │   ├── Controller.js   # HTTP controllers
    │   └── Routes.js       # Route definitions
    └── index.js        # Module exports and initialization
```

**Key Principle**: Each module owns its complete domain including all models - no shared persistence layer. This ensures true module independence and supports future microservices migration.

> **📖 For detailed architecture guidelines, see [`docs/architecture/ARCHITECTURE.md`](docs/architecture/ARCHITECTURE.md) and [`docs/guides/DEVELOPMENT_GUIDELINES.md`](docs/guides/DEVELOPMENT_GUIDELINES.md)**

## 📚 Documentation

All project documentation is organized in the `docs/` directory with logical subdirectories:

```
docs/
├── architecture/       # System design and architecture
├── guides/            # Development guides and references
├── features/          # Feature-specific documentation
└── api/              # API specifications
```

### 🏗️ Architecture & Design

- [`docs/architecture/ARCHITECTURE.md`](docs/architecture/ARCHITECTURE.md) - System architecture and design patterns
- [`docs/architecture/REFACTORING_HISTORY.md`](docs/architecture/REFACTORING_HISTORY.md) - Complete refactoring history
- [`docs/architecture/CODEBASE_ANALYSIS.md`](docs/architecture/CODEBASE_ANALYSIS.md) - Comprehensive codebase analysis (historical)

### 📚 Development Guides

- [`docs/guides/QUICKSTART.md`](docs/guides/QUICKSTART.md) - **Start here!** Quick start guide for new developers
- [`docs/guides/DEVELOPMENT_GUIDELINES.md`](docs/guides/DEVELOPMENT_GUIDELINES.md) - Complete development guidelines
- [`docs/guides/QUICK_REFERENCE.md`](docs/guides/QUICK_REFERENCE.md) - Quick reference for common patterns
- [`docs/guides/PATH_ALIASING.md`](docs/guides/PATH_ALIASING.md) - Path aliasing setup and usage
- [`docs/guides/IMPROVEMENTS.md`](docs/guides/IMPROVEMENTS.md) - Improvement tracking and technical debt

### ✨ Feature Documentation

**Tournaments & Matches:**

- [`docs/features/BRACKET_GENERATION.md`](docs/features/BRACKET_GENERATION.md) - Tournament bracket generation (knockout & league)
- [`docs/features/STATS_AUTO_UPDATE.md`](docs/features/STATS_AUTO_UPDATE.md) - Automatic stats updates on match completion
- [`docs/features/ACHIEVEMENTS.md`](docs/features/ACHIEVEMENTS.md) - Complete achievement system with auto-evaluation

**Venue Bookings:**

- [`docs/features/BOOKING_CONFLICT_PREVENTION.md`](docs/features/BOOKING_CONFLICT_PREVENTION.md) - Atomic booking with transactions & conflict prevention
- [`docs/features/BOOKING_QUICK_REFERENCE.md`](docs/features/BOOKING_QUICK_REFERENCE.md) - Quick reference for developers

**Authentication:**

- [`docs/features/OAUTH_SETUP.md`](docs/features/OAUTH_SETUP.md) - Complete OAuth setup guide (Google & Facebook)
- [`docs/features/OAUTH_IMPLEMENTATION.md`](docs/features/OAUTH_IMPLEMENTATION.md) - OAuth implementation architecture

### 🔌 API Documentation

- [`docs/api/openapi.yaml`](docs/api/openapi.yaml) - Complete OpenAPI 3.1 specification with 70+ endpoints

> **📖 Full documentation index:** See [`docs/README.md`](docs/README.md)

## 🔌 EventBus

The EventBus enables decoupled inter-module communication.

### In-Memory EventBus (Default)

Suitable for single-instance applications and development:

```javascript
// Set in .env
EVENT_BUS_ADAPTER = memory;
```

### Redis EventBus

Suitable for distributed applications and production:

```javascript
// Set in .env
EVENT_BUS_ADAPTER = redis;
```

### Publishing Events

```javascript
await eventBus.publish('user.created', { userId: '123', email: 'user@example.com' });
```

### Subscribing to Events

```javascript
eventBus.subscribe('user.created', async (data) => {
  console.log('User created:', data);
});
```

## 📝 Logging

The application features an advanced logging system built on Winston. See [docs/LOGGING.md](docs/LOGGING.md) for complete documentation.

### Quick Start

```javascript
import { getLogger } from './core/logging/index.js';

const logger = getLogger();

// Basic logging
logger.info('User logged in', { userId: '123' });
logger.error('Operation failed', { error: error.message });

// Child logger with context
const serviceLogger = logger.child({ service: 'PaymentService' });
serviceLogger.info('Processing payment', { amount: 99.99 });

// Performance tracking
const trackingId = logger.startTimer('database-query');
// ... perform operation ...
logger.endTimer(trackingId);

// Security logging
logger.security('failed-login-attempt', { email, ip, attempts: 3 });

// Audit logging
logger.audit('user-deleted', { performedBy: adminId, targetUser: userId });
```

### Request Logging

Each HTTP request automatically gets:
- Unique request ID for correlation
- Request-scoped logger (`req.logger`)
- Automatic performance metrics

```javascript
// In controllers
req.logger.info('Processing request', { userId: req.user.id });
```

### Features

- **Structured Logging**: JSON in production, pretty format in development
- **Request Correlation**: Track requests with unique IDs
- **Performance Tracking**: Built-in timers and metrics
- **Security & Audit**: Dedicated methods for security events and audit trails
- **Auto Redaction**: Sensitive data (passwords, tokens) automatically redacted
- **Log Rotation**: Automatic file rotation (5MB max, 5 files)

## 🎯 Adding New Modules

To add a new module to the Milokhelo sports platform:

1. **Create module structure:**

   ```bash
   mkdir -p src/api/v1/modules/your-module/{domain,application,infrastructure/{persistence,http}}
   ```

2. **Implement domain layer** (entities, interfaces)

3. **Implement application layer** (services, business logic)

4. **Implement infrastructure layer:**
   - Persistence: models, repositories
   - HTTP: controllers, routes

5. **Create module initializer** in `src/api/v1/modules/your-module/index.js`

6. **Register in API router** (`src/api/v1/routes.js`):

   ```javascript
   import { createYourModuleRoutes } from './modules/your-module/index.js';

   // In createV1Router function:
   router.use('/your-module', createYourModuleRoutes(container.resolve('yourModuleController')));
   ```

7. **Initialize module in bootstrap** (`src/bootstrap.js`):

   ```javascript
   const { initializeYourModule } = require('./api/v1/modules/your-module');
   initializeYourModule(container);
   ```

Refer to existing modules (auth, user, team, etc.) for reference implementations.

## 🧪 Code Quality

### Linting

```bash
# Check for issues
npm run lint

# Auto-fix issues
npm run lint:fix
```

### Formatting

```bash
# Check formatting
npm run format:check

# Auto-format code
npm run format
```

## 🐳 Docker

Start infrastructure services:

```bash
docker-compose up -d
```

Stop services:

```bash
docker-compose down
```

View logs:

```bash
docker-compose logs -f
```

## 📊 API Endpoints

### Health Check

```
GET /health
```

For detailed API documentation with all 70+ endpoints, visit `/docs` when running the server or check the OpenAPI specification at `docs/api/openapi.yaml`.

## 🔐 Security Best Practices

- Never commit `.env` files (use `.env.example` as template)
- Use environment variables for sensitive data
- Validate all input data
- Use HTTPS in production
- Implement rate limiting
- Keep dependencies updated

## 🚀 Migration to Microservices

This architecture is designed to facilitate future migration to microservices:

1. **Each module is already a bounded context** - can be extracted as-is
2. **Event-driven communication** - switch from in-memory to Redis EventBus
3. **Dependency injection** - makes it easy to swap implementations
4. **Clean interfaces** - modules communicate through well-defined contracts

To migrate a module:

1. Extract module to separate repository
2. Change EventBus to Redis adapter
3. Update service discovery and routing
4. Deploy independently

## 📝 License

ISC

## 🤝 Contributing

1. Follow the existing code structure
2. Write clean, documented code
3. Follow SOLID principles
4. Use the EventBus for inter-module communication
5. Run linting and formatting before committing
