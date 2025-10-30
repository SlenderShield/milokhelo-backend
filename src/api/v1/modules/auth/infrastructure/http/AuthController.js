/**
 * Auth Controller - Infrastructure Layer
 * Handles HTTP requests for authentication
 */
import { asyncHandler, HTTP_STATUS } from '@/core/http/index.js';

class AuthController {
  constructor(authService, logger, passport = null) {
    this.authService = authService;
    this.logger = logger.child({ context: 'AuthController' });
    this.passport = passport;
  }

  /**
   * Set passport instance (for dependency injection after construction)
   */
  setPassport(passport) {
    this.passport = passport;
  }

  /**
   * GET /auth/providers - List supported OAuth providers
   */
  getProviders() {
    return asyncHandler(async (_req, res) => {
      const providers = [
        {
          name: 'google',
          displayName: 'Google',
          authorizationUrl: '/api/v1/auth/oauth/google',
        },
        {
          name: 'facebook',
          displayName: 'Facebook',
          authorizationUrl: '/api/v1/auth/oauth/facebook',
        },
      ];

      res.status(HTTP_STATUS.OK).json(providers);
    });
  }

  /**
   * GET /auth/oauth/google - Initiate Google OAuth
   */
  initiateGoogleOAuth() {
    if (!this.passport) {
      return asyncHandler(async (_req, res) => {
        res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
          error: 'OAuth not configured',
        });
      });
    }

    return this.passport.authenticate('google', {
      scope: ['profile', 'email'],
    });
  }

  /**
   * GET /auth/oauth/facebook - Initiate Facebook OAuth
   */
  initiateFacebookOAuth() {
    if (!this.passport) {
      return asyncHandler(async (_req, res) => {
        res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
          error: 'OAuth not configured',
        });
      });
    }

    return this.passport.authenticate('facebook', {
      scope: ['email', 'public_profile'],
    });
  }

  /**
   * GET /auth/oauth/callback/google - Google OAuth callback
   */
  handleGoogleCallback() {
    if (!this.passport) {
      return asyncHandler(async (_req, res) => {
        res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
          error: 'OAuth not configured',
        });
      });
    }

    return [
      this.passport.authenticate('google', {
        failureRedirect: '/login?error=oauth_failed',
        session: true,
      }),
      asyncHandler(async (req, res) => {
        // User is now in req.user thanks to passport
        const user = req.user;

        // Set session
        req.session.userId = user.id;

        // Redirect to frontend
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(
          `${frontendUrl}/auth/success?user=${encodeURIComponent(JSON.stringify(user))}`
        );
      }),
    ];
  }

  /**
   * GET /auth/oauth/callback/facebook - Facebook OAuth callback
   */
  handleFacebookCallback() {
    if (!this.passport) {
      return asyncHandler(async (_req, res) => {
        res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
          error: 'OAuth not configured',
        });
      });
    }

    return [
      this.passport.authenticate('facebook', {
        failureRedirect: '/login?error=oauth_failed',
        session: true,
      }),
      asyncHandler(async (req, res) => {
        // User is now in req.user thanks to passport
        const user = req.user;

        // Set session
        req.session.userId = user.id;

        // Redirect to frontend
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(
          `${frontendUrl}/auth/success?user=${encodeURIComponent(JSON.stringify(user))}`
        );
      }),
    ];
  }

  /**
   * GET /auth/session - Validate/refresh session
   */
  getSession() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;

      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'No active session',
        });
      }

      const user = await this.authService.getUserById(userId);

      res.status(HTTP_STATUS.OK).json(user);
    });
  }

  /**
   * POST /auth/logout - Logout user
   */
  logout() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;

      if (userId) {
        await this.authService.logout(userId);
      }

      req.session.destroy((err) => {
        if (err) {
          this.logger.error('Session destroy error', { error: err.message });
        }
      });

      res.status(HTTP_STATUS.NO_CONTENT).send();
    });
  }

  /**
   * POST /auth/register - Register with email/password
   */
  register() {
    return asyncHandler(async (req, res) => {
      const { name, email, password, username, firstName, lastName } = req.body;

      const user = await this.authService.register({
        name,
        email,
        password,
        username,
        firstName,
        lastName,
      });

      // Generate tokens
      const accessToken = this.authService.generateToken(user);
      const refreshTokenData = this.authService.generateRefreshToken(user, {
        userAgent: req.headers['user-agent'],
        ip: req.ip,
      });

      // Store refresh token
      await this.authService.authRepository.storeRefreshToken(
        refreshTokenData.userId,
        refreshTokenData.token,
        refreshTokenData.expiresAt,
        refreshTokenData.deviceInfo
      );

      // Set session
      req.session.userId = user.id;

      res.status(HTTP_STATUS.CREATED).json({
        user,
        accessToken,
        refreshToken: refreshTokenData.token,
        message: 'Registration successful. Please check your email to verify your account.',
      });
    });
  }

  /**
   * POST /auth/login - Login with email/password
   */
  login() {
    return asyncHandler(async (req, res) => {
      const { email, password } = req.body;

      const user = await this.authService.login(email, password);

      // Generate tokens
      const accessToken = this.authService.generateToken(user);
      const refreshTokenData = this.authService.generateRefreshToken(user, {
        userAgent: req.headers['user-agent'],
        ip: req.ip,
      });

      // Store refresh token
      await this.authService.authRepository.storeRefreshToken(
        refreshTokenData.userId,
        refreshTokenData.token,
        refreshTokenData.expiresAt,
        refreshTokenData.deviceInfo
      );

      // Set session
      req.session.userId = user.id;

      res.status(HTTP_STATUS.OK).json({
        user,
        accessToken,
        refreshToken: refreshTokenData.token,
      });
    });
  }

  /**
   * POST /auth/verify-email/:token - Verify email with token
   */
  verifyEmail() {
    return asyncHandler(async (req, res) => {
      const { token } = req.params;

      const user = await this.authService.verifyEmail(token);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Email verified successfully',
        user,
      });
    });
  }

  /**
   * POST /auth/resend-verification - Resend verification email
   */
  resendVerification() {
    return asyncHandler(async (req, res) => {
      const { email } = req.body;

      await this.authService.resendVerificationEmail(email);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Verification email sent',
      });
    });
  }

  /**
   * POST /auth/forgot-password - Initiate password reset
   */
  forgotPassword() {
    return asyncHandler(async (req, res) => {
      const { email } = req.body;

      await this.authService.forgotPassword(email);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'If the email exists, a password reset link has been sent',
      });
    });
  }

  /**
   * GET /auth/validate-reset-token/:token - Validate reset token
   */
  validateResetToken() {
    return asyncHandler(async (req, res) => {
      const { token } = req.params;

      const result = await this.authService.validateResetToken(token);

      res.status(HTTP_STATUS.OK).json(result);
    });
  }

  /**
   * POST /auth/reset-password/:token - Reset password with token
   */
  resetPassword() {
    return asyncHandler(async (req, res) => {
      const { token } = req.params;
      const { password } = req.body;

      const user = await this.authService.resetPassword(token, password);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Password reset successfully',
        user,
      });
    });
  }

  /**
   * POST /auth/refresh-token - Refresh access token
   */
  refreshToken() {
    return asyncHandler(async (req, res) => {
      const { refreshToken } = req.body;

      const result = await this.authService.refreshAccessToken(refreshToken);

      res.status(HTTP_STATUS.OK).json(result);
    });
  }

  /**
   * PUT /auth/change-password - Change password for authenticated user
   */
  changePassword() {
    return asyncHandler(async (req, res) => {
      // JWT auth takes precedence
      const userId = req.user?.id || req.session?.userId;

      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: 'Authentication required',
        });
      }

      const { currentPassword, newPassword } = req.body;

      await this.authService.changePassword(userId, currentPassword, newPassword);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Password changed successfully',
      });
    });
  }

  /**
   * DELETE /auth/deactivate - Deactivate user account
   */
  deactivateAccount() {
    return asyncHandler(async (req, res) => {
      // JWT auth takes precedence
      const userId = req.user?.id || req.session?.userId;

      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: 'Authentication required',
        });
      }

      await this.authService.deactivateAccount(userId);

      // Destroy session if exists
      if (req.session) {
        req.session.destroy((err) => {
          if (err) {
            this.logger.error('Session destroy error', { error: err.message });
          }
        });
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Account deactivated successfully',
      });
    });
  }

  /**
   * GET /auth/me - Get current authenticated user
   */
  getCurrentUser() {
    return asyncHandler(async (req, res) => {
      // JWT auth takes precedence
      const userId = req.user?.id || req.session?.userId;

      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: 'Authentication required',
        });
      }

      const user = await this.authService.getUserById(userId);

      res.status(HTTP_STATUS.OK).json(user);
    });
  }
}

export default AuthController;
