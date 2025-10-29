# Architecture Documentation

## Overview

This document describes the architecture of the Milokhelo Backend, a modular monolith designed with clean architecture principles and prepared for future microservices migration.

## Core Principles

### SOLID Principles

1. **Single Responsibility Principle (SRP)**
   - Each class/module has one reason to change
   - Services focus on specific business domains
   - Repositories handle only data access

2. **Open/Closed Principle (OCP)**
   - System is open for extension, closed for modification
   - Use interfaces and dependency injection
   - Event-driven architecture allows adding handlers without modifying publishers

3. **Liskov Substitution Principle (LSP)**
   - Implementations can be swapped without breaking the system
   - EventBus adapters (InMemory/Redis) are interchangeable
   - Repository implementations can be swapped

4. **Interface Segregation Principle (ISP)**
   - Interfaces are specific to client needs
   - Repository interfaces define only required methods
   - EventBus interface is minimal and focused

5. **Dependency Inversion Principle (DIP)**
   - High-level modules don't depend on low-level modules
   - Both depend on abstractions (interfaces)
   - Dependencies are injected via DI container

### DRY (Don't Repeat Yourself)

- Shared utilities in `src/shared/utils`
- Common constants in `src/shared/constants`
- Reusable infrastructure components
- Configuration centralized in config loader

### KISS (Keep It Simple, Stupid)

- Clear folder structure
- Straightforward dependency injection
- Simple event bus implementation
- Minimal abstractions

## Architectural Layers

### 1. Infrastructure Layer

Located in `src/infrastructure/`, provides core technical capabilities:

#### Configuration (`config/`)

- Environment-based configuration loading
- Validation of required settings
- Type-safe configuration access

#### Database (`database/`)

- MongoDB connection management
- Connection lifecycle handling
- Health checks

#### EventBus (`eventBus/`)

- Event-driven communication backbone
- Multiple adapters (InMemory, Redis)
- Publisher-Subscriber pattern

#### Dependency Injection (`di/`)

- IoC container for managing dependencies
- Singleton and transient registrations
- Service location and resolution

#### Logging (`logger/`)

- Centralized logging with Winston
- Structured logging support
- Environment-specific formats
- Child loggers with context

### 2. Module Layer

Located in `src/modules/`, contains business modules:

Each module follows this structure:

#### Domain Layer

- **Entities**: Core business objects with behavior
- **Interfaces**: Contracts for repositories and services
- **Value Objects**: Immutable objects representing concepts
- **Domain Events**: Business events

#### Application Layer

- **Services**: Orchestrate business logic
- **Use Cases**: Specific business operations
- **DTOs**: Data transfer objects
- **Event Handlers**: React to domain events

#### Infrastructure Layer

- **Models**: Database schemas (Mongoose)
- **Repositories**: Data access implementations
- **Controllers**: HTTP request handlers
- **Routes**: API endpoint definitions

### 3. Shared Layer

Located in `src/shared/`, contains cross-cutting concerns:

- **Constants**: Application-wide constants
- **Utils**: Reusable utility functions
- **Types**: Shared type definitions

## Event-Driven Architecture

### EventBus Design

The EventBus enables decoupled communication between modules:

```javascript
// Publisher (doesn't know about subscribers)
await eventBus.publish('order.created', { orderId: '123' });

// Subscriber (doesn't know about publisher)
eventBus.subscribe('order.created', async (data) => {
  // Handle event
});
```

### Benefits

1. **Loose Coupling**: Modules don't directly depend on each other
2. **Scalability**: Easy to switch to distributed event bus (Redis)
3. **Extensibility**: New handlers can be added without modifying publishers
4. **Testability**: Modules can be tested independently
5. **Migration Ready**: Can be replaced with message queue (RabbitMQ, Kafka)

### Event Naming Convention

```
[module].[action]
```

Examples:

- `user.created`
- `order.completed`
- `payment.failed`
- `inventory.updated`

## Dependency Injection

### Container Design

The DI container manages service lifecycle:

```javascript
// Register service
container.registerSingleton('userService', (container) => {
  const repository = container.resolve('userRepository');
  const eventBus = container.resolve('eventBus');
  const logger = container.resolve('logger');
  return new UserService(repository, eventBus, logger);
});

// Resolve service
const userService = container.resolve('userService');
```

### Benefits

1. **Testability**: Easy to inject mocks/stubs
2. **Flexibility**: Swap implementations easily
3. **Lifecycle Management**: Control singleton vs transient
4. **Explicit Dependencies**: Clear dependency graph

## Configuration Management

### Multi-Environment Support

Configuration is loaded based on `NODE_ENV`:

1. Load base `.env` file
2. Load environment-specific `.env.[environment]` file
3. Override with existing environment variables
4. Validate required configuration

### Configuration Structure

```javascript
{
  env: 'development',
  app: { name, port, host, apiPrefix },
  mongodb: { uri, options },
  redis: { host, port, password, db },
  logging: { level, format, enabled },
  eventBus: { adapter },
  features: { enableMetrics, enableHealthCheck }
}
```

