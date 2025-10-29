/**
 * Express Application Factory
 * Creates and configures the Express application
 */
const express = require('express');
const { requestLogger, errorHandler, notFoundHandler } = require('./infrastructure/middlewares');
const { createHealthRoutes } = require('./infrastructure/health');

function createApp(config, logger, container) {
  const app = express();

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
  const { createExampleRoutes } = require('./modules/example');
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

module.exports = createApp;
