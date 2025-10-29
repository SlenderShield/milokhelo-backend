# 📘 Development Guidelines & Best Practices

> **Comprehensive guide for developing features in the milokhelo-backend**
>
> Last Updated: October 29, 2025

---

## 🎯 Core Principles

### 1. **Module Independence**
- Each module should be self-contained and independent
- Modules communicate via **events**, not direct imports
- Use the **DI Container** for shared dependencies

### 2. **Clean Architecture Layers**
```
┌─────────────────────────────────────────────┐
│           Infrastructure Layer               │
│  (HTTP, Database, External Services)        │
├─────────────────────────────────────────────┤
│          Application Layer                   │
│  (Use Cases, Business Orchestration)        │
├─────────────────────────────────────────────┤
│            Domain Layer                      │
│  (Entities, Business Rules, Interfaces)     │
└─────────────────────────────────────────────┘
```

### 3. **Dependency Rule**
- Dependencies point **inward**
- Domain has NO dependencies
- Application depends on Domain
- Infrastructure depends on both

---

## 📁 Module Structure

### Standard Module Template
```
module-name/
├── domain/                      # Pure business logic
│   ├── entities/
│   │   └── ModuleName.js       # Domain entity
│   ├── interfaces/
│   │   └── IModuleNameRepository.js
│   ├── value-objects/          # Optional: Value objects
│   └── index.js
├── application/                 # Use cases and orchestration
│   ├── ModuleNameService.js    # Main service
│   ├── OtherHandler.js         # Event handlers, etc.
│   └── index.js
├── infrastructure/              # External concerns
│   ├── http/
│   │   ├── ModuleNameController.js
│   │   ├── ModuleNameRoutes.js
│   │   └── index.js
│   ├── persistence/
│   │   ├── ModuleNameModel.js
│   │   ├── ModuleNameRepository.js
│   │   └── index.js
│   └── index.js
└── index.js                     # Module entry point
```

---

## 🔧 Implementation Guide

### Step 1: Check Existing Code

**BEFORE** creating any new code:

1. **Search for similar functionality**
   ```bash
   # Search for similar services
   grep -r "class.*Service" src/
   
   # Search for similar utilities
   grep -r "function.*validate" src/
   ```

2. **Check common utilities**
   - `/src/common/utils/` - Helper functions
   - `/src/common/constants/` - Shared constants
   - `/src/core/http/` - HTTP utilities
   - `/src/core/events/` - Event bus

3. **Review existing modules**
   - Look at similar modules for patterns
   - Reuse existing services when possible

### Step 2: Create Domain Layer

**Domain entities** represent business concepts:

```javascript
// domain/entities/Product.js
/**
 * Product Entity
 * Represents a product in the system
 */
export default class Product {
  constructor({ id, name, price, stock }) {
    this.id = id;
    this.name = name;
    this.price = price;
    this.stock = stock;
  }

  /**
   * Business rule: Check if product is available
   */
  isAvailable() {
    return this.stock > 0;
  }

  /**
   * Business rule: Calculate discounted price
   */
  calculateDiscount(percentage) {
    return this.price * (1 - percentage / 100);
  }
}
```

**Repository interfaces** define contracts:

```javascript
// domain/interfaces/IProductRepository.js
/**
 * Product Repository Interface
 * Defines the contract for product data access
 */
export default class IProductRepository {
  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findAll() {
    throw new Error('Method not implemented');
  }

  async create(data) {
    throw new Error('Method not implemented');
  }

  async update(id, data) {
    throw new Error('Method not implemented');
  }

  async delete(id) {
    throw new Error('Method not implemented');
  }
}
```

### Step 3: Create Application Layer

**Services** orchestrate business logic:

```javascript
// application/ProductService.js
/**
 * Product Service
 * Handles product-related business operations
 */
export default class ProductService {
  constructor(productRepository, eventBus, logger) {
    this.repository = productRepository;
    this.eventBus = eventBus;
    this.logger = logger.child({ context: 'ProductService' });
  }

  /**
   * Create a new product
   */
  async createProduct(data) {
    this.logger.info('Creating product', { name: data.name });

    // Validate business rules
    if (data.price < 0) {
      throw new Error('Price cannot be negative');
    }

    // Create product
    const product = await this.repository.create(data);

    // Publish event
    await this.eventBus.publish('product.created', {
      productId: product.id,
      name: product.name,
    });

    return product;
  }

  /**
   * Get product by ID
   */
  async getProduct(id) {
    const product = await this.repository.findById(id);
    if (!product) {
      throw new Error('Product not found');
    }
    return product;
  }
}
```