## Data Flow

### Request Flow (HTTP)

```
HTTP Request
  ↓
Routes
  ↓
Controller (Infrastructure)
  ↓
Service (Application)
  ↓
Repository (Infrastructure)
  ↓
Database
```

### Event Flow

```
Module A (Publisher)
  ↓
EventBus.publish()
  ↓
Event Queue/Channel
  ↓
EventBus (notifies subscribers)
  ↓
Module B (Subscriber)
```

## Module Communication

### Direct Communication (Avoid)

❌ **Don't do this:**

```javascript
// Direct dependency between modules
const userService = require('../user/application/UserService');
```

### Event-Driven Communication (Preferred)

✅ **Do this:**

```javascript
// Module A publishes event
await eventBus.publish('user.created', { userId });

// Module B subscribes to event
eventBus.subscribe('user.created', async ({ userId }) => {
  // Handle in Module B
});
```

### Query Communication (When Needed)

✅ **For queries, use shared interfaces:**

```javascript
// Define shared interface
// src/shared/interfaces/IUserQuery.js

// Register in DI container
container.registerSingleton('userQuery', () => userService);

// Use in other modules
const userQuery = container.resolve('userQuery');
```

## Error Handling

### Layers of Error Handling

1. **Domain Layer**: Throw domain-specific errors
2. **Application Layer**: Catch, log, and re-throw or transform
3. **Infrastructure Layer**: Catch, log, and return HTTP error
4. **Express Middleware**: Global error handler

### Error Response Format

```javascript
{
  success: false,
  error: {
    code: 'ERROR_CODE',
    message: 'Error message',
    stack: 'Stack trace (dev only)'
  }
}
```

## Logging Strategy

### Structured Logging

All logs include:

- Timestamp
- Log level
- Message
- Context (module, service, etc.)
- Metadata (IDs, data, etc.)

### Log Levels

- `error`: Errors that need attention
- `warn`: Warnings that should be investigated
- `info`: Important business events
- `debug`: Detailed information for debugging
- `verbose`: Very detailed information

### Child Loggers

Each service creates a child logger with context:

```javascript
this.logger = logger.child({ context: 'UserService' });
```

## Migration to Microservices

### Preparation (Current State)

- ✅ Modular structure (bounded contexts)
- ✅ Event-driven communication
- ✅ Dependency injection
- ✅ Clean interfaces
- ✅ Configuration management

### Migration Steps (Future)

1. **Choose module to extract**
2. **Set up separate repository**
3. **Copy module code**
4. **Change EventBus to Redis**
5. **Set up API Gateway**
6. **Update service discovery**
7. **Deploy independently**
8. **Monitor and test**

### During Migration

- Keep shared code in packages
- Use API Gateway for routing
- Use Redis EventBus for events
- Implement circuit breakers
- Add service discovery
- Implement distributed tracing

## Performance Considerations

### Database

- Use indexes appropriately
- Implement connection pooling
- Consider read replicas
- Use projections for queries

### EventBus

- In-memory: Fast, single instance
- Redis: Distributed, slightly slower
- Consider message persistence
- Implement retry logic

### Caching

- Use Redis for shared cache
- Cache at service level
- Implement cache invalidation
- Consider TTL strategies

## Security Considerations

### Configuration

- Never commit secrets
- Use environment variables
- Rotate credentials regularly
- Use secrets management (Vault, AWS Secrets Manager)

### API

- Validate all input
- Sanitize output
- Implement rate limiting
- Use HTTPS in production
- Implement authentication/authorization

### Database

- Use least privilege principle
- Implement query timeout
- Sanitize inputs (Mongoose does this)
- Regular backups

## Testing Strategy

### Unit Tests

- Test domain entities
- Test services with mocked dependencies
- Test utilities

### Integration Tests

- Test repositories with test database
- Test event handlers
- Test API endpoints

### End-to-End Tests

- Test complete user flows
- Test inter-module communication
- Test error scenarios

## Monitoring and Observability

### Health Checks

- Database connectivity
- Redis connectivity
- Application health

### Metrics (Future)

- Request rate
- Error rate
- Response time
- Event processing time

### Logging

- Structured logs for analysis
- Error tracking
- Audit logs

## Best Practices

### Code Organization

- One file per class
- Clear naming conventions
- Group by feature/module
- Keep files small and focused

### Naming Conventions

- Classes: PascalCase
- Functions: camelCase
- Constants: UPPER_SNAKE_CASE
- Files: PascalCase for classes, camelCase for utilities

### Comments

- Document why, not what
- Use JSDoc for public APIs
- Keep comments up to date
- Comment complex logic

### Git Workflow

- Feature branches
- Descriptive commit messages
- Pull requests for review
- Keep commits atomic

## Conclusion

This architecture provides a solid foundation for building scalable, maintainable applications. The modular structure and event-driven communication make it easy to grow the application and migrate to microservices when needed.
