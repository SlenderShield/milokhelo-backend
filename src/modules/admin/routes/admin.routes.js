/**
 * Admin Routes
 */
import express from 'express';

export function createAdminRoutes(controller) {
  const router = express.Router();
  router.get('/reports', controller.getReports());
  return router;
}