### Step 4: Create Infrastructure Layer

**Models** define database schema:

```javascript
// infrastructure/persistence/ProductModel.js
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    category: String,
  },
  { timestamps: true }
);

const ProductModel = mongoose.model('Product', productSchema);
export default ProductModel;
```

**Repositories** implement data access:

```javascript
// infrastructure/persistence/ProductRepository.js
import IProductRepository from '../../domain/interfaces/IProductRepository.js';
import ProductModel from './ProductModel.js';

export default class ProductRepository extends IProductRepository {
  constructor(logger) {
    super();
    this.logger = logger.child({ context: 'ProductRepository' });
    this.model = ProductModel;
  }

  async findById(id) {
    return await this.model.findById(id).lean();
  }

  async findAll() {
    return await this.model.find().lean();
  }

  async create(data) {
    const product = new this.model(data);
    await product.save();
    return product.toObject();
  }

  async update(id, data) {
    return await this.model
      .findByIdAndUpdate(id, data, { new: true })
      .lean();
  }

  async delete(id) {
    await this.model.findByIdAndDelete(id);
  }
}
```

**Controllers** handle HTTP requests:

```javascript
// infrastructure/http/ProductController.js
import { asyncHandler, HTTP_STATUS } from '../../../../../core/http/index.js';

export default class ProductController {
  constructor(productService, logger) {
    this.service = productService;
    this.logger = logger.child({ context: 'ProductController' });
  }

  /**
   * POST /products - Create product
   */
  create() {
    return asyncHandler(async (req, res) => {
      const product = await this.service.createProduct(req.body);
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: product,
      });
    });
  }

  /**
   * GET /products/:id - Get product by ID
   */
  getById() {
    return asyncHandler(async (req, res) => {
      const { id } = req.params;
      const product = await this.service.getProduct(id);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: product,
      });
    });
  }
}
```

**Routes** define API endpoints:

```javascript
// infrastructure/http/ProductRoutes.js
import express from 'express';

export function createProductRoutes(controller) {
  const router = express.Router();

  router.post('/', controller.create());
  router.get('/:id', controller.getById());
  router.get('/', controller.getAll());
  router.put('/:id', controller.update());
  router.delete('/:id', controller.delete());

  return router;
}
```

### Step 5: Register Module in DI Container

**Module index.js** - Entry point:

```javascript
// index.js
import ProductRepository from './infrastructure/persistence/ProductRepository.js';
import ProductService from './application/ProductService.js';
import ProductController from './infrastructure/http/ProductController.js';
import { createProductRoutes } from './infrastructure/http/ProductRoutes.js';

/**
 * Initialize Product Module
 */
export function initializeProductModule(container) {
  const logger = container.resolve('logger');
  const eventBus = container.resolve('eventBus');

  // Register repository
  container.registerSingleton('productRepository', () => {
    return new ProductRepository(logger);
  });

  // Register service
  container.registerSingleton('productService', () => {
    const repository = container.resolve('productRepository');
    return new ProductService(repository, eventBus, logger);
  });

  // Register controller
  container.registerSingleton('productController', () => {
    const service = container.resolve('productService');
    return new ProductController(service, logger);
  });

  logger.info('Product module initialized');
}

export { ProductService, ProductController, createProductRoutes };
```

### Step 6: Add Routes

**Update `/src/api/v1/routes.js`:**

```javascript
import { createProductRoutes } from './modules/product/index.js';

export function createV1Router(container) {
  const router = express.Router();
  
  // ... existing routes ...
  
  // Product routes
  const productController = container.resolve('productController');
  router.use('/products', createProductRoutes(productController));
  
  return router;
}
```

**Update `/src/bootstrap.js`:**

```javascript
import { initializeProductModule } from './api/v1/modules/product/index.js';

async function bootstrap() {
  // ... existing code ...
  
  // Initialize modules
  initializeProductModule(container);
  
  // ... rest of code ...
}
```

---

## 🎨 Naming Conventions

### File Names

| Type | Convention | Example |
|------|------------|---------|
| Classes | PascalCase.js | `ProductService.js` |
| Interfaces | IPascalCase.js | `IProductRepository.js` |
| Models | PascalCaseModel.js | `ProductModel.js` |
| Routes | PascalCaseRoutes.js | `ProductRoutes.js` |
| Utilities | camelCase.js | `formatDate.js` |
| Constants | UPPER_SNAKE_CASE | `HTTP_STATUS` |

### Variables & Functions

