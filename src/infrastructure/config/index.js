/**
 * Configuration Module
 * Entry point for configuration management
 */
import ConfigLoader from './configLoader.js';

// Singleton instance
let configInstance = null;

async function getConfig() {
  if (!configInstance) {
    configInstance = new ConfigLoader();
    await configInstance.initialize();
  }
  return configInstance;
}

export { ConfigLoader, getConfig };
