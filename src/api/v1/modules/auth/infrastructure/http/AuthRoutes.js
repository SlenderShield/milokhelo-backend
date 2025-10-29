/**
 * Auth Routes
 * Defines HTTP routes for authentication
 */
import express from 'express';

export function createAuthRoutes(authController) {
  const router = express.Router();

  // OAuth providers
  router.get('/providers', authController.getProviders());
  router.get('/oauth/url', authController.getOAuthUrl());
  router.get('/oauth/callback', authController.handleOAuthCallback());

  // Session management
  router.get('/session', authController.getSession());
  router.post('/logout', authController.logout());

  // Email/password auth
  router.post('/register', authController.register());
  router.post('/login', authController.login());

  return router;
}
