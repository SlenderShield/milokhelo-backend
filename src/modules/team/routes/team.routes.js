/**
 * Team Routes
 */
import express from 'express';
import { requireAuth, validate } from '@/core/http/index.js';
import {
  createTeamValidation,
  updateTeamValidation,
  teamIdValidation,
  joinTeamValidation,
  leaveTeamValidation,
} from '@/common/validation/index.js';

export function createTeamRoutes(teamController) {
  const router = express.Router();

  // Public endpoints
  router.get('/', teamController.list());
  router.get('/:id', validate(teamIdValidation), teamController.getById());

  // Protected endpoints - require authentication
  router.post('/', requireAuth(), validate(createTeamValidation), teamController.create());

  // Update endpoint - captain or admin only (checked in service)
  router.put('/:id', requireAuth(), validate(updateTeamValidation), teamController.update());

  // Delete endpoint - captain or admin only (checked in service)
  router.delete('/:id', requireAuth(), validate(teamIdValidation), teamController.delete());

  // Team participation endpoints
  router.post('/:id/join', requireAuth(), validate(joinTeamValidation), teamController.join());
  router.post('/:id/leave', requireAuth(), validate(leaveTeamValidation), teamController.leave());

  return router;
}