```javascript
// ✅ GOOD
const userName = 'John';
const MAX_RETRIES = 3;

function calculateTotal(items) { }
async function fetchUserData(userId) { }

class UserService { }
class IUserRepository { }

// ❌ BAD
const user_name = 'John';        // Use camelCase
const maxretries = 3;            // Use UPPER_SNAKE_CASE for constants
function CalculateTotal() { }     // Functions use camelCase
class userService { }            // Classes use PascalCase
```

### Import/Export Patterns

```javascript
// ✅ GOOD: Default export in file, named export in index

// UserService.js
export default class UserService { }

// index.js
import UserService from './application/UserService.js';
export { UserService };

// Usage
import { UserService } from './modules/user/index.js';

// ❌ BAD: Don't rename during export
import UserServiceClass from './application/UserService.js';
export const UserService = UserServiceClass;
```

---

## 🔄 Event-Driven Communication

### Publishing Events

```javascript
// In service
async function createMatch(data) {
  const match = await this.repository.create(data);
  
  // Publish event
  await this.eventBus.publish('match.created', {
    matchId: match.id,
    teamIds: match.teams,
    timestamp: new Date(),
  });
  
  return match;
}
```

### Subscribing to Events

```javascript
// In module initialization
export function initializeStatsModule(container) {
  const eventBus = container.resolve('eventBus');
  const statsService = container.resolve('statsService');
  
  // Subscribe to match.finished event
  eventBus.subscribe('match.finished', async (data) => {
    await statsService.updatePlayerStats(data);
  });
}
```

### Event Naming Convention

Format: `module.action`

Examples:
- `user.created`
- `match.finished`
- `tournament.started`
- `booking.confirmed`
- `achievement.unlocked`

---

## 🛡️ Error Handling

### Service Layer

**Always throw errors** - let the controller handle them:

```javascript
// ✅ GOOD
async function getUser(id) {
  const user = await this.repository.findById(id);
  if (!user) {
    throw new Error('User not found');
  }
  return user;
}

// ❌ BAD - Don't handle HTTP responses in service
async function getUser(id) {
  const user = await this.repository.findById(id);
  if (!user) {
    return { error: 'User not found', status: 404 };
  }
  return user;
}
```

### Controller Layer

**Use asyncHandler** - it automatically catches errors:

```javascript
getUser() {
  return asyncHandler(async (req, res) => {
    const user = await this.service.getUser(req.params.id);
    res.status(HTTP_STATUS.OK).json({ data: user });
  });
}
```

### Custom Errors

Create custom error classes for better error handling:

```javascript
// core/http/errors/CustomErrors.js
export class NotFoundError extends Error {
  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

export class ValidationError extends Error {
  constructor(message = 'Validation failed') {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

// Usage in service
if (!user) {
  throw new NotFoundError('User not found');
}
```

---

## ✅ Testing Guidelines

### Unit Tests

Test **business logic** in isolation:

```javascript
// test/unit/productService.test.js
import { expect } from 'chai';
import sinon from 'sinon';
import ProductService from '../../src/api/v1/modules/product/application/ProductService.js';

describe('ProductService', () => {
  let service;
  let mockRepository;
  let mockEventBus;
  let mockLogger;

  beforeEach(() => {
    mockRepository = {
      create: sinon.stub(),
      findById: sinon.stub(),
    };
    mockEventBus = {
      publish: sinon.stub().resolves(),
    };
    mockLogger = {
      child: sinon.stub().returnsThis(),
      info: sinon.stub(),
      error: sinon.stub(),
    };

    service = new ProductService(mockRepository, mockEventBus, mockLogger);
  });

  describe('createProduct', () => {
    it('should create product and publish event', async () => {
      const productData = { name: 'Test', price: 100 };
      const createdProduct = { id: '1', ...productData };
      
      mockRepository.create.resolves(createdProduct);

      const result = await service.createProduct(productData);

      expect(result).to.deep.equal(createdProduct);
      expect(mockEventBus.publish).to.have.been.calledWith('product.created');
    });

    it('should throw error if price is negative', async () => {
      const productData = { name: 'Test', price: -10 };

      await expect(service.createProduct(productData)).to.be.rejectedWith('Price cannot be negative');
    });
  });
});
```

### Integration Tests

Test **full module flow**:

```javascript
// test/integration/product.test.js
import { expect } from 'chai';
import request from 'supertest';
import { bootstrap } from '../../src/bootstrap.js';

describe('Product API Integration', () => {
  let app;
  let server;

  before(async () => {
    const components = await bootstrap();
    app = await createApp(components.config, components.logger, components.container);
  });

  after(async () => {
    // Cleanup
  });

  describe('POST /api/v1/products', () => {
    it('should create a new product', async () => {
      const response = await request(app)
        .post('/api/v1/products')
        .send({ name: 'Test Product', price: 99.99 })
        .expect(201);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('id');
    });
  });
});
```

