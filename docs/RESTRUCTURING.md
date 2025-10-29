# Codebase Restructuring Documentation

**Date:** October 29, 2025  
**Status:** Completed

## Overview

The codebase has been reorganized to follow a more scalable and maintainable architecture pattern. The restructuring improves separation of concerns, makes the API versioning explicit, and provides better organization for future growth.

## Key Changes

### 1. Infrastructure → Core

**Old:** `src/infrastructure/`  
**New:** `src/core/`

The infrastructure layer has been renamed to "core" to better reflect its purpose as the foundational layer of the application.

**Detailed Changes:**

- `infrastructure/config/` → `config/` (moved to top level)
- `infrastructure/database/` → `core/database/`
- `infrastructure/eventBus/` → `core/events/`
- `infrastructure/di/` → `core/container/`
- `infrastructure/logger/` → `core/logging/`
- `infrastructure/middlewares/` → `core/http/middlewares/`
- `infrastructure/health/` → `core/http/`
- `infrastructure/utils/` → `common/utils/`

### 2. Shared → Common

**Old:** `src/shared/`  
**New:** `src/common/`

The shared layer has been renamed to "common" for clarity.

**Detailed Changes:**

- `shared/constants/` → `common/constants/`
- `shared/utils/` → `common/utils/`

**New subdirectories added:**
- `common/types/` - For shared TypeScript types (future)
- `common/interfaces/` - For shared interface contracts

### 3. Modules → API with Versioning

**Old:** `src/modules/`  
**New:** `src/api/v1/modules/`

Modules are now explicitly versioned and organized under an API layer.

**Detailed Changes:**

- `modules/example/` → `api/v1/modules/example/`
- `modules/user/` → `api/v1/modules/user/`

### 4. Module Infrastructure Split

The infrastructure layer within each module has been split for better organization:

**Old Structure:**
```
modules/example/infrastructure/
├── ExampleModel.js
├── ExampleRepository.js
├── ExampleController.js
├── ExampleRoutes.js
└── index.js
```

**New Structure:**
```
api/v1/modules/example/infrastructure/
├── persistence/
│   ├── ExampleModel.js
│   └── ExampleRepository.js
├── http/
│   ├── ExampleController.js
│   └── ExampleRoutes.js
└── index.js
```

### 5. Centralized API Routing

**New File:** `src/api/v1/routes.js`

A centralized router configuration for API version 1 has been added. This makes it easier to manage all module routes in one place.

```javascript
export function createV1Router(container) {
  const router = express.Router();
  
  // All module routes registered here
  router.use('/examples', createExampleRoutes(container.resolve('exampleController')));
  // Add more routes...
  
  return router;
}
```

### 6. Enhanced HTTP Core Module

**New Structure:** `src/core/http/`

The HTTP layer has been consolidated:

```
core/http/
├── middlewares/
│   ├── errorHandler.js
│   ├── notFoundHandler.js
│   ├── requestLogger.js
│   ├── security.js
│   └── index.js
├── errors/          # Future: Custom error classes
├── healthRoutes.js
└── index.js
```

## Updated Directory Structure

```
src/
├── core/                          # Core infrastructure services
│   ├── container/                # Dependency injection
│   │   ├── container.js
│   │   └── index.js
│   ├── database/                 # Database management
│   │   ├── connection.js
│   │   ├── healthCheck.js
│   │   └── index.js
│   ├── events/                   # Event bus
│   │   ├── EventBusFactory.js
│   │   ├── IEventBus.js
│   │   ├── inMemoryBus.js
│   │   ├── redisBus.js
│   │   └── index.js
│   ├── http/                     # HTTP layer
│   │   ├── middlewares/
│   │   │   ├── errorHandler.js
│   │   │   ├── notFoundHandler.js
│   │   │   ├── requestLogger.js
│   │   │   ├── security.js
│   │   │   └── index.js
│   │   ├── errors/
│   │   ├── healthRoutes.js
│   │   └── index.js
│   └── logging/                  # Logging
│       ├── logger.js
│       └── index.js
├── config/                        # Configuration
│   ├── env/
│   │   ├── development.js
│   │   ├── test.js
│   │   └── production.js
│   ├── configLoader.js
│   └── index.js
├── api/                           # API layer
│   └── v1/                       # Version 1
│       ├── modules/              # Business modules
│       │   ├── example/
│       │   │   ├── domain/
│       │   │   │   ├── ExampleEntity.js
│       │   │   │   ├── IExampleRepository.js
│       │   │   │   └── index.js
│       │   │   ├── application/
│       │   │   │   ├── ExampleService.js
│       │   │   │   └── index.js
│       │   │   ├── infrastructure/
│       │   │   │   ├── persistence/
│       │   │   │   │   ├── ExampleModel.js
│       │   │   │   │   └── ExampleRepository.js
│       │   │   │   ├── http/
│       │   │   │   │   ├── ExampleController.js
│       │   │   │   │   └── ExampleRoutes.js
│       │   │   │   └── index.js
│       │   │   └── index.js
│       │   └── user/
│       │       └── ...
│       ├── routes.js             # API v1 router
│       └── controllers/          # Future: Shared controllers
├── common/                        # Shared code
│   ├── constants/
│   │   └── index.js
│   ├── utils/
│   │   ├── index.js
│   │   └── validateEnv.js
│   ├── types/                    # Future: Type definitions
│   └── interfaces/               # Future: Shared interfaces
├── app.js                         # Express app factory
├── bootstrap.js                   # Application bootstrap
└── server.js                      # Server entry point
```

