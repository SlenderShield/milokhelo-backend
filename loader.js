/**
 * Custom ES Module Loader for Path Aliasing
 * Resolves path aliases defined in jsconfig.json
 */
import { fileURLToPath } from 'url';
import { dirname, resolve as pathResolve } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define path aliases
const aliases = {
  '@/core': pathResolve(__dirname, 'src/core'),
  '@/api': pathResolve(__dirname, 'src/api'),
  '@/common': pathResolve(__dirname, 'src/common'),
  '@/config': pathResolve(__dirname, 'src/core/config'),
  '@/modules': pathResolve(__dirname, 'src/modules'),
  '@/new-modules': pathResolve(__dirname, 'src/modules'),
  '@/test': pathResolve(__dirname, 'test'),
};

/**
 * Resolve hook for ES modules
 */
export async function resolve(specifier, context, nextResolve) {
  // Check if specifier uses an alias
  for (const [alias, aliasPath] of Object.entries(aliases)) {
    if (specifier.startsWith(alias)) {
      const remainingPath = specifier.slice(alias.length);
      let resolvedPath = aliasPath + remainingPath;

      // Try to resolve with .js extension if not present
      if (!resolvedPath.endsWith('.js') && !resolvedPath.endsWith('/')) {
        if (existsSync(resolvedPath + '.js')) {
          resolvedPath += '.js';
        } else if (existsSync(resolvedPath + '/index.js')) {
          resolvedPath += '/index.js';
        }
      }

      // Convert to file URL
      const fileUrl = new URL(`file://${resolvedPath}`).href;
      return nextResolve(fileUrl, context);
    }
  }

  // Default resolution
  return nextResolve(specifier, context);
}
