/**
 * Health Check Routes
 * Provides health check endpoints
 */
import express from 'express';
import {  HTTP_STATUS  } from '../../shared/constants.js';

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

  return router;
}

export default createHealthRoutes;