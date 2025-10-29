# Milokhelo Backend

A clean modular monolith backend application built with Node.js, Express, MongoDB, and Redis. This architecture follows SOLID, DRY, and KISS principles, featuring event-driven inter-module communication designed for future microservices migration.

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
├── infrastructure/          # Core infrastructure services
│   ├── config/             # Configuration loader
│   ├── database/           # Database connection management
│   ├── eventBus/           # Event bus implementations
│   ├── di/                 # Dependency injection container
│   └── logger/             # Centralized logging
├── modules/                # Business modules (bounded contexts)
│   └── example/
│       ├── domain/         # Business entities & interfaces
│       ├── application/    # Business logic & services
│       └── infrastructure/ # Data access, routes, controllers
├── shared/                 # Shared utilities and constants
│   ├── constants/
│   ├── types/
│   └── utils/
├── app.js                  # Express app configuration
├── bootstrap.js            # Application initialization
└── server.js               # Server entry point
```

## 🚀 Features

- ✅ **Modular Architecture**: Each module is self-contained with clear boundaries
- ✅ **Event-Driven Communication**: Modules communicate via events (in-memory or Redis)
- ✅ **Dependency Injection**: Loose coupling with IoC container
- ✅ **Environment-Based Configuration**: Separate configs for dev, test, production
- ✅ **Centralized Logging**: Winston-based structured logging
- ✅ **Health Checks**: Built-in health check endpoints
- ✅ **Docker Support**: Docker Compose for MongoDB and Redis
- ✅ **Code Quality**: ESLint and Prettier configured
- ✅ **SOLID Principles**: Clean architecture patterns

## 📋 Prerequisites

- Node.js >= 18.x
- MongoDB >= 7.x
- Redis >= 7.x (optional, for distributed event bus)
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
cp .env.example .env.development
# Edit .env.development with your settings
```

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

Each module follows the same clean architecture pattern:

```
modules/[module-name]/
├── domain/              # Business logic layer
│   ├── Entity.js       # Domain entities
│   └── IRepository.js  # Repository interface
├── application/         # Application logic layer
│   └── Service.js      # Business services
└── infrastructure/      # Technical implementation
    ├── Model.js        # Database model
    ├── Repository.js   # Repository implementation
    ├── Controller.js   # HTTP controllers
    ├── Routes.js       # Route definitions
    └── index.js        # Module exports
```

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

## 🎯 Adding New Modules

1. **Create module structure**

```bash
mkdir -p src/modules/your-module/{domain,application,infrastructure}
```

2. **Implement domain layer** (entities, interfaces)

3. **Implement application layer** (services, business logic)

4. **Implement infrastructure layer** (models, repositories, controllers, routes)

5. **Create module initializer** in `src/modules/your-module/index.js`

6. **Register in bootstrap** (`src/bootstrap.js`)

```javascript
const { initializeYourModule } = require('./modules/your-module');
initializeYourModule(container);
```

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

### Example Module

```
POST   /api/examples       - Create new example
GET    /api/examples       - Get all examples
GET    /api/examples/:id   - Get example by ID
PUT    /api/examples/:id   - Update example
DELETE /api/examples/:id   - Delete example
```

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
