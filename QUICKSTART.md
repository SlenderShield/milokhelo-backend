# Quick Start Guide

Get the Milokhelo Backend up and running in minutes!

## Prerequisites

Ensure you have the following installed:
- Node.js >= 18.x
- Docker and Docker Compose (for MongoDB and Redis)
- Git

## Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd milokhelo-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env.development
```

The default configuration works out of the box for local development.

### 4. Start Infrastructure Services

Start MongoDB and Redis using Docker Compose:

```bash
docker compose up -d
```

Verify services are running:

```bash
docker ps
```

You should see containers for `milokhelo-mongodb` and `milokhelo-redis`.

### 5. Start the Application

```bash
npm run dev
```

You should see output similar to:

```
🚀 Starting milokhelo-backend in development mode...
✅ Server running at http://localhost:3000
📋 API available at http://localhost:3000/api
```

## Verify Installation

### Check Health Status

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2025-10-29T05:35:29.012Z",
  "uptime": 24.930344281,
  "database": "connected"
}
```

### Test the Example API

Create a new example:

```bash
curl -X POST http://localhost:3000/api/examples \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Example", "description": "My first example"}'
```

Get all examples:

```bash
curl http://localhost:3000/api/examples
```

## Available Scripts

- `npm start` - Start the server in production mode
- `npm run dev` - Start the server in development mode with auto-reload
- `npm run dev:redis` - Start with Redis EventBus adapter
- `npm run lint` - Run ESLint to check code quality
- `npm run lint:fix` - Auto-fix linting issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## Project Structure

```
src/
├── infrastructure/          # Core infrastructure
│   ├── config/             # Configuration management
│   ├── database/           # Database connections
│   ├── eventBus/           # Event bus implementations
│   ├── di/                 # Dependency injection
│   └── logger/             # Logging
├── modules/                # Business modules
│   └── example/            # Example module
│       ├── domain/         # Business entities
│       ├── application/    # Business logic
│       └── infrastructure/ # Data access & API
├── shared/                 # Shared utilities
│   ├── constants/
│   ├── types/
│   └── utils/
├── app.js                  # Express app setup
├── bootstrap.js            # App initialization
└── server.js               # Server entry point
```

## Key Features Demonstrated

### 1. Event-Driven Communication

Modules communicate via events:

```javascript
// Publish event
await eventBus.publish('example.created', { id, name });

// Subscribe to event
eventBus.subscribe('example.created', async (data) => {
  // Handle event
});
```

### 2. Dependency Injection

Services are registered and resolved through DI container:

```javascript
// Register
container.registerSingleton('exampleService', () => {
  return new ExampleService(repository, eventBus, logger);
});

// Resolve
const service = container.resolve('exampleService');
```

### 3. Centralized Logging

All logs are structured and context-aware:

```javascript
logger.info('Creating example entity', { data });
```

### 4. Environment-Based Configuration

Different configs for dev, test, and production:

```javascript
const config = getConfig();
const dbUri = config.get('mongodb.uri');
```

## Development Workflow

1. **Make changes** to your code
2. **Lint** - `npm run lint:fix`
3. **Format** - `npm run format`
4. **Test** - Manual testing or add automated tests
5. **Commit** - Use meaningful commit messages

## Stopping the Application

### Stop the Server

Press `Ctrl+C` in the terminal running the server.

### Stop Infrastructure Services

```bash
docker compose down
```

To remove volumes (data):

```bash
docker compose down -v
```

## Troubleshooting

### MongoDB Connection Issues

1. Ensure Docker is running
2. Check MongoDB container: `docker logs milokhelo-mongodb`
3. Verify port 27017 is not in use: `lsof -i :27017`

### Redis Connection Issues

1. Check Redis container: `docker logs milokhelo-redis`
2. Verify port 6379 is not in use: `lsof -i :6379`

### Port Already in Use

If port 3000 is in use, change it in `.env.development`:

```env
PORT=3001
```

## Next Steps

1. **Read the full README** - `README.md`
2. **Review architecture** - `ARCHITECTURE.md`
3. **Add your own modules** - Follow the example module pattern
4. **Set up testing** - Add unit and integration tests
5. **Configure CI/CD** - Set up automated testing and deployment

## Getting Help

- Check the [README.md](README.md) for detailed documentation
- Review the [ARCHITECTURE.md](ARCHITECTURE.md) for design patterns
- Examine the example module for implementation patterns

## Common Tasks

### Adding a New Module

```bash
mkdir -p src/modules/your-module/{domain,application,infrastructure}
```

Then follow the pattern established in `src/modules/example/`.

### Switching to Redis EventBus

Update `.env.development`:

```env
EVENT_BUS_ADAPTER=redis
```

Then restart the server.

### Running in Production Mode

```bash
NODE_ENV=production npm start
```

Make sure to update `.env.production` with your production settings first!

---

Happy coding! 🚀
