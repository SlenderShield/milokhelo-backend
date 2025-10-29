/**
 * HTTP Module - Core Infrastructure
 * Entry point for HTTP-related functionality including health checks and middlewares
 */
import createHealthRoutes from './healthRoutes.js';

export { createHealthRoutes };
export * from './middlewares/index.js';
