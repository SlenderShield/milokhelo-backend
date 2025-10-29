/**
 * API v1 Routes
 * Central routing configuration for API version 1
 */
import express from 'express';
import { createExampleRoutes } from './modules/example/index.js';

/**
 * Create API v1 router with all module routes
 * @param {Object} container - Dependency injection container
 * @returns {express.Router} Configured router
 */
export function createV1Router(container) {
  const router = express.Router();

  // Example module routes
  const exampleController = container.resolve('exampleController');
  router.use('/examples', createExampleRoutes(exampleController));

  // Add more module routes here as they are developed
  // router.use('/users', createUserRoutes(container.resolve('userController')));
  // router.use('/auth', createAuthRoutes(container.resolve('authController')));

  return router;
}
