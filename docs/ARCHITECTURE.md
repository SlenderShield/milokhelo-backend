# Milokhelo Backend Architecture

## Architecture Overview

This document describes the refactored architecture of the Milokhelo backend, moving from a domain-driven layered structure to a simplified, flattened modular monolith.

## Design Principles

1. **Modular Monolith**: Self-contained modules with clear boundaries
2. **Dependency Injection**: Loose coupling through DI container
3. **Event-Driven Communication**: Modules communicate via EventBus
4. **SOLID Principles**: Single responsibility, open/closed, etc.
5. **Separation of Concerns**: Clear separation between layers
6. **Module Ownership**: Each module owns its data models

## Directory Structure

### Current Architecture (Flattened)

```
src/
├── modules/                    # Business modules (NEW)
│   ├── user/
│   │   ├── controller/        # HTTP request handlers
│   │   ├── service/           # Business logic & use cases
│   │   ├── repository/        # Data access layer
│   │   ├── model/             # Mongoose schemas
│   │   ├── dto/               # Data transfer objects
│   │   ├── validation/        # Input validation schemas
│   │   ├── routes/            # Express route definitions
│   │   ├── cache/             # Caching layer (optional)
│   │   ├── tests/             # Module-specific tests
│   │   └── index.js           # Module exports & initialization
│   ├── tournament/
│   │   ├── service/
│   │   │   ├── tournament.service.js
│   │   │   └── bracketGenerator.service.js  # Domain service
│   │   └── ...
│   └── [other modules]/
│
├── core/                      # Framework & infrastructure
│   ├── container/             # Dependency injection
│   ├── events/                # Event bus (in-memory & Redis)
│   ├── logging/               # Winston logger
│   ├── database/              # MongoDB connection
│   ├── http/                  # HTTP utilities & middlewares
│   └── websocket/             # Socket.IO setup
│
├── common/                    # Shared utilities (TO BE MOVED)
│   ├── constants/             # → core/constants/
│   ├── utils/                 # → core/utils/
│   └── validation/            # → module-specific validation/
│
├── config/                    # Configuration (TO BE MOVED)
│   └── ...                    # → core/config/
│
├── api/v1/                    # API routing (OLD STRUCTURE)
│   ├── modules/               # Old module structure
│   └── routes.js              # Central router
│
├── app.js                     # Express app configuration
├── bootstrap.js               # Application initialization
└── server.js                  # HTTP server entry point
```

### Target Architecture (After Full Migration)

```
src/
├── modules/                   # All business modules
│   ├── [module-name]/
│   └── index.js              # Auto-loader for all modules
│
├── core/                     # Core infrastructure
│   ├── libs/                 # Core libraries
│   │   ├── container.js      # DI container
│   │   ├── eventBus.js       # Event bus factory
│   │   ├── logger.js         # Logger factory
│   │   └── db.js             # Database connection
│   ├── middlewares/          # Global middlewares
│   ├── config/               # Configuration loader
│   ├── utils/                # Shared utilities
│   ├── constants/            # App-wide constants
│   └── interfaces/           # Shared interfaces
│
├── loaders/                  # Startup loaders
│   ├── database.js
│   ├── events.js
│   ├── modules.js
│   └── index.js
│
├── jobs/                     # Background jobs (cron, workers)
│
├── app.js                    # Express app setup
├── server.js                 # HTTP server
└── main.js                   # Application entry point
```

## Module Structure

Each module follows a consistent structure:

### Layer Responsibilities

#### Controller Layer
- **Purpose**: Handle HTTP requests/responses
- **Responsibilities**:
  - Request validation (using validation schemas)
  - Call service methods
  - Format responses
  - Error handling
- **Dependencies**: Service, Logger
- **Exports**: Controller class, route creation function

#### Service Layer
- **Purpose**: Business logic and use cases
- **Responsibilities**:
  - Implement business rules
  - Coordinate between repositories
  - Publish domain events
  - Handle complex operations
- **Dependencies**: Repository, EventBus, Logger
- **Exports**: Service class, domain services

#### Repository Layer
- **Purpose**: Data access and persistence
- **Responsibilities**:
  - CRUD operations
  - Database queries
  - Data transformation
- **Dependencies**: Model, Logger
- **Exports**: Repository class

#### Model Layer
- **Purpose**: Data schema and validation
- **Responsibilities**:
  - Define Mongoose schemas
  - Model-level validation
  - Virtual properties
  - Instance methods
- **Dependencies**: Mongoose
- **Exports**: Mongoose model

#### DTO Layer
- **Purpose**: Data transfer between layers
- **Responsibilities**:
  - Define data structures
  - Type definitions
  - Entity classes (if needed)
- **Exports**: DTO classes/interfaces

#### Validation Layer
- **Purpose**: Input validation
- **Responsibilities**:
  - Define validation schemas (Joi, express-validator)
  - Request body validation
  - Query parameter validation
- **Exports**: Validation schemas

#### Routes Layer
- **Purpose**: Define API endpoints
- **Responsibilities**:
  - Map URLs to controller methods
  - Apply middleware (auth, validation)
  - Define HTTP methods
- **Exports**: Route creation function

#### Cache Layer (Optional)
- **Purpose**: Caching layer
- **Responsibilities**:
  - Redis integration
  - Cache key management
  - TTL management
