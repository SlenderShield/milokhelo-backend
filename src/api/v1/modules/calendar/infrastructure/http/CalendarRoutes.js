/**
 * Calendar Routes
 */
import express from 'express';

export function createCalendarRoutes(controller) {
  const router = express.Router();
  router.get('/events', controller.getEvents());
  router.post('/events', controller.createEvent());
  router.post('/sync', controller.syncEvents());
  return router;
}
