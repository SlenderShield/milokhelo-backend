# Quick Start Guide

Get the Milokhelo Sports Platform Backend up and running in minutes!

## Prerequisites

Ensure you have the following installed:

- **Node.js** >= 18.x
- **MongoDB** >= 5.x (or Docker for local development)
- **Redis** >= 6.x (or Docker for local development)
- **Git**

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

Update the OAuth credentials and other settings:

```env
# Server
PORT=4000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/milokhelo_dev

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
SESSION_SECRET=your-super-secret-session-key-change-in-production

# OAuth Configuration (optional - see docs/OAUTH_SETUP.md for setup)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
OAUTH_CALLBACK_URL=http://localhost:4000/api/v1/auth/oauth/callback
FRONTEND_URL=http://localhost:3000
```

> **📖 For detailed OAuth setup (Google & Facebook), see [`OAUTH_SETUP.md`](./OAUTH_SETUP.md)**

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

```text
🚀 Starting milokhelo-backend in development mode...
✅ Server running at http://localhost:4000
📋 API available at http://localhost:4000/api/v1
📚 API Documentation at http://localhost:4000/docs
🔌 WebSocket available at ws://localhost:4000
```

## Verify Installation

### Check Health Status

```bash
curl http://localhost:4000/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2025-10-29T05:35:29.012Z",
  "uptime": 24.93,
  "database": "connected"
}
```

### Access API Documentation

Visit <http://localhost:4000/docs> in your browser to explore all 70+ API endpoints with interactive Swagger UI.

### Test Milokhelo API

#### Register a User (Email/Password)

```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "player@example.com",
    "password": "SecurePass123!",
    "username": "cool_player",
    "fullName": "John Doe"
  }'
```

#### OAuth Login (Browser Required)

For Google OAuth:
```bash
# Open in browser
http://localhost:4000/api/v1/auth/oauth/google
```

For Facebook OAuth:
```bash
# Open in browser
http://localhost:4000/api/v1/auth/oauth/facebook
```

> **💡 Tip:** See [`OAUTH_SETUP.md`](./OAUTH_SETUP.md) for complete OAuth configuration guide.

#### Login (Email/Password)

```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "player@example.com",
    "password": "SecurePass123!"
  }'
```

#### Get Current User Profile

```bash
curl http://localhost:4000/api/v1/users/me \
  -b cookies.txt
```

#### Create a Match

```bash
curl -X POST http://localhost:4000/api/v1/matches \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "sport": "football",
    "location": {
      "type": "Point",
      "coordinates": [-73.935242, 40.730610],
      "address": "Central Park, New York"
    },
    "scheduledTime": "2025-11-15T18:00:00Z",
    "maxParticipants": 10,
    "skillLevel": "intermediate"
  }'
```

#### Search Nearby Venues

```bash
curl "http://localhost:4000/api/v1/venues/nearby?lat=40.730610&lng=-73.935242&maxDistance=5000&sport=football"
```

#### Create a Team

```bash
curl -X POST http://localhost:4000/api/v1/teams \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "Thunder Strikers",
    "sport": "football",
    "description": "Competitive weekend football team"
  }'
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

```text
src/
├── api/
│   └── v1/
│       ├── routes.js                    # Central API routing
│       └── modules/
│           ├── auth/                    # Authentication (OAuth + email/password)
│           ├── user/                    # User profiles, stats, achievements
│           ├── team/                    # Team management
│           ├── match/                   # Match lifecycle
│           ├── tournament/              # Tournament brackets
│           ├── chat/                    # Real-time messaging
│           ├── venue/                   # Venue search & booking
│           ├── additional/              # Maps, Calendar, Notifications, etc.
│           └── example/                 # Example module (reference)
├── common/                              # Shared utilities
├── config/                              # Configuration management
├── core/                                # Core infrastructure
│   ├── container/                       # Dependency injection
│   ├── database/                        # MongoDB connection
│   ├── events/                          # Event bus
│   ├── http/                            # HTTP middleware
│   ├── logging/                         # Winston logger
│   └── websocket/                       # Socket.IO
├── app.js                               # Express app setup
├── bootstrap.js                         # Module initialization
└── server.js                            # Server entry point
```

## Key Features Demonstrated

### 1. Hybrid Authentication

The platform supports both OAuth (Google, Facebook) and traditional email/password:

```javascript
// Get OAuth URL
const response = await fetch('http://localhost:4000/api/v1/auth/oauth/url?provider=google');
const { url } = await response.json();
// Redirect user to OAuth URL

