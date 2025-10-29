/**
 * Example Module Routes
 */
const express = require('express');

function createExampleRoutes(controller) {
  const router = express.Router();

  router.post('/', controller.create());
  router.get('/', controller.findAll());
  router.get('/:id', controller.findById());
  router.put('/:id', controller.update());
  router.delete('/:id', controller.delete());

  return router;
}

module.exports = createExampleRoutes;
