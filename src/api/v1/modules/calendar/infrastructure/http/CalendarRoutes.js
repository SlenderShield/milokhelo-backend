/**
 * Calendar Routes
 */
import express from 'express';
import { requireAuth } from '@/core/http/middlewares/index.js';
import { validate } from '@/core/http/middlewares/index.js';
import {
  createEventValidation,
  syncEventsValidation,
  getEventsValidation,
} from '@/common/validation/index.js';

export function createCalendarRoutes(controller) {
  const router = express.Router();

  // All calendar routes require authentication
  router.use(requireAuth());

  // Event management
  router.get('/events', validate(getEventsValidation), controller.getEvents());
  router.post('/events', validate(createEventValidation), controller.createEvent());
  
  // Device sync (legacy)
  router.post('/sync', validate(syncEventsValidation), controller.syncEvents());

  // Google Calendar integration
  router.get('/google/auth', controller.getGoogleCalendarAuthUrl());
  router.get('/google/callback', controller.handleGoogleCalendarCallback());
  router.post('/google/sync', controller.syncWithGoogleCalendar());
  router.delete('/google/disconnect', controller.disconnectGoogleCalendar());

  return router;
}
