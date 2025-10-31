/**
 * Feedback Routes
 */
import express from 'express';

export function createFeedbackRoutes(controller) {
  const router = express.Router();
  router.post('/', controller.submitFeedback());
  router.get('/', controller.listFeedback());
  return router;
}
