/**
 * Health Check Routes
 * Provides health check and metrics endpoints
 */
import express from 'express';
import { HTTP_STATUS } from '@/common/constants/index.js';

function createHealthRoutes(container) {
  const router = express.Router();

  // Main health check
  router.get('/', async (req, res) => {
    const dbHealthCheck = container.resolve('dbHealthCheck');

    const dbHealth = dbHealthCheck ? await dbHealthCheck.check() : { healthy: false };

    const health = {
      status: dbHealth.healthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: dbHealth.healthy ? 'connected' : 'disconnected',
    };

    const statusCode =
      health.database === 'connected' ? HTTP_STATUS.OK : HTTP_STATUS.SERVICE_UNAVAILABLE;

    res.status(statusCode).json(health);
  });

  // Database health check
  router.get('/database', async (req, res) => {
    const dbHealthCheck = container.resolve('dbHealthCheck');

    if (!dbHealthCheck) {
      return res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
        status: 'unavailable',
        message: 'Database health check not configured',
      });
    }

    const health = await dbHealthCheck.check();
    const statusCode = health.healthy ? HTTP_STATUS.OK : HTTP_STATUS.SERVICE_UNAVAILABLE;

    res.status(statusCode).json(health);
  });

  // Metrics endpoint (Prometheus format)
  router.get('/metrics', async (req, res) => {
    const metricsCollector = container.resolve('metricsCollector');

    if (!metricsCollector) {
      return res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
        status: 'unavailable',
        message: 'Metrics collector not configured',
      });
    }

    try {
      const metrics = await metricsCollector.getMetrics();
      res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
      res.send(metrics);
    } catch (error) {
      req.logger?.error('Failed to collect metrics', { error: error.message });
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to collect metrics',
      });
    }
  });

  return router;
}

export default createHealthRoutes;
