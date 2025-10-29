/**
 * Logging Module
 * Entry point for centralized logging system
 */
import { Logger, createLogger, getLogger } from './logger.js';
import { 
  getLoggingConfig, 
  redactSensitiveInfo, 
  getLogLevelForStatus,
  LOG_LEVELS,
  LOG_FORMATS,
} from './config.js';
import {
  formatError,
  formatDatabaseQuery,
  formatApiCall,
  formatEvent,
  formatAuditLog,
  formatSecurityEvent,
  createCorrelationContext,
  measureOperation,
  createPerformanceSummary,
} from './utils.js';

export { 
  // Core logger
  Logger, 
  createLogger, 
  getLogger,
  // Configuration
  getLoggingConfig,
  redactSensitiveInfo,
  getLogLevelForStatus,
  LOG_LEVELS,
  LOG_FORMATS,
  // Utilities
  formatError,
  formatDatabaseQuery,
  formatApiCall,
  formatEvent,
  formatAuditLog,
  formatSecurityEvent,
  createCorrelationContext,
  measureOperation,
  createPerformanceSummary,
};