// After OAuth callback, session is established automatically
```

### 2. Real-time Chat with WebSocket

Connect to chat rooms for real-time messaging:

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:4000');

// Join a chat room
socket.emit('join_room', { roomId: 'match-123' });

// Send a message
socket.emit('send_message', { 
  roomId: 'match-123', 
  message: 'Ready to play!' 
});

// Receive messages
socket.on('new_message', (data) => {
  console.log('New message:', data);
});
```

### 3. Geo-spatial Venue Search

Find venues near a location using MongoDB's 2dsphere index:

```bash
# Find venues within 5km
curl "http://localhost:4000/api/v1/venues/nearby?lat=40.730610&lng=-73.935242&maxDistance=5000"
```

### 4. Event-Driven Communication

Modules communicate via events:

```javascript
// Publish event
await eventBus.publish('match.started', { matchId, participants });

// Subscribe to event
eventBus.subscribe('match.started', async (data) => {
  // Update user stats, send notifications, etc.
});
```

### 5. Dependency Injection

Services are registered and resolved through DI container:

```javascript
// Register
container.registerSingleton('matchService', () => {
  return new MatchService(repository, eventBus, logger);
});

// Resolve
const service = container.resolve('matchService');
```

### 6. Advanced Logging System

The application features a comprehensive logging system with multiple capabilities:

#### Basic Logging

```javascript
import { getLogger } from './core/logging/index.js';

const logger = getLogger();

logger.info('User action', { userId: '123', action: 'login' });
logger.error('Operation failed', { error: error.message });
logger.warn('Rate limit approaching', { current: 95, limit: 100 });
logger.debug('Processing data', { records: 42 });
```

#### Request Logging

Each HTTP request automatically includes:

```javascript
// In controllers - req.logger has request context
req.logger.info('Processing payment', { amount: 99.99 });
// Logs include: requestId, method, path, and your data
```

#### Performance Tracking

```javascript
// Start a timer
const trackingId = logger.startTimer('database-query', { collection: 'users' });
const users = await userRepository.findAll();
logger.endTimer(trackingId, { count: users.length });

// Or use automatic timing
const result = await logger.logWithTiming('fetch-data', async () => {
  return await fetchData();
});
```

#### Specialized Logging

```javascript
// Security events
logger.security('failed-login-attempt', { email, ip, attempts: 3 });

// Audit trail
logger.audit('user-deleted', { 
  performedBy: adminId, 
  targetUser: userId 
});

// Business events
logger.logEvent('payment.completed', { 
  orderId, 
  amount, 
  currency 
});
```

#### Child Loggers with Context

```javascript
// Create a child logger with service context
const serviceLogger = logger.child({ service: 'PaymentService' });

// All logs from this logger include the context
serviceLogger.info('Processing payment'); 
// { service: 'PaymentService', message: 'Processing payment', ... }
```

**Features:**
- Request correlation with unique IDs
- Automatic sensitive data redaction
- Environment-specific formatting
- Log rotation (production)
- Performance metrics
- Security and audit logging

See [docs/LOGGING.md](./LOGGING.md) for complete documentation.

### 7. Environment-Based Configuration

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
mkdir -p src/api/v1/modules/your-module/{domain,application,infrastructure/{persistence,http}}
```

Then follow the pattern established in `src/api/v1/modules/example/`.

Key steps:
1. Create domain entities and interfaces in `domain/`
2. Create application services in `application/`
3. Create models and repositories in `infrastructure/persistence/`
4. Create controllers and routes in `infrastructure/http/`
5. Export module initializer in `index.js`
6. Register module routes in `src/api/v1/routes.js`
7. Initialize module in `src/bootstrap.js`

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
