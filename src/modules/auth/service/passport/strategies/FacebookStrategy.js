/**
 * Facebook OAuth Strategy
 * Implements Facebook OAuth 2.0 authentication
 */
import { Strategy as FacebookOAuth2Strategy } from 'passport-facebook';

class FacebookStrategy {
  constructor(authService, logger, config) {
    this.authService = authService;
    this.logger = logger.child({ context: 'FacebookStrategy' });
    this.config = config;
  }

  /**
   * Configure Facebook OAuth strategy with Passport
   */
  configure(passport) {
    const clientID = this.config.get('auth.facebookAppId');
    const clientSecret = this.config.get('auth.facebookAppSecret');
    const callbackURL = `${this.config.get('auth.oauthCallbackUrl')}/facebook`;

    const strategyConfig = {
      clientID,
      clientSecret,
      callbackURL,
      profileFields: ['id', 'displayName', 'name', 'emails', 'photos'],
      passReqToCallback: true,
    };

    const verifyCallback = async (req, accessToken, refreshToken, profile, done) => {
      try {
        this.logger.info('Facebook OAuth callback', {
          profileId: profile.id,
          email: profile.emails?.[0]?.value,
        });

        // Handle OAuth callback through the service
        const user = await this.authService.handleOAuthCallback(profile, 'facebook');

        // Optionally store tokens (encrypted)
        if (refreshToken) {
          await this.storeRefreshToken(user.id, refreshToken);
        }

        return done(null, user);
      } catch (error) {
        this.logger.error('Facebook OAuth error', {
          error: error.message,
          stack: error.stack,
        });
        return done(error, null);
      }
    };

    passport.use('facebook', new FacebookOAuth2Strategy(strategyConfig, verifyCallback));
  }

  /**
   * Store encrypted refresh token for future use
   */
  async storeRefreshToken(userId, _refreshToken) {
    try {
      // TODO: Encrypt token before storing
      this.logger.debug('Storing Facebook refresh token', { userId });
      // Implementation would store encrypted token in database
    } catch (error) {
      this.logger.error('Error storing refresh token', {
        userId,
        error: error.message,
      });
    }
  }
}

export default FacebookStrategy;
