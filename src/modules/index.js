/**
 * Modules Auto-Loader
 * Automatically discovers and initializes all modules
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Auto-load and initialize all modules
 * @param {Object} container - DI container instance
 */
export async function loadModules(container) {
  const logger = container.resolve('logger');
  
  logger.info('Auto-loading modules...');
  
  const moduleDirs = fs
    .readdirSync(__dirname)
    .filter((file) => {
      const filePath = path.join(__dirname, file);
      return fs.statSync(filePath).isDirectory();
    });

  let initializedCount = 0;

  for (const dir of moduleDirs) {
    try {
      const modulePath = path.join(__dirname, dir, 'index.js');
      
      if (fs.existsSync(modulePath)) {
        const module = await import(`./${dir}/index.js`);
        
        // Find the initialize function (e.g., initializeUserModule, initializeAuthModule)
        const initFunctionName = Object.keys(module).find((key) =>
          key.startsWith('initialize') && key.endsWith('Module')
        );
        
        if (initFunctionName && typeof module[initFunctionName] === 'function') {
          module[initFunctionName](container);
          initializedCount++;
        } else {
          logger.warn(`No initialize function found for module: ${dir}`);
        }
      }
    } catch (error) {
      logger.error(`Failed to load module: ${dir}`, {
        error: error.message,
        stack: error.stack,
      });
    }
  }

  logger.info(`Auto-loaded ${initializedCount} modules`);
}
