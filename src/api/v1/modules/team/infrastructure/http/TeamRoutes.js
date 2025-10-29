/**
 * Team Routes
 */
import express from 'express';

export function createTeamRoutes(teamController) {
  const router = express.Router();

  router.post('/', teamController.create());
  router.get('/', teamController.list());
  router.get('/:id', teamController.getById());
  router.patch('/:id', teamController.update());
  router.delete('/:id', teamController.delete());
  router.post('/:id/join', teamController.join());
  router.post('/:id/leave', teamController.leave());

  return router;
}
