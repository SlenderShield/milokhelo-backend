/**
 * Invitation Routes
 */
import express from 'express';

export function createInvitationRoutes(controller) {
  const router = express.Router();
  router.post('/', controller.createInvitation());
  router.get('/', controller.getInvitations());
  router.post('/:id/respond', controller.respondToInvitation());
  return router;
}
