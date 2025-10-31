/**
 * Google OAuth Strategy
 * Implements Google OAuth 2.0 authentication
 */
import { Strategy as GoogleOAuth20Strategy } from 'passport-google-oauth20';

class GoogleStrategy {
  constructor(authService, logger, config) {
    this.authService = authService;
    this.logger = logger.child({ context: 'GoogleStrategy' });
    this.config = config;
  }

  /**
   * Configure Google OAuth strategy with Passport
   */
  configure(passport) {
    const clientID = this.config.get('auth.googleClientId');
    const clientSecret = this.config.get('auth.googleClientSecret');
    const callbackURL = `${this.config.get('auth.oauthCallbackUrl')}/google`;

    const strategyConfig = {
      clientID,
      clientSecret,
      callbackURL,
      scope: ['profile', 'email'],
      passReqToCallback: true,
    };

    const verifyCallback = async (req, accessToken, refreshToken, profile, done) => {
      try {
        this.logger.info('Google OAuth callback', {
          profileId: profile.id,
          email: profile.emails?.[0]?.value,
        });

        // Handle OAuth callback through the service
        const user = await this.authService.handleOAuthCallback(profile, 'google');

        // Optionally store tokens (encrypted)
        if (refreshToken) {
          await this.storeRefreshToken(user.id, refreshToken);
        }

        return done(null, user);
      } catch (error) {
        this.logger.error('Google OAuth error', {
          error: error.message,
          stack: error.stack,
        });
        return done(error, null);
      }
    };

    passport.use('google', new GoogleOAuth20Strategy(strategyConfig, verifyCallback));
  }

  /**
   * Store encrypted refresh token for future use
   */
  async storeRefreshToken(userId, _refreshToken) {
    try {
      // TODO: Encrypt token before storing
      this.logger.debug('Storing Google refresh token', { userId });
      // Implementation would store encrypted token in database
    } catch (error) {
      this.logger.error('Error storing refresh token', {
        userId,
        error: error.message,
      });
    }
  }
}

export default GoogleStrategy;
