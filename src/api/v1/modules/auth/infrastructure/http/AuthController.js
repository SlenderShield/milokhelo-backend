/**
 * Auth Controller - Infrastructure Layer
 * Handles HTTP requests for authentication
 */
import { asyncHandler } from '../../../../../../common/utils/index.js';
import { HTTP_STATUS } from '../../../../../../common/constants/index.js';

class AuthController {
  constructor(authService, logger) {
    this.authService = authService;
    this.logger = logger.child({ context: 'AuthController' });
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
          authorizationUrl: '/api/v1/auth/oauth/url?provider=google',
        },
        {
          name: 'facebook',
          displayName: 'Facebook',
          authorizationUrl: '/api/v1/auth/oauth/url?provider=facebook',
        },
      ];

      res.status(HTTP_STATUS.OK).json(providers);
    });
  }

  /**
   * GET /auth/oauth/url - Get OAuth authorization URL
   */
  getOAuthUrl() {
    return asyncHandler(async (req, res) => {
      const { provider } = req.query;

      // TODO: Generate actual OAuth URL with passport
      const url = `https://oauth.${provider}.com/authorize?redirect_uri=${encodeURIComponent(
        process.env.OAUTH_REDIRECT_URI || 'http://localhost:4000/api/v1/auth/oauth/callback'
      )}`;

      res.status(HTTP_STATUS.OK).json({ url });
    });
  }

  /**
   * GET /auth/oauth/callback - OAuth callback handler
   */
  handleOAuthCallback() {
    return asyncHandler(async (req, res) => {
      // In real implementation, passport middleware would handle this
      // and attach user to req.user
      const user = req.user;

      if (!user) {
        return res.redirect('/login?error=oauth_failed');
      }

      // Set session
      req.session.userId = user.id;

      // Redirect to frontend
      res.redirect(process.env.FRONTEND_URL || 'http://localhost:3000');
    });
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
