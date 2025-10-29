# 🚀 Quick Reference Guide - milokhelo-backend

> **Fast lookup for common patterns and commands**

---

## 📦 Project Structure

```
src/
├── api/v1/modules/          # All application modules
│   ├── auth/                # Authentication & OAuth
│   ├── user/                # User management & profiles
│   ├── team/                # Team functionality
│   ├── match/               # Match management
│   ├── tournament/          # Tournament system
│   ├── venue/               # Venue & booking
│   ├── chat/                # Chat & messaging
│   └── ...                  # Other modules
├── common/                  # Shared utilities
│   ├── constants/           # Application constants
│   ├── utils/               # Helper functions
│   └── types/               # TypeScript types
├── config/                  # Configuration
├── core/                    # Core infrastructure
│   ├── container/           # DI Container
│   ├── database/            # MongoDB connection
│   ├── events/              # Event bus
│   ├── http/                # HTTP utilities
│   └── logging/             # Winston logger
└── server.js                # Entry point
```

---

## 🎯 Common Imports

```javascript
// HTTP Utilities (Controllers)
import { asyncHandler, HTTP_STATUS } from '../../../../../core/http/index.js';

// Helper Functions
import { isEmpty, retry, pick, omit } from '../../../../../common/utils/index.js';

// Constants
import { ERROR_CODES } from '../../../../../common/constants/index.js';

// Container (in module index.js)
const logger = container.resolve('logger');
const eventBus = container.resolve('eventBus');
const config = container.resolve('config');
```

---

## 📝 Module Template (Copy & Paste)

### Directory Structure
```bash
mkdir -p my-module/domain/entities
mkdir -p my-module/domain/interfaces
mkdir -p my-module/application
mkdir -p my-module/infrastructure/http
mkdir -p my-module/infrastructure/persistence
```

### Domain Entity
```javascript
// domain/entities/MyEntity.js
export default class MyEntity {
  constructor({ id, name }) {
    this.id = id;
    this.name = name;
  }
  
  // Business logic methods here
}
```

### Repository Interface
```javascript
// domain/interfaces/IMyRepository.js
export default class IMyRepository {
  async findById(id) {
    throw new Error('Not implemented');
  }
  async create(data) {
    throw new Error('Not implemented');
  }
}
```

### Service
```javascript
// application/MyService.js
export default class MyService {
  constructor(repository, eventBus, logger) {
    this.repository = repository;
    this.eventBus = eventBus;
    this.logger = logger.child({ context: 'MyService' });
  }
  
  async create(data) {
    const item = await this.repository.create(data);
    await this.eventBus.publish('my.created', { id: item.id });
    return item;
  }
}
```

### Model
```javascript
// infrastructure/persistence/MyModel.js
import mongoose from 'mongoose';

const mySchema = new mongoose.Schema({
  name: { type: String, required: true },
  // ... other fields
}, { timestamps: true });

export default mongoose.model('MyModel', mySchema);
```

### Repository
```javascript
// infrastructure/persistence/MyRepository.js
import IMyRepository from '../../domain/interfaces/IMyRepository.js';
import MyModel from './MyModel.js';

export default class MyRepository extends IMyRepository {
  constructor(logger) {
    super();
    this.logger = logger.child({ context: 'MyRepository' });
    this.model = MyModel;
  }
  
  async findById(id) {
    return await this.model.findById(id).lean();
  }
  
  async create(data) {
    const doc = new this.model(data);
    await doc.save();
    return doc.toObject();
  }
}
```

### Controller
```javascript
// infrastructure/http/MyController.js
import { asyncHandler, HTTP_STATUS } from '../../../../../../core/http/index.js';

export default class MyController {
  constructor(service, logger) {
    this.service = service;
    this.logger = logger.child({ context: 'MyController' });
  }
  
  create() {
    return asyncHandler(async (req, res) => {
      const item = await this.service.create(req.body);
      res.status(HTTP_STATUS.CREATED).json({ data: item });
    });
  }
  
  getById() {
    return asyncHandler(async (req, res) => {
      const item = await this.service.getById(req.params.id);
      res.status(HTTP_STATUS.OK).json({ data: item });
    });
  }
}
```

