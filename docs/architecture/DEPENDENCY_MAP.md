# Milokhelo Backend - Dependency & Integration Map

**Last Updated:** 2025-10-31  
**Purpose:** Visual representation of module dependencies and data flow

---

## 📊 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
│                    (Mobile Apps, Web UI)                         │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS/REST
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API Gateway Layer                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Express.js Application (src/app.js)                     │   │
│  │  - CORS, Security Headers (helmet)                       │   │
│  │  - Request ID Middleware ✨                               │   │
│  │  - Metrics Middleware ✨                                   │   │
│  │  - Session Management                                     │   │
│  │  - Authentication (Passport.js)                           │   │
│  │  - Error Handler (AppError) ✨                             │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API v1 Routes Layer                           │
│  ┌───────┬───────┬───────┬───────┬───────┬───────┬──────────┐   │
│  │ /auth │ /user │ /team │ /match│ /tour │ /venue│  +7 more │   │
│  └───────┴───────┴───────┴───────┴───────┴───────┴──────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Module Layer (Business Logic)                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  13 Business Modules (auth, user, team, match, etc.)      │ │
│  │                                                            │ │
│  │  Each Module Structure:                                   │ │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐   │ │
│  │  │   Domain    │→ │ Application  │→ │Infrastructure  │   │ │
│  │  │  (Entities) │  │  (Services)  │  │ (Controllers,  │   │ │
│  │  │ (Interfaces)│  │ (Use Cases)  │  │  Repositories) │   │ │
│  │  └─────────────┘  └──────────────┘  └────────────────┘   │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────┬────────────────┬──────────────────┬───────────────────┘
         │                │                  │
         ▼                ▼                  ▼
┌────────────────┐ ┌──────────────┐ ┌──────────────────────────┐
│  Core Services │ │   EventBus   │ │   External Services      │
│                │ │   ✨ Enhanced │ │                          │
│ • DI Container │ │ • Retry/DLQ  │ │ • MongoDB                │
│ • BaseRepo ✨   │ │ • Metadata   │ │ • Redis                  │
│ • Cache ✨      │ │ • Tracing    │ │ • Google OAuth/Calendar  │
│ • Jobs ✨       │ │              │ │ • Facebook OAuth         │
│ • Metrics ✨    │ │              │ │ • FCM (Push)             │
│ • Logger       │ │              │ │ • APNS (Push)            │
│ • DTOs ✨       │ │              │ │ • Nodemailer (Email)     │
└────────────────┘ └──────────────┘ └──────────────────────────┘
```

---

## 🔗 Module Dependency Graph

### Direct Dependencies (Module → Module)

```
auth
 └─→ (provides UserModel to other modules)

user
 ├─→ auth (UserModel)
 └─→ EventBus (subscribes to: match.completed)
      └─→ Triggers: user.stats.updated

team
 └─→ auth (UserModel for captain/members)

match
 ├─→ team (team references)
 ├─→ venue (venue reference)
 ├─→ auth (UserModel for createdBy)
 └─→ EventBus (publishes: match.completed)

tournament
 ├─→ team (team registrations)
 ├─→ match (creates matches)
 └─→ auth (UserModel for organizer)

venue
 ├─→ auth (UserModel for ownerId)
 └─→ maps (location data)

notification
 ├─→ auth (UserModel for recipients)
 └─→ EventBus (subscribes to: match.*, team.*, achievement.*)

chat
 ├─→ auth (UserModel for participants)
 └─→ team/match/tournament (room context)

calendar
 ├─→ auth (UserModel, Google OAuth)
 ├─→ match (auto-create events)
 └─→ tournament (auto-create events)

invitation
 ├─→ auth (UserModel for sender/recipient)
 ├─→ team/match/tournament (invitation context)
 └─→ notification (auto-notify on creation)

feedback
 └─→ auth (UserModel for submitter/reviewer)

maps
 └─→ venue (location association)

