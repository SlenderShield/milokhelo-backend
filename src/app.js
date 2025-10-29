/**
 * Express Application Factory
 * Creates and configures the Express application
 */
const express = require('express');
const { HTTP_STATUS, ERROR_CODES } = require('../shared/constants');

function createApp(config, logger, container) {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging middleware
  app.use((req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info('HTTP Request', {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
      });
    });

    next();
  });

  // Health check endpoint
  if (config.features.enableHealthCheck) {
    app.get('/health', (req, res) => {
      const dbManager = container.resolve('dbManager');

      const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: dbManager.isHealthy() ? 'connected' : 'disconnected',
      };

      const statusCode =
        health.database === 'connected' ? HTTP_STATUS.OK : HTTP_STATUS.SERVICE_UNAVAILABLE;

      res.status(statusCode).json(health);
    });
  }

  // API routes will be mounted here
  const apiRouter = express.Router();

  // Example module routes
  const { createExampleRoutes } = require('../modules/example');
  const exampleController = container.resolve('exampleController');
  apiRouter.use('/examples', createExampleRoutes(exampleController));

  // Mount API router
  app.use(config.app.apiPrefix, apiRouter);

  // 404 handler
  app.use((req, res) => {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      error: {
        code: ERROR_CODES.NOT_FOUND,
        message: 'Route not found',
      },
    });
  });

  // Error handling middleware
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    logger.error('Unhandled error', {
      error: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
    });

    const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const errorCode = err.code || ERROR_CODES.INTERNAL_ERROR;

    res.status(statusCode).json({
      success: false,
      error: {
        code: errorCode,
        message: config.isProduction() ? 'Internal server error' : err.message,
        ...(config.isDevelopment() && { stack: err.stack }),
      },
    });
  });

  return app;
}

module.exports = createApp;