### Routes
```javascript
// infrastructure/http/MyRoutes.js
import express from 'express';

export function createMyRoutes(controller) {
  const router = express.Router();
  
  router.post('/', controller.create());
  router.get('/:id', controller.getById());
  
  return router;
}
```

### Module Entry Point
```javascript
// index.js
import MyRepository from './infrastructure/persistence/MyRepository.js';
import MyService from './application/MyService.js';
import MyController from './infrastructure/http/MyController.js';
import { createMyRoutes } from './infrastructure/http/MyRoutes.js';

export function initializeMyModule(container) {
  const logger = container.resolve('logger');
  const eventBus = container.resolve('eventBus');
  
  container.registerSingleton('myRepository', () => {
    return new MyRepository(logger);
  });
  
  container.registerSingleton('myService', () => {
    const repository = container.resolve('myRepository');
    return new MyService(repository, eventBus, logger);
  });
  
  container.registerSingleton('myController', () => {
    const service = container.resolve('myService');
    return new MyController(service, logger);
  });
  
  logger.info('My module initialized');
}

export { MyService, MyController, createMyRoutes };
```

---

## 🎨 Common Patterns

### Pagination
```javascript
async getAll(page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    this.model.find().skip(skip).limit(limit).lean(),
    this.model.countDocuments(),
  ]);
  return {
    items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
```

### Search with Filters
```javascript
async search(filters) {
  const query = {};
  if (filters.name) query.name = new RegExp(filters.name, 'i');
  if (filters.minPrice) query.price = { $gte: filters.minPrice };
  return await this.model.find(query).lean();
}
```

### Publishing Events
```javascript
await this.eventBus.publish('user.created', {
  userId: user.id,
  email: user.email,
  timestamp: new Date(),
});
```

### Subscribing to Events
```javascript
// In module initialization
eventBus.subscribe('match.finished', async (data) => {
  await statsService.updateStats(data);
});
```

### Error Handling
```javascript
// In service - throw errors
if (!user) {
  throw new Error('User not found');
}

// In controller - asyncHandler catches them
getUser() {
  return asyncHandler(async (req, res) => {
    const user = await this.service.getUser(req.params.id);
    res.status(HTTP_STATUS.OK).json({ data: user });
  });
}
```

---

## 🧪 Testing Templates

### Unit Test
```javascript
import { expect } from 'chai';
import sinon from 'sinon';
import MyService from '../../src/api/v1/modules/my-module/application/MyService.js';

describe('MyService', () => {
  let service, mockRepo, mockEventBus, mockLogger;
  
  beforeEach(() => {
    mockRepo = {
      create: sinon.stub(),
      findById: sinon.stub(),
    };
    mockEventBus = {
      publish: sinon.stub().resolves(),
    };
    mockLogger = {
      child: sinon.stub().returnsThis(),
      info: sinon.stub(),
    };
    service = new MyService(mockRepo, mockEventBus, mockLogger);
  });
  
  describe('create', () => {
    it('should create item and publish event', async () => {
      const data = { name: 'Test' };
      mockRepo.create.resolves({ id: '1', ...data });
      
      const result = await service.create(data);
      
      expect(result).to.have.property('id');
      expect(mockEventBus.publish).to.have.been.calledOnce;
    });
  });
});
```

### Integration Test
```javascript
import { expect } from 'chai';
import request from 'supertest';
import { bootstrap } from '../../src/bootstrap.js';
import createApp from '../../src/app.js';

describe('My Module API', () => {
  let app, components;
  
  before(async () => {
    components = await bootstrap();
    app = await createApp(components.config, components.logger, components.container);
  });
  
  after(async () => {
    await components.dbConnection.disconnect();
  });
  
  describe('POST /api/v1/my-module', () => {
    it('should create item', async () => {
      const response = await request(app)
        .post('/api/v1/my-module')
        .send({ name: 'Test' })
        .expect(201);
      
      expect(response.body.data).to.have.property('id');
    });
  });
});
```

