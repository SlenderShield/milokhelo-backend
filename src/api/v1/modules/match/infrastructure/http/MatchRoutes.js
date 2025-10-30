/**
 * Match Routes
 */
import express from 'express';
import { requireAuth, validate } from '@/core/http/index.js';
import {
  updateScoreValidation,
  updateStatusValidation,
} from '@/common/validation/matchValidation.js';

export function createMatchRoutes(matchController) {
  const router = express.Router();

  // Public endpoints
  router.get('/', matchController.list());
  router.get('/:id', matchController.getById());

  // Protected endpoints - require authentication
  router.post('/', requireAuth(), matchController.create());
  router.patch('/:id', requireAuth(), matchController.update());

  // Delete endpoint - only organizer can delete their match (checked in service)
  router.delete('/:id', requireAuth(), matchController.cancel());

  // Match participation endpoints
  router.post('/:id/join', requireAuth(), matchController.join());
  router.post('/:id/leave', requireAuth(), matchController.leave());

  // Match management endpoints
  router.put(
    '/:id/score',
    requireAuth(),
    validate(updateScoreValidation),
    matchController.updateScore()
  );
  router.put(
    '/:id/status',
    requireAuth(),
    validate(updateStatusValidation),
    matchController.updateStatus()
  );

  // Legacy endpoints (kept for backward compatibility)
  router.post('/:id/start', requireAuth(), matchController.start());
  router.post('/:id/finish', requireAuth(), matchController.finish());

  return router;
}