admin
 └─→ auth (requires admin role)
```

### Dependency Visualization

```
                    ┌──────────────┐
                    │     auth     │ (UserModel provider)
                    └──────┬───────┘
                           │
      ┌────────────────────┼────────────────────┐
      │                    │                    │
      ▼                    ▼                    ▼
 ┌────────┐          ┌─────────┐         ┌──────────┐
 │  user  │          │  team   │         │  match   │
 └────┬───┘          └────┬────┘         └────┬─────┘
      │                   │                    │
      │                   └──────────┐    ┌────┘
      │                              │    │
      └──────────────────────────────┼────┼──────────┐
                                     │    │          │
                                     ▼    ▼          ▼
                               ┌────────────────┐ ┌──────────┐
                               │  tournament    │ │  venue   │
                               └────────────────┘ └──────────┘
                                                        │
                                                        ▼
                                                   ┌────────┐
                                                   │  maps  │
                                                   └────────┘

Separate Concern Modules:
┌──────────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ notification │  │   chat   │  │ calendar │  │ feedback │
└──────────────┘  └──────────┘  └──────────┘  └──────────┘
       ▲                                             │
       │                                             ▼
┌──────────────┐                                ┌────────┐
│ invitation   │                                │ admin  │
└──────────────┘                                └────────┘
```

---

## 🔄 Event-Driven Data Flow

### EventBus Communication Patterns

```
┌──────────────────────────────────────────────────────────────┐
│                    EventBus (Central Hub)                     │
│  ✨ Features: Retry, DLQ, Metadata, Tracing                   │
└────┬────────────────────────┬───────────────────────┬────────┘
     │                        │                       │
     │ Publishes              │ Subscribes            │ Subscribes
     ▼                        ▼                       ▼
┌─────────────┐         ┌──────────┐           ┌──────────────┐
│   match     │         │   user   │           │notification  │
│             │         │          │           │              │
│ Events:     │         │ Events:  │           │ Events:      │
│ • completed │         │ • stats  │           │ • match.*    │
│             │         │   updated│           │ • team.*     │
└─────────────┘         └──────────┘           │ • achievement│
                              │                └──────────────┘
                              │
                              ▼
                        ┌──────────────┐
                        │ achievement  │
                        │  evaluator   │
                        │              │
                        │ Publishes:   │
                        │ • unlocked   │
                        └──────────────┘
```

### Event Flow Example: Match Completion

```
1. User completes match via API
   ┌──────────────┐
   │MatchService  │
   └──────┬───────┘
          │
          │ match.save()
          ▼
   ┌──────────────┐
   │ MatchRepo    │
   └──────┬───────┘
          │
          │ publish('match.completed', data)
          ▼
   ┌──────────────────────────────────────┐
   │          EventBus                    │
   │  ✨ Retry: 3x, Backoff: 1s, 2s, 4s   │
   │  ✨ Metadata: eventId, traceId       │
   └──────┬──────────────┬────────────────┘
          │              │
          │              │ (if handler fails → DLQ)
          ▼              ▼
   ┌────────────┐  ┌─────────────────┐
   │ UserStats  │  │ NotificationSvc │
   │ Handler    │  │                 │
   └────┬───────┘  └────┬────────────┘
        │               │
        │ update stats  │ send notification
        ▼               ▼
   ┌────────────┐  ┌─────────────┐
   │ publish    │  │ Push to     │
   │ stats      │  │ FCM/APNS    │
   │ updated    │  └─────────────┘
   └────┬───────┘
        │
        ▼
   ┌────────────────┐
   │ Achievement    │
   │ Evaluator      │
   │                │
   │ check unlock   │
   └────┬───────────┘
        │
        │ if unlocked
        ▼
   ┌────────────────┐
   │ publish        │
   │ achievement    │
   │ unlocked       │
   └────────────────┘
