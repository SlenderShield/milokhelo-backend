# Milokhelo Backend Refactoring Guide

## Overview
This guide documents the refactoring process to flatten the modular monolith architecture while preserving all functionality.

## Completed Modules
- ✅ User Module (with StatsUpdateHandler & AchievementEvaluator)
- ✅ Tournament Module (with BracketGenerator)

## Module Migration Template

### Step 1: Create Directory Structure
```bash
mkdir -p src/modules/{module-name}/{controller,service,repository,model,dto,validation,routes,cache,tests}
```

### Step 2: Copy Files

```bash
# Services (application → service)
cp src/api/v1/modules/{module}/application/*.js src/modules/{module}/service/

# Domain services (domain → service if they're service-like)
cp src/api/v1/modules/{module}/domain/*.js src/modules/{module}/service/

# Models (infrastructure/persistence → model)  
cp src/api/v1/modules/{module}/infrastructure/persistence/*Model.js src/modules/{module}/model/

# Repositories (infrastructure/persistence → repository)
cp src/api/v1/modules/{module}/infrastructure/persistence/*Repository.js src/modules/{module}/repository/

# Controllers (infrastructure/http → controller)
cp src/api/v1/modules/{module}/infrastructure/http/*Controller.js src/modules/{module}/controller/

# Routes (infrastructure/http → routes)
cp src/api/v1/modules/{module}/infrastructure/http/*Routes.js src/modules/{module}/routes/

# DTOs (domain/entities → dto)
cp src/api/v1/modules/{module}/domain/*Entity.js src/modules/{module}/dto/

# Validation (common/validation → validation)
cp src/common/validation/{module}Validation.js src/modules/{module}/validation/{module}.validation.js
```

### Step 3: Update Imports

Replace imports in copied files:
- `'./Model.js'` → `'../model/name.model.js'`
- `'./Repository.js'` → `'../repository/name.repository.js'`
- `'../domain/Service.js'` → `'./serviceName.service.js'`
- `'@/common/validation/moduleValidation.js'` → `'../validation/module.validation.js'`

### Step 4: Create Module Index

Create `src/modules/{module}/index.js`:

```javascript
/**
 * {Module} Module
 */
import {ModuleClass}Model from './model/{module}.model.js';
import { {ModuleClass}Repository } from './repository/{module}.repository.js';
import { {ModuleClass}Service } from './service/{module}.service.js';
import { {ModuleClass}Controller } from './controller/{module}.controller.js';
export { create{ModuleClass}Routes } from './routes/{module}.routes.js';

export function initialize{ModuleClass}Module(container) {
  const logger = container.resolve('logger');
  const eventBus = container.resolve('eventBus');

  container.registerSingleton('{module}Repository', () => 
    new {ModuleClass}Repository(logger)
  );
  
  container.registerSingleton('{module}Service', () => {
    const repo = container.resolve('{module}Repository');
    return new {ModuleClass}Service(repo, eventBus, logger);
  });
  
  container.registerSingleton('{module}Controller', () => {
    const service = container.resolve('{module}Service');
    return new {ModuleClass}Controller(service, logger);
  });

  logger.info('{Module} module initialized');
}

export { 
  {ModuleClass}Model, 
  {ModuleClass}Repository, 
  {ModuleClass}Service, 
  {ModuleClass}Controller
};
```

### Step 5: Create Cache Placeholder

Create `src/modules/{module}/cache/{module}.cache.js`:

```javascript
/**
 * {Module} Cache
 * Placeholder for Redis-based caching layer
 * TODO: Implement caching logic when needed
 */

export class {ModuleClass}Cache {
  // Placeholder for future caching implementation
}
```

### Step 6: Update Bootstrap

In `src/bootstrap.js`, change:
```javascript
import { initialize{ModuleClass}Module } from '@/modules/{module}/index.js';
```
to:
```javascript
import { initialize{ModuleClass}Module } from '@/new-modules/{module}/index.js';
```

### Step 7: Update Routes

