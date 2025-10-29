/**
 * Configuration Module
 * Entry point for configuration management
 */
const ConfigLoader = require('./configLoader');

// Singleton instance
let configInstance = null;

function getConfig() {
  if (!configInstance) {
    configInstance = new ConfigLoader();
  }
  return configInstance;
}

module.exports = { ConfigLoader, getConfig };