```

---

## 💾 Data Access Patterns

### Repository Layer Architecture

```
┌────────────────────────────────────────────────────────────┐
│                   Service Layer                            │
│  (Business Logic, Use Cases)                               │
└────────────────────┬───────────────────────────────────────┘
                     │
                     │ uses
                     ▼
┌────────────────────────────────────────────────────────────┐
│              Repository Interface (IRepository)            │
│  (Contract defining operations)                            │
└────────────────────┬───────────────────────────────────────┘
                     │
                     │ implements
                     ▼
┌────────────────────────────────────────────────────────────┐
│          Concrete Repository (e.g., UserRepository)        │
│  extends BaseRepository ✨                                  │
│                                                            │
│  Inherited Methods:                                        │
│  • findById(id)                                            │
│  • find(query)                                             │
│  • findPaginated(query, options) ✨                         │
│  • create(data, options)                                   │
│  • update(id, data)                                        │
│  • delete(id)                                              │
│  • withTransaction(callback) ✨                             │
│                                                            │
│  Custom Methods:                                           │
│  • findByEmail(email)                                      │
│  • searchUsers(filters)                                    │
└────────────────────┬───────────────────────────────────────┘
                     │
                     │ uses
                     ▼
┌────────────────────────────────────────────────────────────┐
│              Mongoose Model (UserModel)                    │
│  (Schema definition, validation)                           │
└────────────────────┬───────────────────────────────────────┘
                     │
                     │ queries
                     ▼
┌────────────────────────────────────────────────────────────┐
│                    MongoDB                                 │
│  (Data storage)                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 🔐 Security & Data Protection Layers

### Request-Response Pipeline with DTOs

```
1. Client Request
   │
   ▼
2. Authentication Middleware (requireAuth)
   │
   ▼
3. Authorization Middleware (requireRoles)
   │
   ▼
4. Validation Middleware (express-validator)
   │
   ▼
5. Controller
   │
   ├─→ Call Service
   │   │
   │   ├─→ Service calls Repository
   │   │   │
   │   │   ├─→ Repository queries Model
   │   │   │   │
   │   │   │   └─→ MongoDB
   │   │   │
   │   │   └─→ Returns raw document
   │   │
   │   └─→ Service returns raw data
   │
   ├─→ Controller applies DTO ✨
   │   │
   │   └─→ UserDTO.transform(data, { isOwner: true })
   │       │
   │       ├─→ Excludes: password, oauthTokens, __v
   │       ├─→ Applies privacy: showPhone, showLocation
   │       └─→ Context-aware: owner vs public
   │
   └─→ Response with safe data
       │
       └─→ Client receives sanitized JSON
```

