/**
 * Server Entry Point
 * Starts the HTTP server with WebSocket support
 */
import { createServer } from 'http';
import { bootstrap, shutdown } from './bootstrap.js';
import createApp from './app.js';
import { setupWebSocket } from './core/websocket/index.js';

async function startServer() {
  try {
    // Bootstrap the application
    const { config, logger, container, dbConnection, eventBus } = await bootstrap();

    // Create Express app
    const app = await createApp(config, logger, container);

    // Create HTTP server
    const httpServer = createServer(app);

    // Setup WebSocket/Socket.IO
    const io = setupWebSocket(httpServer, config, logger, container);

    // Start HTTP server
    httpServer.listen(config.get('app.port'), config.get('app.host'), () => {
      logger.info('Server started successfully', {
        host: config.get('app.host'),
        port: config.get('app.port'),
        environment: config.env,
        apiPrefix: config.get('app.apiPrefix'),
      });
      console.log(
        `✅ Server running at http://${config.get('app.host')}:${config.get('app.port')}`
      );
      console.log(
        `📋 API available at http://${config.get('app.host')}:${config.get('app.port')}${config.get('app.apiPrefix')}`
      );
      console.log(
        `📖 API Docs available at http://${config.get('app.host')}:${config.get('app.port')}/docs`
      );
      console.log(
        `🔌 WebSocket available at ws://${config.get('app.host')}:${config.get('app.port')}`
      );
    });

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal) => {
      logger.info(`Received ${signal}, starting graceful shutdown`);

      // Close WebSocket connections
      io.close(() => {
        logger.info('WebSocket server closed');
      });

      // Stop accepting new connections
      httpServer.close(async () => {
        logger.info('HTTP server closed');

        // Shutdown application
        await shutdown({ logger, dbConnection, eventBus });

        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', { reason, promise });
      gracefulShutdown('unhandledRejection');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