In `src/api/v1/routes.js`, change:
```javascript
import { create{ModuleClass}Routes } from './modules/{module}/...';
```
to:
```javascript
import { create{ModuleClass}Routes } from '@/new-modules/{module}/index.js';
```

### Step 8: Test

```bash
npm test
npm run lint
```

## Remaining Modules to Migrate

### Auth Module (Priority: HIGH)
- Special considerations: OAuth strategies (Passport), JWT middleware
- Files: AuthService, PassportConfig, EmailService
- Keep: OAuth strategies intact in service/

### Match Module
- Files: MatchService, MatchRepository, MatchModel
- Event handlers: Publishes match.finished event

### Team Module  
- Files: TeamService, TeamRepository, TeamModel

### Chat Module
- Files: ChatService, ChatRepository, ChatModel, MessageModel

### Venue Module
- Files: VenueService, VenueRepository, VenueModel, BookingModel
- Special: Venue booking conflict prevention logic

### Notification Module
- Files: NotificationService, PushNotificationService
- Platform-specific: FCM, APNs integration

### Maps Module
- Files: MapsService, geocoding utilities

### Calendar Module
- Files: CalendarService, event management

### Invitation Module  
- Files: InvitationService, InvitationRepository

### Feedback Module
- Files: FeedbackService, FeedbackRepository

### Admin Module
- Files: AdminService, AdminController

## Common Patterns

### Event Subscriptions
Keep event subscriptions in the module's `initialize{Module}Module()` function:
```javascript
eventBus.subscribe('event.name', async (data) => {
  // handler logic
});
```

### Dependency Injection
Always use the container pattern:
```javascript
container.registerSingleton('serviceName', () => {
  const dependency = container.resolve('dependencyName');
  return new ServiceClass(dependency, logger);
});
```

### Circular Dependencies
For circular dependencies (e.g., user ↔ match), resolve dynamically:
```javascript
if (!this.matchRepository) {
  this.matchRepository = container.resolve('matchRepository');
}
```

## Post-Migration Tasks

### Phase 2: Core Consolidation
Once all modules are migrated:
1. Move `src/core/container/` → `src/core/libs/container.js`
2. Move `src/core/events/` → `src/core/libs/eventBus.js`
3. Move `src/core/logging/` → `src/core/libs/logger.js`
4. Move `src/core/database/` → `src/core/libs/db.js`
5. Move `src/config/` → `src/core/config/`
6. Move `src/common/utils/` → `src/core/utils/`
7. Move `src/common/constants/` → `src/core/constants/`

### Phase 3: Auto-Loading
Create `src/modules/index.js`:
```javascript
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function loadModules(container, app) {
  const moduleDirs = fs.readdirSync(__dirname)
    .filter(f => fs.statSync(path.join(__dirname, f)).isDirectory());

  for (const dir of moduleDirs) {
    const modulePath = path.join(__dirname, dir, 'index.js');
    if (fs.existsSync(modulePath)) {
      const module = await import(`./${dir}/index.js`);
      if (module.initializeModule) {
        module.initializeModule(container);
      }
    }
  }
}
```

### Phase 4: Loaders
Create `src/loaders/` with:
- `database.js` - Database connection loader
- `events.js` - Event bus loader  
- `modules.js` - Module loader
- `index.js` - Orchestrator

### Phase 5: Cleanup
1. Remove `src/api/v1/modules/` after verification
2. Remove `src/common/` after migration
3. Update path alias to use `@/modules` for new location
4. Remove `@/new-modules` alias

## Verification Checklist

After each module migration:
- [ ] All imports updated correctly
- [ ] Module initializes without errors
- [ ] Routes accessible
- [ ] Tests pass
- [ ] Linter passes
- [ ] No console errors when starting server
- [ ] API endpoints work as expected

## Rollback Strategy

If issues arise:
1. Revert the specific module changes
2. Restore old import in bootstrap.js and routes.js
3. Investigate and fix issues
4. Re-attempt migration

## Notes

- **DO NOT** modify business logic during migration
- **DO NOT** change algorithm implementations
- **PRESERVE** all event handlers and subscriptions
- **MAINTAIN** dependency injection patterns
- **KEEP** error handling logic intact
