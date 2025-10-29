/**
 * Maps Routes
 */
import express from 'express';

export function createMapsRoutes(controller) {
  const router = express.Router();
  router.get('/nearby', controller.getNearby());
  router.post('/submit', controller.submitLocation());
  router.get('/:entityType/:entityId', controller.getLocation());
  return router;
}
