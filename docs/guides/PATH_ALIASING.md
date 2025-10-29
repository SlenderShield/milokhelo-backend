# Path Aliasing Setup

This project uses path aliasing to simplify imports and avoid deep relative paths.

## Configured Aliases

The following path aliases are configured in `jsconfig.json` and `loader.js`:

| Alias | Path | Usage |
|-------|------|-------|
| `@/core/*` | `src/core/*` | Core infrastructure (HTTP, database, events, etc.) |
| `@/api/*` | `src/api/*` | API routes and versioning |
| `@/common/*` | `src/common/*` | Common utilities, constants, and types |
| `@/config/*` | `src/config/*` | Configuration files |
| `@/modules/*` | `src/api/v1/modules/*` | Application modules |
| `@/test/*` | `test/*` | Test files and helpers |

## Benefits

1. **Cleaner Imports**: No more `../../../../../../../`
2. **Easier Refactoring**: Changing file locations doesn't break imports
3. **Better IDE Support**: Autocomplete works better with absolute paths
4. **Consistent Style**: All imports follow the same pattern

## Usage Examples

### Before (Relative Imports)
```javascript
// Deep relative imports are hard to read and maintain
import { asyncHandler, HTTP_STATUS } from '../../../../../../core/http/index.js';
import { EVENTS } from '../../../../../common/constants/index.js';
import { UserService } from '../../../user/index.js';
```

### After (Path Aliases)
```javascript
// Clean and readable imports
import { asyncHandler, HTTP_STATUS } from '@/core/http/index.js';
import { EVENTS } from '@/common/constants/index.js';
import { UserService } from '@/modules/user/index.js';
```

## Module Structure Examples

### Core Infrastructure
```javascript
// HTTP utilities
import { asyncHandler, HTTP_STATUS } from '@/core/http/index.js';
import { BookingConflictError } from '@/core/http/errors/BookingConflictError.js';

// Database
import { MongoDBConnection } from '@/core/database/index.js';

// Events
import { EventBusFactory } from '@/core/events/index.js';

// Logging
import { createLogger } from '@/core/logging/index.js';
```

### Common Utilities
```javascript
// Constants
import { EVENTS, ERROR_CODES, HTTP_STATUS } from '@/common/constants/index.js';

// Utils
import { isEmpty, retry } from '@/common/utils/index.js';
```

### Application Modules
```javascript
// User module
import { UserService, UserRepository } from '@/modules/user/index.js';

// Team module
import { TeamService } from '@/modules/team/index.js';

// Match module
import { MatchService } from '@/modules/match/index.js';

// Cross-module reference
import UserModel from '@/modules/auth/infrastructure/persistence/UserModel.js';
```

### Configuration
```javascript
import { getConfig } from '@/config/index.js';
```

### Test Files
```javascript
import { setupTestDatabase } from '@/test/helpers/setup.js';
import { UserService } from '@/modules/user/index.js';
```

## How It Works

### ES Module Loader
We use a custom ES Module loader (`loader.js`) that intercepts import statements and resolves path aliases before Node.js processes them.

The loader is registered via the `--import` flag with `register-loader.js` in all npm scripts:
```json
{
  "scripts": {
    "dev": "nodemon --import ./register-loader.js src/server.js",
    "start": "node --import ./register-loader.js src/server.js",
    "test": "mocha --import ./register-loader.js --exit"
  }
}
```

The `register-loader.js` file uses Node.js's `register()` API to load the custom resolver:
```javascript
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

register('./loader.js', pathToFileURL('./'));
```

### IDE Support
The `jsconfig.json` file provides IDE support (IntelliSense, auto-imports, etc.) for VS Code and other editors:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/core/*": ["src/core/*"],
      "@/api/*": ["src/api/*"],
      // ... more aliases
    }
  }
}
```

## Best Practices

### 1. Use Aliases for Cross-Layer Imports
```javascript
// ✅ Good - Clear path from infrastructure to core
import { asyncHandler } from '@/core/http/index.js';

// ❌ Avoid - Confusing relative path
import { asyncHandler } from '../../../../../../core/http/index.js';
```

### 2. Use Relative Imports Within the Same Module
```javascript
// Within the same module, relative imports are fine
import ExampleEntity from './domain/ExampleEntity.js';
import { ExampleRepository } from './infrastructure/index.js';
```

### 3. Always Include the .js Extension
```javascript
// ✅ Good
import { UserService } from '@/modules/user/index.js';

// ❌ Won't work reliably with ES modules
import { UserService } from '@/modules/user';
```

### 4. Use index.js for Clean Module Exports
```javascript
// @/modules/user/index.js
export { UserService } from './application/UserService.js';
export { UserRepository } from './infrastructure/persistence/UserRepository.js';

// Other files can import cleanly
import { UserService, UserRepository } from '@/modules/user/index.js';
```

## Migration Guide

If you're adding new files or refactoring existing ones:

1. **Controllers**: Use `@/core/http/index.js` for HTTP utilities
2. **Services**: Use `@/common/constants/index.js` for constants
3. **Cross-module imports**: Use `@/modules/[module-name]/index.js`
4. **Core utilities**: Use `@/core/[utility]/index.js`
5. **Tests**: Use `@/modules/[module-name]` and `@/test/helpers`

## Troubleshooting

### Import Resolution Errors
If you see errors like "Cannot find module '@/core/http'":
1. Ensure you're running scripts with the loader: `--import ./register-loader.js`
2. Verify the path exists and includes the `.js` extension
3. Check that `loader.js` and `register-loader.js` are in the project root

### IDE Not Recognizing Paths
1. Ensure `jsconfig.json` is in the project root
2. Restart your IDE/editor
3. Check that the path mappings in `jsconfig.json` match `loader.js`

### Test Failures
1. Ensure test scripts include the loader flag: `--import ./register-loader.js`
2. Check that test imports use the correct aliases
3. Verify relative imports within test files use correct paths

## Adding New Aliases

To add a new path alias:

1. Update `jsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/new-alias/*": ["src/new-path/*"]
    }
  }
}
```

2. Update `loader.js`:
```javascript
const aliases = {
  '@/new-alias': pathResolve(__dirname, 'src/new-path'),
};
```

3. Restart your development server and IDE

## Resources

- [ES Modules Loaders](https://nodejs.org/api/esm.html#loaders)
- [jsconfig.json Reference](https://code.visualstudio.com/docs/languages/jsconfig)
- [Node.js ES Modules](https://nodejs.org/api/esm.html)
