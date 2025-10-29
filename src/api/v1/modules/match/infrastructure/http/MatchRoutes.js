/**
 * Match Routes
 */
import express from 'express';

export function createMatchRoutes(matchController) {
  const router = express.Router();

  router.post('/', matchController.create());
  router.get('/', matchController.list());
  router.get('/:id', matchController.getById());
  router.patch('/:id', matchController.update());
  router.delete('/:id', matchController.cancel());
  router.post('/:id/join', matchController.join());
  router.post('/:id/leave', matchController.leave());
  router.post('/:id/start', matchController.start());
  router.post('/:id/finish', matchController.finish());

  return router;
}
