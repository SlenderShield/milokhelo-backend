/**
 * HTTP Module - Core Infrastructure
 * Entry point for HTTP-related functionality including health checks and middlewares
 */
import createHealthRoutes from './healthRoutes.js';
import { HTTP_STATUS } from '../../common/constants/index.js';

export { createHealthRoutes, HTTP_STATUS };
export * from './middlewares/index.js';
