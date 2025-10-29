/**
 * Auth Routes
 * Defines HTTP routes for authentication
 */
import express from 'express';

export function createAuthRoutes(authController) {
  const router = express.Router();

  // OAuth providers list
  router.get('/providers', authController.getProviders());

  // Google OAuth flow
  router.get('/oauth/google', authController.initiateGoogleOAuth());
  const googleCallback = authController.handleGoogleCallback();
  if (Array.isArray(googleCallback)) {
    router.get('/oauth/callback/google', ...googleCallback);
  } else {
    router.get('/oauth/callback/google', googleCallback);
  }

  // Facebook OAuth flow
  router.get('/oauth/facebook', authController.initiateFacebookOAuth());
  const facebookCallback = authController.handleFacebookCallback();
  if (Array.isArray(facebookCallback)) {
    router.get('/oauth/callback/facebook', ...facebookCallback);
  } else {
    router.get('/oauth/callback/facebook', facebookCallback);
  }

  // Session management
  router.get('/session', authController.getSession());
  router.post('/logout', authController.logout());

  // Email/password auth
  router.post('/register', authController.register());
  router.post('/login', authController.login());

  return router;
}
