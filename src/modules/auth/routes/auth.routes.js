/**
 * Auth Routes
 * Defines HTTP routes for authentication
 */
import express from 'express';
import { validate } from '@/core/http/index.js';
import {
  registerValidation,
  loginValidation,
  emailValidation,
  resetPasswordValidation,
  changePasswordValidation,
  refreshTokenValidation,
} from '../validation/auth.validation.js';

export function createAuthRoutes(authController, jwtAuthMiddleware) {
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
  router.post('/register', validate(registerValidation), authController.register());
  router.post('/login', validate(loginValidation), authController.login());

  // Email verification
  router.post('/verify-email/:token', authController.verifyEmail());
  router.post(
    '/resend-verification',
    validate(emailValidation),
    authController.resendVerification()
  );

  // Password reset
  router.post('/forgot-password', validate(emailValidation), authController.forgotPassword());
  router.get('/validate-reset-token/:token', authController.validateResetToken());
  router.post(
    '/reset-password/:token',
    validate(resetPasswordValidation),
    authController.resetPassword()
  );

  // Token management
  router.post('/refresh-token', validate(refreshTokenValidation), authController.refreshToken());

  // Account management (requires JWT authentication)
  router.get('/me', jwtAuthMiddleware, authController.getCurrentUser());
  router.put(
    '/change-password',
    jwtAuthMiddleware,
    validate(changePasswordValidation),
    authController.changePassword()
  );
  router.delete('/deactivate', jwtAuthMiddleware, authController.deactivateAccount());

  return router;
}