### DTO Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Raw MongoDB Document                      │
│  {                                                           │
│    _id, __v,                    ← Internal fields            │
│    password, oauthTokens,       ← Sensitive credentials      │
│    email, phone, location,      ← Privacy-controlled         │
│    name, bio, profilePicture    ← Public fields              │
│  }                                                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ transform()
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              DTO Transform (Context-Aware)                   │
│                                                              │
│  if (isOwner):                                               │
│    ✅ Include all safe fields                                │
│    ✅ Include privacy-controlled fields                      │
│                                                              │
│  if (isPublic):                                              │
│    ✅ Include public fields only                             │
│    ❌ Exclude phone if !privacy.showPhone                    │
│    ❌ Exclude location if !privacy.showLocation              │
│                                                              │
│  Always:                                                     │
│    ❌ Exclude password                                       │
│    ❌ Exclude oauthTokens                                    │
│    ❌ Exclude __v, _id (convert to id)                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Safe Response Object                        │
│  {                                                           │
│    id: "507f1f77bcf86cd799439011",                           │
│    email: "user@example.com",                                │
│    name: "John Doe",                                         │
│    bio: "Sports enthusiast",                                 │
│    profilePicture: "https://...",                            │
│    phone: "+1234567890",  ← only if owner or privacy allows  │
│    location: {...}        ← only if owner or privacy allows  │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Performance Optimization Layers

### Caching Strategy

```
┌────────────────────────────────────────────────────────────┐
│                    Client Request                          │
└────────────────────┬───────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────┐
│                Controller Layer                            │
│  Check if data needs caching                               │
└────────────────────┬───────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────┐
│              CacheManager ✨                                │
│  Namespace: "user", "team", "venue", etc.                  │
│                                                            │
│  cache.getOrSet(key, factory, ttl)                         │
└───┬────────────────┬───────────────────────────────────────┘
    │                │
    │ Cache Hit      │ Cache Miss
    │ (50-80%)       │ (20-50%)
    │                │
    ▼                ▼
┌─────────┐    ┌──────────────────┐
│ Redis   │    │ Service Layer     │
│ Returns │    │ ├─→ Repository    │
│ Cached  │    │ ├─→ MongoDB       │
│ Data    │    │ └─→ Cache Result  │
└────┬────┘    └─────────┬────────┘
     │                   │
     └─────────┬─────────┘
               │
               ▼
┌────────────────────────────────────────────────────────────┐
│          DTO Transform (Minimal for lists)                 │
│  40-60% payload reduction                                  │
└────────────────────┬───────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────┐
│              Response to Client                            │
└────────────────────────────────────────────────────────────┘
```

### Job Queue Background Processing

```
┌────────────────────────────────────────────────────────────┐
│              Synchronous HTTP Request                      │
│  (e.g., Create notification)                               │
└────────────────────┬───────────────────────────────────────┘
                     │
                     │ Quick response
                     ▼
┌────────────────────────────────────────────────────────────┐
│          Controller → Service                              │
│  1. Save notification to DB                                │
│  2. Queue push notification job                            │
│  3. Return 201 Created immediately                         │
└────────────────────┬───────────────────────────────────────┘
                     │
                     │ async
                     ▼
┌────────────────────────────────────────────────────────────┐
│          QueueManager ✨ (BullMQ + Redis)                   │
│                                                            │
│  Queue: "notifications"                                    │
│  Job: { type: "send-push", data: {...} }                   │
│                                                            │
│  Features:                                                 │
│  • Retry: 3x with backoff                                  │
│  • Priority: high/normal/low                               │
│  • Scheduling: delayed/recurring                           │
│  • Progress tracking                                       │
└────────────────────┬───────────────────────────────────────┘
                     │
                     │ worker processes
                     ▼
┌────────────────────────────────────────────────────────────┐
│          Notification Processor                            │
│  1. Process job                                            │
│  2. Call FCM/APNS API                                      │
│  3. Update job progress                                    │
│  4. Mark job complete/failed                               │
└────────────────────┬───────────────────────────────────────┘
                     │
                     │ on failure → retry or DLQ
                     │ on success → metrics
                     ▼
┌────────────────────────────────────────────────────────────┐
│          Metrics & Monitoring ✨                            │
│  • Job success/failure rate                                │
│  • Queue depth                                             │
│  • Processing time                                         │
└────────────────────────────────────────────────────────────┘
```

---

## 📊 Observability & Monitoring Flow

```
┌────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
│  • HTTP Requests                                           │
│  • EventBus Events                                         │
│  • Database Queries                                        │
│  • Cache Operations                                        │
│  • Job Processing                                          │
└────────────┬───────────────────────────────────────────────┘
             │
             │ instruments
             ▼
┌────────────────────────────────────────────────────────────┐
│              MetricsCollector ✨                            │
│  (Prometheus prom-client)                                  │
│                                                            │
│  Metrics:                                                  │
│  • http_request_duration_seconds (histogram)               │
│  • http_requests_total (counter)                           │
│  • http_active_connections (gauge)                         │
│  • eventbus_events_total (counter)                         │
│  • eventbus_handler_duration_seconds (histogram)           │
│  • db_query_duration_seconds (histogram)                   │
│  • cache_hits_total (counter)                              │
│  • cache_misses_total (counter)                            │
│  • job_processing_duration_seconds (histogram)             │
│  • process_cpu_seconds_total                               │
│  • process_resident_memory_bytes                           │
└────────────┬───────────────────────────────────────────────┘
             │
             │ exposes
             ▼
┌────────────────────────────────────────────────────────────┐
│          /health/metrics Endpoint                          │
│  (Prometheus-compatible text format)                       │
└────────────┬───────────────────────────────────────────────┘
             │
             │ scraped by
             ▼
┌────────────────────────────────────────────────────────────┐
│              Prometheus Server                             │
│  (Time-series database)                                    │
└────────────┬───────────────────────────────────────────────┘
             │
             │ visualized in
             ▼
┌────────────────────────────────────────────────────────────┐
│              Grafana Dashboard                             │
│  • Request rate & latency                                  │
│  • Error rates by type                                     │
│  • Event processing stats                                  │
│  • Cache hit rates                                         │
│  • Job queue depth & processing time                       │
│  • System resources (CPU, memory)                          │
└────────────────────────────────────────────────────────────┘
```

---

## 🔍 Error Handling & Tracing Flow

```
┌────────────────────────────────────────────────────────────┐
│              Client Request                                │
└────────────────────┬───────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────┐
│          Request ID Middleware ✨                           │
│  Generates unique ID: req.requestId                        │
│  Adds to context for tracing                               │
└────────────────────┬───────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────┐
│          Controller → Service → Repository                 │
│  (Business logic execution)                                │
│                                                            │
│  If error occurs:                                          │
│    throw new NotFoundError('User', { userId })             │
│    throw new ValidationError('Invalid email')              │
│    etc.                                                    │
└────────────────────┬───────────────────────────────────────┘
                     │
                     │ error thrown
                     ▼
┌────────────────────────────────────────────────────────────┐
│              Error Handler Middleware ✨                    │
│                                                            │
│  Classifies error:                                         │
│  • isOperational (expected, safe to expose)                │
│  • isProgramming (unexpected, log full details)            │
│                                                            │
│  Logs:                                                     │
│  • requestId for correlation                               │
│  • Error type and message                                  │
│  • Stack trace (dev only)                                  │
│  • User context                                            │
│                                                            │
│  Responds:                                                 │
│  • Operational: Safe error message                         │
│  • Programming: Generic 500 message                        │
└────────────────────┬───────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────┐
│          Metrics Collector                                 │
│  Increments error counters by type                         │
└────────────────────┬───────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────┐
│              Client Response                               │
│  {                                                         │
│    "status": "error",                                      │
│    "statusCode": 404,                                      │
│    "message": "User not found",                            │
│    "requestId": "abc123"  ← for support                    │
│  }                                                         │
└────────────────────────────────────────────────────────────┘
```

---

## 🎯 Summary

This dependency map shows:

1. **Layered Architecture** - Clear separation of concerns
2. **Event-Driven Communication** - Loose coupling via EventBus
3. **Data Protection** - Multi-layer security with DTOs
4. **Performance Optimization** - Caching and background jobs
5. **Observability** - Comprehensive monitoring and tracing
6. **Error Handling** - Centralized and context-aware

**Key Patterns:**
- ✅ Repository abstraction for data access
- ✅ DTO transformation for API security
- ✅ EventBus for decoupled communication
- ✅ Cache-aside pattern for performance
- ✅ Job queue for async processing
- ✅ Metrics collection for observability
- ✅ Request tracing for debugging

**Integration Points:**
- 13 business modules
- 6 external services (Google, Facebook, FCM, APNS, MongoDB, Redis)
- 1 EventBus hub
- 1 centralized cache
- 1 job queue system
- 1 metrics collector

All modules follow consistent patterns and communicate through well-defined interfaces.