## Benefits of the Restructuring

### 1. **Better Separation of Concerns**
- Core infrastructure is clearly separated from business logic
- Configuration is at the top level, easy to locate
- HTTP concerns are grouped together

### 2. **Explicit API Versioning**
- API version is now explicit in the directory structure
- Easy to add v2, v3, etc. without breaking existing APIs
- Centralized routing per version

### 3. **Clearer Module Structure**
- Persistence and HTTP layers are separated within infrastructure
- Makes it obvious where to put new models, repositories, controllers, and routes
- Follows Domain-Driven Design principles more explicitly

### 4. **Scalability**
- Easy to extract modules to microservices (each module is self-contained)
- API versioning makes it easy to evolve the API
- Clear boundaries between layers

### 5. **Developer Experience**
- More intuitive file locations
- Easier to onboard new developers
- Follows industry best practices

### 6. **Future-Proof**
- Room for API v2, v3, etc.
- Placeholder directories for types and interfaces
- Error handling can be enhanced in `core/http/errors/`

## Migration Notes

### Import Path Changes

All import paths have been updated. Key patterns:

**Before:**
```javascript
import { createLogger } from './infrastructure/logger/index.js';
import { EventBusFactory } from './infrastructure/eventBus/index.js';
import { EVENTS } from './shared/constants/index.js';
import { asyncHandler } from '../../../shared/utils/index.js';
```

**After:**
```javascript
import { createLogger } from './core/logging/index.js';
import { EventBusFactory } from './core/events/index.js';
import { EVENTS } from './common/constants/index.js';
import { asyncHandler } from '../../../../../../common/utils/index.js';
```

### Files Updated

**Entry Points:**
- ✅ `src/server.js` - No changes needed
- ✅ `src/bootstrap.js` - Updated imports
- ✅ `src/app.js` - Updated imports, uses new v1 router

**Core Layer:**
- ✅ All files moved and imports within core updated
- ✅ `core/http/index.js` - Now exports both health routes and middlewares

**API Layer:**
- ✅ All modules moved to `api/v1/modules/`
- ✅ Module infrastructure split into `persistence/` and `http/`
- ✅ All internal imports updated

**Common Layer:**
- ✅ All files moved from `shared/` to `common/`
- ✅ No internal changes needed

**New Files:**
- ✅ `src/api/v1/routes.js` - Centralized API v1 router

### Testing

After restructuring:
- ✅ Linting passes: `npm run lint`
- ⚠️ Tests need to be updated when created (test directory exists but empty)

## Backward Compatibility

This is a **breaking change** for:
- Any external tools referencing old file paths
- Any documentation referencing old structure
- Import statements in any code not part of this repository

**Migration for external code:**
- Update import paths according to the mapping above
- Update any file path references in configuration or scripts

## Future Enhancements

With this new structure, we can easily add:

1. **API v2**
   ```bash
   mkdir -p src/api/v2/modules
   ```

2. **Custom Error Classes**
   ```bash
   # Create in src/core/http/errors/
   - AppError.js
   - ValidationError.js
   - NotFoundError.js
   ```

3. **Shared Types**
   ```bash
   # Create in src/common/types/
   - User.types.js
   - Response.types.js
   ```

4. **Shared Interfaces**
   ```bash
   # Create in src/common/interfaces/
   - IAuthService.js
   - ICacheService.js
   ```

5. **Microservices Extraction**
   - Each module in `api/v1/modules/` can be extracted as-is
   - Core services can be packaged as shared libraries
   - Event bus already supports distributed communication via Redis

## Rollback Plan

If rollback is needed:

1. Revert the git commit that introduced these changes
2. Or manually move files back to their original locations
3. Update import paths back to original patterns

**Rollback command:**
```bash
git revert <commit-hash>
```

## Validation Checklist

- ✅ All files moved to new locations
- ✅ All import paths updated
- ✅ Linting passes
- ✅ No duplicate files in old and new locations
- ✅ Old directories cleaned up
- ✅ Documentation updated (README, ARCHITECTURE, QUICKSTART)
- ✅ New structure documented (this file)

## Questions & Answers

**Q: Why split infrastructure into persistence and http?**  
A: This follows Domain-Driven Design and Clean Architecture principles more closely. It makes it clear that persistence and HTTP are both infrastructure concerns but serve different purposes.

**Q: Why rename infrastructure to core?**  
A: "Core" better communicates that these are foundational services that everything else depends on. "Infrastructure" can be ambiguous.

**Q: Why move config to top level?**  
A: Configuration is fundamental to the application and affects all layers. Having it at the top level makes it more discoverable and emphasizes its importance.

**Q: Do we need to version the API if it's a monolith?**  
A: Yes! API versioning is a best practice regardless of architecture. It allows you to evolve your API without breaking existing clients and makes future microservices extraction easier.

**Q: What if I need to add code shared between API versions?**  
A: Use the `common/` directory for truly shared code, or create `src/api/common/` for API-specific shared code that spans versions.

## Conclusion

This restructuring provides a solid foundation for future growth. The codebase is now more maintainable, scalable, and follows industry best practices for Node.js backend applications.

The explicit separation of concerns and API versioning will make it easier to:
- Onboard new developers
- Add new features
- Maintain and evolve the codebase
- Extract modules to microservices when needed

---

**Restructured by:** GitHub Copilot  
**Date:** October 29, 2025  
**Approved by:** Development Team