- **Exports**: Cache class

### Module Initialization

Each module exports an `initializeModule()` function:

```javascript
export function initializeUserModule(container) {
  const logger = container.resolve('logger');
  const eventBus = container.resolve('eventBus');

  // Register dependencies
  container.registerSingleton('userRepository', () => {...});
  container.registerSingleton('userService', () => {...});
  container.registerSingleton('userController', () => {...});

  // Set up event subscriptions
  eventBus.subscribe('event.name', async (data) => {...});

  logger.info('User module initialized');
}
```

## Core Infrastructure

### Dependency Injection Container

```javascript
// Registration
container.registerSingleton('serviceName', (c) => {
  return new Service(c.resolve('dependency'), logger);
});

// Resolution
const service = container.resolve('serviceName');
```

### Event Bus

```javascript
// Publishing
await eventBus.publish('event.name', { data });

// Subscribing
eventBus.subscribe('event.name', async (data) => {
  // Handle event
});
```

### Logger

```javascript
// Child logger with context
const logger = parentLogger.child({ context: 'ServiceName' });

// Logging
logger.info('Message', { metadata });
logger.error('Error message', { error: error.message });
```

## Module Communication

### Synchronous (Direct)
- Through dependency injection
- One module resolves another's service from container
- Use sparingly to avoid tight coupling

### Asynchronous (Events)
- Primary communication method
- Loose coupling through EventBus
- Supports multiple subscribers

### Common Events

```javascript
// User events
'user.created'
'user.profile_updated'
'user.stats_updated'
'user.achievement_awarded'

// Match events
'match.created'
'match.started'
'match.finished'
'match.cancelled'

// Tournament events
'tournament.created'
'tournament.started'
'tournament.finished'

// System events
'system.startup'
'system.shutdown'
```

## Data Flow

### Request Lifecycle

```
1. HTTP Request
   ↓
2. Route Middleware (auth, validation)
   ↓
3. Controller (request handling)
   ↓
4. Service (business logic)
   ↓
5. Repository (data access)
   ↓
6. Model (database)
   ↓
7. Repository (data transformation)
   ↓
8. Service (event publishing)
   ↓
9. Controller (response formatting)
   ↓
10. HTTP Response
```

### Event Flow

```
Service A
   ↓
EventBus.publish('event')
   ↓
EventBus (in-memory or Redis)
   ↓
Multiple Subscribers (Service B, C, D)
   ↓
Async Handlers
```

## Migration Status

### ✅ Completed Modules
1. **User Module**
   - Services: UserService, StatsUpdateHandler, AchievementEvaluator
   - Event handlers: match.finished, user.stats_updated
   - Special features: Achievement system, stats auto-update

2. **Tournament Module**
   - Services: TournamentService, BracketGenerator
   - Special features: Tournament bracket generation (knockout, league)

### 🔄 In Progress
- Auth Module (OAuth, JWT, Passport)
- Match Module
- Team Module
- [Other modules...]

### ⏳ Pending
See `docs/REFACTORING_GUIDE.md` for complete list

## Testing Strategy

### Unit Tests
- Test individual components in isolation
- Mock dependencies
- Location: `src/modules/{module}/tests/`

### Integration Tests
- Test module interactions
- Real database (test environment)
- Location: `test/integration/`

### Test Structure
```javascript
describe('ModuleName', () => {
  let container, service, repository;

  beforeEach(() => {
    container = createContainer();
    // Setup
  });

  it('should perform operation', async () => {
    // Test
  });
});
```

## Configuration

### Environment Variables
- `NODE_ENV`: Environment (development, production, test)
- `PORT`: Server port
- `MONGODB_URI`: MongoDB connection string
- `REDIS_URL`: Redis connection (for event bus)
- `JWT_SECRET`: JWT signing secret
- `EVENT_BUS_ADAPTER`: 'memory' or 'redis'

### Config Access
```javascript
const config = container.resolve('config');
const port = config.get('app.port');
```

## Security Considerations

1. **Authentication**: JWT-based, session-based, OAuth
2. **Authorization**: Role-based access control (RBAC)
3. **Validation**: Input validation on all endpoints
4. **Rate Limiting**: Configured in middleware
5. **CORS**: Same-origin policy
6. **Helmet**: Security headers

## Performance Optimizations

1. **Database**
   - Indexed fields
   - Lean queries (`.lean()`)
   - Connection pooling

2. **Caching**
   - Redis for session storage
   - Optional module-level caching

3. **Events**
   - Async event handling
   - Redis Pub/Sub for scalability

## Future Enhancements

1. **Auto-loading**: Dynamic module discovery
2. **Hot reload**: Development mode module reload
3. **API versioning**: Support for v2, v3, etc.
4. **GraphQL**: Alternative to REST
5. **Microservices**: Potential future split

## References

- [Refactoring Guide](./REFACTORING_GUIDE.md)
- [API Documentation](../docs/api/openapi.yaml)
- [Testing Guide](./TESTING.md)

## Contributing

When adding new modules:
1. Follow the established structure
2. Use the migration script: `./scripts/migrate-module.sh {module-name}`
3. Update documentation
4. Write tests
5. Run linter and tests before committing