---

## 📊 Code Quality Standards

### JSDoc Documentation

**All public methods** must have JSDoc comments:

```javascript
/**
 * Create a new user
 * 
 * @param {Object} userData - User data
 * @param {string} userData.name - User's full name
 * @param {string} userData.email - User's email address
 * @param {string} userData.password - User's password (will be hashed)
 * @returns {Promise<Object>} Created user object
 * @throws {ValidationError} If user data is invalid
 * @throws {ConflictError} If email already exists
 * 
 * @example
 * const user = await userService.createUser({
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   password: 'SecurePass123'
 * });
 */
async createUser(userData) {
  // Implementation
}
```

### Logging

Use structured logging:

```javascript
// ✅ GOOD
this.logger.info('User created', { 
  userId: user.id,
  email: user.email 
});

this.logger.error('Failed to create user', { 
  error: error.message,
  stack: error.stack,
  email: userData.email 
});

// ❌ BAD
console.log('User created:', user.id);
console.error(error);
```

### Validation

Validate at the **entry point** (controller):

```javascript
create() {
  return asyncHandler(async (req, res) => {
    // Validate request
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      throw new ValidationError('Missing required fields');
    }
    
    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }
    
    const user = await this.service.createUser(req.body);
    res.status(HTTP_STATUS.CREATED).json({ data: user });
  });
}
```

---

## 🚀 Common Patterns

### Pagination

```javascript
async function getAll(page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  
  const [items, total] = await Promise.all([
    this.model.find().skip(skip).limit(limit).lean(),
    this.model.countDocuments(),
  ]);
  
  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
```

### Filtering & Sorting

```javascript
async function search(filters, sort = '-createdAt') {
  const query = {};
  
  if (filters.name) {
    query.name = new RegExp(filters.name, 'i');
  }
  
  if (filters.minPrice) {
    query.price = { $gte: filters.minPrice };
  }
  
  return await this.model.find(query).sort(sort).lean();
}
```

### Transactions

```javascript
async function transferFunds(fromId, toId, amount) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    await this.accountModel.updateOne(
      { _id: fromId },
      { $inc: { balance: -amount } },
      { session }
    );
    
    await this.accountModel.updateOne(
      { _id: toId },
      { $inc: { balance: amount } },
      { session }
    );
    
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
```

---

## ⚡ Performance Tips

1. **Use lean()** for read-only queries
2. **Index frequently queried fields**
3. **Use projection** to limit returned fields
4. **Batch operations** when possible
5. **Cache frequently accessed data**

```javascript
// ✅ GOOD - Fast read
const users = await UserModel.find().select('name email').lean();

// ❌ BAD - Slow, returns full Mongoose documents
const users = await UserModel.find();
```

---

## 🔐 Security Best Practices

1. **Never log sensitive data** (passwords, tokens)
2. **Validate all inputs**
3. **Use parameterized queries** (MongoDB protects by default)
4. **Implement rate limiting**
5. **Use HTTPS in production**

---

## ✅ Pre-Commit Checklist

Before committing code:

- [ ] Code follows naming conventions
- [ ] All imports are standardized
- [ ] JSDoc comments added to public methods
- [ ] Unit tests written and passing
- [ ] No console.log statements
- [ ] Errors are properly handled
- [ ] Code is formatted (run `npm run format`)
- [ ] Linter passes (run `npm run lint`)
- [ ] No sensitive data in code

---

## 📚 Quick Reference

### Import Cheatsheet

```javascript
// HTTP utilities
import { asyncHandler, HTTP_STATUS } from '../../../../../core/http/index.js';

// Common utilities
import { isEmpty, retry } from '../../../../../common/utils/index.js';

// Constants
import { ERROR_CODES } from '../../../../../common/constants/index.js';

// Events
import { EVENTS } from '../../../../../common/constants/index.js';
```

### Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run dev:redis        # Start with Redis event bus

# Testing
npm test                 # Run all tests
npm run test:unit        # Run unit tests only
npm run test:integration # Run integration tests
npm run test:coverage    # Generate coverage report

# Code Quality
npm run lint             # Check for linting errors
npm run lint:fix         # Fix linting errors
npm run format           # Format code with Prettier
```

---

**Version**: 1.0  
**Last Updated**: October 29, 2025  
**Maintained by**: milokhelo-backend team
