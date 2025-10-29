/**
 * Express Application Factory
 * Creates and configures the Express application
 */
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yaml';
import {
  requestLogger,
  errorHandler,
  notFoundHandler,
  configureHelmet,
  configureCORS,
  configureRateLimit,
} from './core/http/index.js';
import { createHealthRoutes } from './core/http/index.js';
import { createV1Router } from './api/v1/routes.js';
import { createSessionMiddleware } from './core/http/middlewares/sessionMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function createApp(config, logger, container) {
  const app = express();

  // Security middleware - must be first
  app.use(configureHelmet());
  app.use(configureCORS(config));

  // Session middleware (for cookie-based auth) - MUST be before passport
  app.use(createSessionMiddleware(config, logger));

  // Initialize Passport (if available)
  try {
    const passport = container.resolve('passport');
    app.use(passport.initialize());
    app.use(passport.session());
    logger.info('Passport authentication initialized');
    
    // Inject passport into auth controller
    const authController = container.resolve('authController');
    if (authController && typeof authController.setPassport === 'function') {
      authController.setPassport(passport);
    }
  } catch (error) {
    logger.warn('Passport not initialized', { error: error.message });
  }

  // Rate limiting
  if (config.get('security.enableRateLimit') !== false) {
    app.use(configureRateLimit(config));
  }

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging middleware
  app.use(requestLogger(logger));

  // Swagger UI Documentation
  try {
    const openapiPath = join(__dirname, '../docs/openapi.yaml');
    const openapiFile = readFileSync(openapiPath, 'utf8');
    const openapiDocument = YAML.parse(openapiFile);

    app.use(
      '/docs',
      swaggerUi.serve,
      swaggerUi.setup(openapiDocument, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Milokhelo API Documentation',
      })
    );
    logger.info('Swagger UI documentation available at /docs');
  } catch (error) {
    logger.warn('Could not load OpenAPI documentation', { error: error.message });
  }

  // Health check routes
  if (config.get('features.enableHealthCheck')) {
    app.use('/health', createHealthRoutes(container));
  }

  // API routes will be mounted here
  const apiRouter = createV1Router(container);

  // Mount API router
  app.use(config.get('app.apiPrefix'), apiRouter);

  // 404 handler
  app.use(notFoundHandler());

  // Error handling middleware
  app.use(errorHandler(logger, config));

  return app;
}

export default createApp;
