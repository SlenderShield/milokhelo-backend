/**
 * Express Application Factory
 * Creates and configures the Express application
 */
import express from 'express';
import {
  requestLogger,
  errorHandler,
  notFoundHandler,
  configureHelmet,
  configureCORS,
  configureRateLimit,
} from './infrastructure/middlewares/index.js';
import { createHealthRoutes } from './infrastructure/health/index.js';

async function createApp(config, logger, container) {
  const app = express();

  // Security middleware - must be first
  app.use(configureHelmet());
  app.use(configureCORS(config));
  
  // Rate limiting
  if (config.get('security.enableRateLimit') !== false) {
    app.use(configureRateLimit(config));
  }

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging middleware
  app.use(requestLogger(logger));

  // Health check routes
  if (config.get('features.enableHealthCheck')) {
    app.use('/health', createHealthRoutes(container));
  }

  // API routes will be mounted here
  const apiRouter = express.Router();

  // Example module routes
  const { createExampleRoutes } = await import('./modules/example/index.js');
  const exampleController = container.resolve('exampleController');
  apiRouter.use('/examples', createExampleRoutes(exampleController));

  // Mount API router
  app.use(config.get('app.apiPrefix'), apiRouter);

  // 404 handler
  app.use(notFoundHandler());

  // Error handling middleware
  app.use(errorHandler(logger, config));

  return app;
}

export default createApp;
