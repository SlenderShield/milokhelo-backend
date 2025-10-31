#!/bin/bash

# Module Migration Script
# Usage: ./scripts/migrate-module.sh <module-name>
#
# Example: ./scripts/migrate-module.sh auth

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <module-name>"
  echo "Example: $0 auth"
  exit 1
fi

MODULE_NAME=$1
MODULE_CLASS=$(echo "$MODULE_NAME" | sed 's/.*/\u&/')  # Capitalize first letter

echo "🚀 Migrating $MODULE_NAME module..."

# Create directory structure
echo "📁 Creating directory structure..."
mkdir -p "src/modules/$MODULE_NAME"/{controller,service,repository,model,dto,validation,routes,cache,tests}

# Copy files if they exist
OLD_PATH="src/api/v1/modules/$MODULE_NAME"

if [ ! -d "$OLD_PATH" ]; then
  echo "❌ Error: Module $MODULE_NAME not found at $OLD_PATH"
  exit 1
fi

echo "📦 Copying files..."

# Application layer → service
if [ -d "$OLD_PATH/application" ]; then
  for file in "$OLD_PATH/application"/*.js; do
    if [ -f "$file" ]; then
      basename=$(basename "$file" .js)
      # Convert CamelCase to kebab-case for service files
      serviceFile=$(echo "$basename" | sed 's/\([A-Z]\)/-\L\1/g' | sed 's/^-//')
      cp "$file" "src/modules/$MODULE_NAME/service/${serviceFile}.service.js"
      echo "  ✓ Copied $(basename "$file") → service/${serviceFile}.service.js"
    fi
  done
fi

# Domain layer → service (for domain services) or dto (for entities)
if [ -d "$OLD_PATH/domain" ]; then
  for file in "$OLD_PATH/domain"/*.js; do
    if [ -f "$file" ]; then
      basename=$(basename "$file")
      # If it's an entity, move to dto; otherwise to service
      if [[ "$basename" == *"Entity.js" ]]; then
        dtoFile=$(echo "$basename" | sed 's/Entity/.dto/')
        cp "$file" "src/modules/$MODULE_NAME/dto/$dtoFile"
        echo "  ✓ Copied $basename → dto/$dtoFile"
      elif [[ "$basename" != "index.js" ]] && [[ "$basename" != "I"* ]]; then
        serviceFile=$(echo "$basename" | sed 's/\([A-Z]\)/-\L\1/g' | sed 's/^-//' | sed 's/.js/.service.js/')
        cp "$file" "src/modules/$MODULE_NAME/service/$serviceFile"
        echo "  ✓ Copied $basename → service/$serviceFile"
      fi
    fi
  done
fi

# Infrastructure/persistence → model and repository
if [ -d "$OLD_PATH/infrastructure/persistence" ]; then
  for file in "$OLD_PATH/infrastructure/persistence"/*Model.js; do
    if [ -f "$file" ]; then
      basename=$(basename "$file")
      modelFile=$(echo "$basename" | sed 's/\([A-Z]\)/-\L\1/g' | sed 's/^-//' | sed 's/-model//')
      cp "$file" "src/modules/$MODULE_NAME/model/$modelFile"
      echo "  ✓ Copied $basename → model/$modelFile"
    fi
  done
  
  for file in "$OLD_PATH/infrastructure/persistence"/*Repository.js; do
    if [ -f "$file" ]; then
      basename=$(basename "$file")
      repoFile=$(echo "$basename" | sed 's/\([A-Z]\)/-\L\1/g' | sed 's/^-//' | sed 's/-repository//')
      cp "$file" "src/modules/$MODULE_NAME/repository/$repoFile"
      echo "  ✓ Copied $basename → repository/$repoFile"
    fi
  done
  
  # Copy other files (like seeds, utils)
  for file in "$OLD_PATH/infrastructure/persistence"/*.js; do
    if [ -f "$file" ] && [[ "$file" != *"Model.js" ]] && [[ "$file" != *"Repository.js" ]]; then
      cp "$file" "src/modules/$MODULE_NAME/repository/$(basename "$file")"
      echo "  ✓ Copied $(basename "$file") → repository/"
    fi
  done
fi

# Infrastructure/http → controller and routes
if [ -d "$OLD_PATH/infrastructure/http" ]; then
  for file in "$OLD_PATH/infrastructure/http"/*Controller.js; do
    if [ -f "$file" ]; then
      basename=$(basename "$file")
      controllerFile=$(echo "$basename" | sed 's/\([A-Z]\)/-\L\1/g' | sed 's/^-//')
      cp "$file" "src/modules/$MODULE_NAME/controller/$controllerFile"
      echo "  ✓ Copied $basename → controller/$controllerFile"
    fi
  done
  
  for file in "$OLD_PATH/infrastructure/http"/*Routes.js; do
    if [ -f "$file" ]; then
      basename=$(basename "$file")
      routesFile=$(echo "$basename" | sed 's/\([A-Z]\)/-\L\1/g' | sed 's/^-//')
      cp "$file" "src/modules/$MODULE_NAME/routes/$routesFile"
      echo "  ✓ Copied $basename → routes/$routesFile"
    fi
  done
fi

# Copy validation if exists
VALIDATION_FILE="src/common/validation/${MODULE_NAME}Validation.js"
if [ -f "$VALIDATION_FILE" ]; then
  cp "$VALIDATION_FILE" "src/modules/$MODULE_NAME/validation/${MODULE_NAME}.validation.js"
  echo "  ✓ Copied validation file"
fi

# Create cache placeholder
echo "📝 Creating cache placeholder..."
cat > "src/modules/$MODULE_NAME/cache/${MODULE_NAME}.cache.js" << EOF
/**
 * ${MODULE_CLASS} Cache
 * Placeholder for Redis-based caching layer
 * TODO: Implement caching logic when needed
 */

export class ${MODULE_CLASS}Cache {
  // Placeholder for future caching implementation
}
EOF

echo "✅ Module structure created. Next steps:"
echo ""
echo "1. Update imports in the copied files:"
echo "   - Model imports: '../model/name.model.js'"
echo "   - Repository imports: '../repository/name.repository.js'"
echo "   - Service imports: './serviceName.service.js'"
echo "   - Validation imports: '../validation/${MODULE_NAME}.validation.js'"
echo ""
echo "2. Create src/modules/$MODULE_NAME/index.js with module initialization"
echo ""
echo "3. Update src/bootstrap.js:"
echo "   import { initialize${MODULE_CLASS}Module } from '@/new-modules/$MODULE_NAME/index.js';"
echo ""
echo "4. Update src/api/v1/routes.js:"
echo "   import { create${MODULE_CLASS}Routes } from '@/new-modules/$MODULE_NAME/index.js';"
echo ""
echo "5. Test the migration:"
echo "   npm test"
echo "   npm run lint"
echo ""
echo "See docs/REFACTORING_GUIDE.md for detailed instructions."
