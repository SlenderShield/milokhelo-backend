# Upgrade Roadmap Implementation Guide

This document provides a comprehensive guide to the infrastructure upgrades implemented in the Milokhelo backend.

## Table of Contents

1. [Phase 1: Observability & Stability](#phase-1-observability--stability)
2. [Phase 2: Infrastructure Enhancement](#phase-2-infrastructure-enhancement)
3. [Phase 3: Caching Layer](#phase-3-caching-layer)
4. [Phase 4: Repository Pattern](#phase-4-repository-pattern)
5. [Phase 6: Job Queue System](#phase-6-job-queue-system)

---

## Phase 1: Observability & Stability

### AppError Classification

Centralized error handling with operational/programming error classification.

**Usage:**

```javascript
import { AppError, ValidationError, NotFoundError } from '@/core/http/errors/index.js';

// Throw operational error
throw new ValidationError('Invalid email format', { field: 'email' });

// Throw custom error
throw new AppError('Custom error', {
  errorCode: 'CUSTOM_ERROR',
  statusCode: 400,
  isOperational: true,
  context: { details: 'Additional context' }
});
```

**Available Error Classes:**
- `AppError` - Base error class
- `ValidationError` - 400 Bad Request
- `AuthenticationError` - 401 Unauthorized
- `AuthorizationError` - 403 Forbidden
- `NotFoundError` - 404 Not Found
- `ConflictError` - 409 Conflict
- `RateLimitError` - 429 Too Many Requests
- `ServiceUnavailableError` - 503 Service Unavailable
- `DatabaseError` - 500 Internal Server Error
- `ExternalServiceError` - 502 Bad Gateway

### Prometheus Metrics

Application metrics for monitoring and alerting.

**Endpoints:**
- `GET /health/metrics` - Prometheus metrics (text format)
- `GET /health` - Health check with memory usage

**Available Metrics:**
- HTTP request duration histogram
- HTTP request counter by status code
- Active HTTP connections
- EventBus events counter
- Database query duration
- Process metrics (CPU, memory)

**Usage in Code:**

```javascript
const metricsCollector = container.resolve('metricsCollector');

// Record custom metric
metricsCollector.recordEvent('user.created', 'success');
metricsCollector.recordDbQuery('findOne', 'users', 0.05);
```

### Configuration Validation

Validates required environment variables at startup (fail-fast approach).

**Validated Configuration:**
- App configuration (NODE_ENV, PORT)
- Database URI format
- Redis connection
- Auth secrets (JWT_SECRET, SESSION_SECRET)
- OAuth configuration
- Notification services

**Behavior:**
- Throws error on missing required variables
- Logs warnings for recommended but optional variables
- Validates format (e.g., MongoDB URI must start with mongodb://)

---

## Phase 2: Infrastructure Enhancement

### EventBus with Retry & DLQ

Enhanced event bus with automatic retry and Dead Letter Queue.

**Features:**
- 3 automatic retries with exponential backoff (1s, 2s, 4s)
- Event metadata (eventId, traceId, timestamp, source)
- Dead Letter Queue for failed events
- Event replay capability
- Works with both InMemory and Redis adapters

**Usage:**

```javascript
// Publish event with metadata
await eventBus.publish('user.created', 
  { userId: '123', email: 'user@example.com' },
  { source: 'UserService', traceId: req.requestId }
);

// Subscribe to events (handler receives data and metadata)
eventBus.subscribe('user.created', async (data, metadata) => {
  console.log('Event:', metadata.eventId, metadata.traceId);
  // Process event...
});

// Get DLQ entries
const failedEvents = await eventBus.getDeadLetterQueue();

// Replay failed event
await eventBus.replayFromDLQ(eventId);

// Clear DLQ
await eventBus.clearDeadLetterQueue();
```

---

## Phase 3: Caching Layer

### Cache Abstraction

Unified caching API with Redis backend and namespace isolation.

**Features:**
- Get/set/delete operations with TTL
- Pattern-based cache invalidation
- Namespace support for module-level caching
- Cache statistics and hit rate tracking
- Cache-aside pattern (getOrSet)
- Counter operations (increment/decrement)

**Usage:**

```javascript
import CacheManager from '@/core/libs/cache.js';

// Initialize cache manager
const cache = new CacheManager(redisClient, logger, {
  namespace: 'user',
  defaultTTL: 3600 // 1 hour
});

// Basic operations
await cache.set('profile:123', userData, 7200); // 2 hours TTL
const user = await cache.get('profile:123');
await cache.delete('profile:123');

// Cache-aside pattern
const user = await cache.getOrSet('profile:123', async () => {
  return await userRepository.findById('123');
}, 3600);

// Pattern-based invalidation
await cache.invalidate('profile:*');

// Statistics
const stats = cache.getStats();
console.log(stats.hitRate); // "85.50%"

// Counter operations
await cache.increment('views:123');
await cache.decrement('stock:456', 5);

// Clear entire namespace
await cache.clear();
```

**Integration Example:**

```javascript
// In module initialization
const userCache = new CacheManager(redisClient, logger, {
  namespace: 'user',
  defaultTTL: 3600
});
container.registerInstance('userCache', userCache);
```

---

## Phase 4: Repository Pattern

### BaseRepository

Standard repository pattern with CRUD operations, pagination, and transactions.

**Features:**
- Standard CRUD operations
- Pagination with metadata
- Transaction support
- Audit trail (createdBy, updatedBy)
- Schema versioning
- Population and selection support

**Usage:**

```javascript
import { BaseRepository } from '@/core/database/index.js';

// Create repository
class UserRepository extends BaseRepository {
  constructor(userModel, logger) {
    super(userModel, logger);
    this.schemaVersion = 1;
  }

  // Add custom methods
  async findByEmail(email) {
    return this.findOne({ email });
  }
}

// Use repository
const userRepo = new UserRepository(UserModel, logger);

// CRUD operations
const user = await userRepo.create(userData, { createdBy: adminId });
const foundUser = await userRepo.findById(userId);
const users = await userRepo.find({ role: 'user' }, {
  populate: 'profile',
  select: 'name email',
  sort: '-createdAt',
  limit: 10
});

// Pagination
const result = await userRepo.findPaginated(
  { role: 'user' },
  { page: 1, limit: 20, sort: '-createdAt' }
);
console.log(result.pagination);
// {
//   page: 1,
//   limit: 20,
//   total: 100,
//   pages: 5,
//   hasNext: true,
//   hasPrev: false
// }

// Transactions
await userRepo.withTransaction(async (session) => {
  const user = await userRepo.create(userData, { session });
  await anotherRepo.create(relatedData, { session });
  return user;
});

// Update with audit trail
await userRepo.updateById(userId, updateData, { updatedBy: adminId });

// Check existence
const exists = await userRepo.exists({ email: 'test@example.com' });

// Count documents
const count = await userRepo.count({ role: 'admin' });
```

---

## Phase 6: Job Queue System

### BullMQ Queue Manager

Job queue system for background tasks with retry and monitoring.

**Features:**
- Multiple named queues
- Retry with exponential backoff
- Job priorities
- Scheduled and recurring jobs
- Job progress tracking
- Queue statistics
- Failed job handling

**Setup:**

```javascript
import { QueueManager } from '@/core/jobs/index.js';

// Initialize queue manager
const queueManager = new QueueManager(redisConfig, logger);
container.registerInstance('queueManager', queueManager);

// Create worker
queueManager.createWorker('notifications', async (job) => {
  const { notificationId, userId } = job.data;
  
  await job.updateProgress(25);
  // Send notification...
  await job.updateProgress(100);
  
  return { success: true };
}, { concurrency: 5 });

// Listen to queue events (optional)
queueManager.listenToQueueEvents('notifications');
```

**Usage:**

```javascript
const queueManager = container.resolve('queueManager');

// Add single job
await queueManager.addJob('notifications', 'send-notification', {
  notificationId: '123',
  userId: '456',
  type: 'push'
});

// Add bulk jobs
await queueManager.addBulkJobs('notifications', [
  { name: 'send-notification', data: { notificationId: '1', userId: '10' } },
  { name: 'send-notification', data: { notificationId: '2', userId: '20' } }
]);

// Schedule job (delayed)
await queueManager.scheduleJob('emails', 'send-email', emailData, 5000); // 5s delay

// Schedule recurring job (cron)
await queueManager.scheduleRecurringJob('stats', 'aggregate-stats', {}, '0 0 * * *'); // Daily

// Get job status
const job = await queueManager.getJob('notifications', jobId);
console.log(job.progress, job.returnvalue);

// Get queue statistics
const stats = await queueManager.getQueueStats('notifications');
console.log(stats);
// {
//   queueName: 'notifications',
//   waiting: 10,
//   active: 2,
//   completed: 100,
//   failed: 5,
//   delayed: 3,
//   total: 15
// }

// Get all queues stats
const allStats = await queueManager.getAllQueueStats();

// Queue management
await queueManager.pauseQueue('notifications');
await queueManager.resumeQueue('notifications');
await queueManager.cleanQueue('notifications', 0, 1000, 'completed');

// Cleanup on shutdown
await queueManager.close();
```

**Sample Job Processors:**

```javascript
// src/core/jobs/processors/notificationProcessor.js
export async function processNotificationDispatch(job) {
  const { notificationId, userId, type } = job.data;
  
  await job.updateProgress(10);
  
  // Send notification via service
  const result = await notificationService.send(notificationId, userId, type);
  
  await job.updateProgress(100);
  
  return { success: true, sentAt: new Date() };
}

// Register worker
queueManager.createWorker('notifications', processNotificationDispatch, {
  concurrency: 5
});
```

---

## Best Practices

### Error Handling

```javascript
// Use AppError for expected errors
if (!user) {
  throw new NotFoundError('User', { userId });
}

// Let unexpected errors propagate
// They will be caught by error handler middleware
```

### Caching Strategy

```javascript
// Cache-aside pattern for read-heavy data
const getUserProfile = async (userId) => {
  return cache.getOrSet(`profile:${userId}`, async () => {
    return await userRepository.findById(userId);
  }, 3600);
};

// Invalidate on write
const updateUserProfile = async (userId, data) => {
  const updated = await userRepository.updateById(userId, data);
  await cache.delete(`profile:${userId}`);
  return updated;
};

// Pattern invalidation for related data
await cache.invalidate(`user:${userId}:*`);
```

### Repository Pattern

```javascript
// Always use repository, never direct model access
// ❌ Bad
const user = await UserModel.findById(id);

// ✅ Good
const user = await userRepository.findById(id);

// Use transactions for multi-document operations
await userRepository.withTransaction(async (session) => {
  const user = await userRepository.create(userData, { session });
  await profileRepository.create({ userId: user._id, ...profileData }, { session });
});
```

### Event Bus

```javascript
// Always include source metadata
await eventBus.publish('user.created', userData, {
  source: 'UserService',
  traceId: req.requestId
});

// Event handlers should be idempotent
eventBus.subscribe('user.created', async (data, metadata) => {
  // Check if already processed
  const processed = await cache.get(`event:${metadata.eventId}`);
  if (processed) return;
  
  // Process event...
  
  // Mark as processed
  await cache.set(`event:${metadata.eventId}`, true, 3600);
});
```

### Job Queue

```javascript
// Use appropriate queue for job type
// Fast jobs: high concurrency
queueManager.createWorker('fast-tasks', processor, { concurrency: 10 });

// Slow jobs: low concurrency
queueManager.createWorker('slow-tasks', processor, { concurrency: 2 });

// Set appropriate retry strategy
await queueManager.addJob('api-calls', 'external-api', data, {
  attempts: 5,
  backoff: { type: 'exponential', delay: 2000 }
});

// Use priorities for important jobs
await queueManager.addJob('notifications', 'urgent-alert', data, {
  priority: 1 // Higher number = higher priority
});
```

---

## Migration Guide

### Adopting BaseRepository

```javascript
// Before
class UserRepository {
  constructor(model) {
    this.model = model;
  }
  
  async findById(id) {
    return this.model.findById(id);
  }
}

// After
import { BaseRepository } from '@/core/database/index.js';

class UserRepository extends BaseRepository {
  constructor(model, logger) {
    super(model, logger);
  }
  
  // BaseRepository provides findById, create, update, delete, etc.
  // Add only custom methods
  async findByEmail(email) {
    return this.findOne({ email });
  }
}
```

### Using Cache Layer

```javascript
// Before
const getCachedUser = async (id) => {
  const cached = await redisClient.get(`user:${id}`);
  if (cached) return JSON.parse(cached);
  
  const user = await UserModel.findById(id);
  await redisClient.setEx(`user:${id}`, 3600, JSON.stringify(user));
  return user;
};

// After
const cache = new CacheManager(redisClient, logger, { namespace: 'user' });
const getCachedUser = async (id) => {
  return cache.getOrSet(id, () => UserModel.findById(id), 3600);
};
```

---

## Monitoring & Observability

### Prometheus Metrics

Add to your monitoring system (Grafana, etc.):

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'milokhelo-backend'
    static_configs:
      - targets: ['localhost:4000']
    metrics_path: '/health/metrics'
    scrape_interval: 15s
```

### Key Metrics to Monitor

- `http_request_duration_seconds` - Response time percentiles
- `http_requests_total` - Request rate and error rate
- `eventbus_events_total` - Event publishing rate
- `db_query_duration_seconds` - Database performance
- `process_cpu_seconds_total` - CPU usage
- `process_resident_memory_bytes` - Memory usage

### Logging

All components use structured logging:

```javascript
logger.info('User created', {
  userId: user.id,
  email: user.email,
  source: 'UserService'
});
```

Logs include request correlation via `req.logger`:

```javascript
req.logger.info('Processing user update', { userId });
```

---

## Troubleshooting

### EventBus DLQ Issues

```javascript
// Check failed events
const dlq = await eventBus.getDeadLetterQueue();
console.log('Failed events:', dlq.length);

// Inspect specific event
const failedEvent = dlq.find(e => e.metadata.eventId === eventId);
console.log('Error:', failedEvent.error);

// Fix issue and replay
await eventBus.replayFromDLQ(eventId);
```

### Cache Issues

```javascript
// Check cache stats
const stats = cache.getStats();
if (parseFloat(stats.hitRate) < 50) {
  console.warn('Low cache hit rate:', stats);
}

// Clear problematic cache
await cache.invalidate('problematic:*');
```

### Job Queue Issues

```javascript
// Check queue health
const stats = await queueManager.getQueueStats('notifications');
if (stats.failed > stats.succeeded * 0.1) {
  console.error('High failure rate:', stats);
}

// Clean failed jobs
await queueManager.cleanQueue('notifications', 0, 100, 'failed');

// Pause queue for maintenance
await queueManager.pauseQueue('notifications');
// ... fix issues ...
await queueManager.resumeQueue('notifications');
```

---

## Performance Considerations

### Cache TTL Guidelines

- User profiles: 1 hour
- Session data: Session lifetime
- Lookup data (sports, countries): 24 hours
- Computed stats: 5 minutes
- Temporary flags: 60 seconds

### Repository Queries

- Always use `select` to limit fields
- Use `populate` sparingly (N+1 queries)
- Add indexes for frequently queried fields
- Use `lean()` for read-only operations

### Job Queue

- Keep job data small (< 1KB)
- Store large data in DB, pass ID in job
- Set appropriate concurrency based on resources
- Use job priorities for critical tasks
- Clean old completed jobs regularly

---

## Future Enhancements

The following features from the roadmap are marked for future implementation:

**Phase 2:**
- Auto-loading modules with reflection
- Module manifest files
- Enforce module load order based on dependencies

**Phase 3:**
- Session rotation on login
- User activity timestamps in Redis

**Phase 4:**
- Migration scripts structure
- Split read/write responsibilities

**Phase 5:**
- Enhanced RBAC with MongoDB storage
- Input sanitization middleware
- Per-IP and per-user rate limiting
- API versioning

**Phase 7:**
- Husky pre-commit hooks
- Module-level lint rules
- Enhanced test infrastructure
- GitHub Actions CI
- Auto-generate OpenAPI specs

**Phase 8:**
- Microservices migration guide
- Configuration service
- API Gateway patterns

---

## Support & Contribution

For questions or contributions:

1. Check existing documentation in `docs/`
2. Review code examples in respective modules
3. Follow established patterns and conventions
4. Add tests for new features
5. Update documentation

## Changelog

### v1.1.0 - Infrastructure Upgrade

**Added:**
- AppError classification system
- Prometheus metrics integration
- Configuration validation at startup
- EventBus retry mechanism with DLQ
- Event metadata (traceId, eventId, timestamp)
- Cache abstraction layer with Redis
- BaseRepository pattern
- BullMQ job queue system
- Notification job processors

**Enhanced:**
- Error handler middleware
- Health check endpoint
- EventBus (InMemory & Redis)
- Bootstrap process

**Dependencies:**
- Added: `prom-client`, `bullmq`
