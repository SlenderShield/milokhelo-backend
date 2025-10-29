/**
 * Auth Controller - Infrastructure Layer
 * Handles HTTP requests for authentication
 */
import { asyncHandler } from '../../../../../../common/utils/index.js';
import { HTTP_STATUS } from '../../../../../../common/constants/index.js';

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
        res.redirect(`${frontendUrl}/auth/success?user=${encodeURIComponent(JSON.stringify(user))}`);
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
        res.redirect(`${frontendUrl}/auth/success?user=${encodeURIComponent(JSON.stringify(user))}`);
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
      const { name, email, password } = req.body;

      const user = await this.authService.register({ name, email, password });

      // Set session
      req.session.userId = user.id;

      res.status(HTTP_STATUS.CREATED).json(user);
    });
  }

  /**
   * POST /auth/login - Login with email/password
   */
  login() {
    return asyncHandler(async (req, res) => {
      const { email, password } = req.body;

      const user = await this.authService.login(email, password);

      // Set session
      req.session.userId = user.id;

      res.status(HTTP_STATUS.OK).json(user);
    });
  }
}

export default AuthController;