---

## 💻 Common Commands

```bash
# Development
npm run dev                    # Start dev server
npm run dev:redis              # Start with Redis event bus

# Testing
npm test                       # Run all tests
npm run test:unit              # Unit tests only
npm run test:integration       # Integration tests only
npm run test:coverage          # With coverage report

# Code Quality
npm run lint                   # Check linting
npm run lint:fix               # Fix linting issues
npm run format                 # Format with Prettier

# Docker
docker-compose up              # Start all services
docker-compose down            # Stop all services
docker-compose logs -f api     # View API logs
```

---

## 🔍 Debugging Tips

### Log Levels
```javascript
logger.debug('Detailed info', { data });
logger.info('General info', { userId });
logger.warn('Warning', { issue });
logger.error('Error occurred', { error: err.message, stack: err.stack });
```

### Environment Variables
```bash
# .env
NODE_ENV=development
LOG_LEVEL=debug
MONGODB_URI=mongodb://localhost:27017/milokhelo
REDIS_URL=redis://localhost:6379
```

### Inspect Container
```javascript
// List all registered services
const services = container.getRegisteredServices();
console.log(services);

// Resolve and inspect a service
const userService = container.resolve('userService');
console.log(userService);
```

---

## 🎯 HTTP Status Codes

```javascript
HTTP_STATUS.OK                     // 200
HTTP_STATUS.CREATED                // 201
HTTP_STATUS.NO_CONTENT             // 204
HTTP_STATUS.BAD_REQUEST            // 400
HTTP_STATUS.UNAUTHORIZED           // 401
HTTP_STATUS.FORBIDDEN              // 403
HTTP_STATUS.NOT_FOUND              // 404
HTTP_STATUS.CONFLICT               // 409
HTTP_STATUS.UNPROCESSABLE_ENTITY   // 422
HTTP_STATUS.INTERNAL_SERVER_ERROR  // 500
HTTP_STATUS.SERVICE_UNAVAILABLE    // 503
```

---

## 📚 Documentation Links

| Document | Purpose |
|----------|---------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture overview |
| [DEVELOPMENT_GUIDELINES.md](./DEVELOPMENT_GUIDELINES.md) | Complete development guide |
| [CODEBASE_REFACTORING_PLAN.md](./CODEBASE_REFACTORING_PLAN.md) | Refactoring details |
| [QUICKSTART.md](./QUICKSTART.md) | Getting started guide |
| [REFACTORING_SUMMARY.md](./REFACTORING_SUMMARY.md) | What was changed |

---

## 🎓 Best Practices Checklist

Before committing:

- [ ] Code follows module structure
- [ ] Uses standardized imports (`core/http` for asyncHandler)
- [ ] JSDoc comments on public methods
- [ ] Unit tests written
- [ ] No `console.log` statements
- [ ] Errors properly handled
- [ ] Events used for cross-module communication
- [ ] Code formatted (`npm run format`)
- [ ] Linter passes (`npm run lint`)

---

## 🚨 Common Mistakes to Avoid

❌ **DON'T:**
```javascript
// Don't import from other modules
import { UserService } from '../user/index.js';

// Don't use console.log
console.log('Debug info');

// Don't handle HTTP in service
return { error: 'Not found', status: 404 };

// Don't use old import path
import { asyncHandler } from '../common/utils/index.js';
```

✅ **DO:**
```javascript
// Use events for cross-module communication
await this.eventBus.publish('user.created', { userId });

// Use logger
this.logger.info('Debug info', { userId });

// Throw errors in service
throw new Error('Not found');

// Use correct import path
import { asyncHandler, HTTP_STATUS } from '../core/http/index.js';
```

---

**Last Updated**: October 29, 2025  
**Version**: 1.0
