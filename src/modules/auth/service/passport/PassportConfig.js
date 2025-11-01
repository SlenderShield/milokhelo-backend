/**
 * Passport Configuration
 * Configures Passport.js with OAuth strategies
 */
import passport from 'passport';
import GoogleStrategy from './strategies/GoogleStrategy.js';
import FacebookStrategy from './strategies/FacebookStrategy.js';

class PassportConfig {
  constructor(authService, logger, config) {
    this.authService = authService;
    this.logger = logger.child({ context: 'PassportConfig' });
    this.config = config;
  }

  /**
   * Initialize Passport with all configured strategies
   */
  initialize() {
    this.logger.info('Initializing Passport authentication');

    // Configure serialization
    this.configureSerializationStrategies();

    // Configure OAuth strategies
    this.configureOAuthStrategies();

    return passport;
  }

  /**
   * Configure user serialization for session support
   */
  configureSerializationStrategies() {
    // Serialize user to session
    passport.serializeUser((user, done) => {
      this.logger.debug('Serializing user', { userId: user.id });
      done(null, user.id);
    });

    // Deserialize user from session
    passport.deserializeUser(async (id, done) => {
      try {
        this.logger.debug('Deserializing user', { userId: id });
        const user = await this.authService.getUserById(id);
        done(null, user);
      } catch (error) {
        this.logger.error('Error deserializing user', { 
          userId: id, 
          error: error.message 
        });
        done(error, null);
      }
    });
  }

  /**
   * Configure OAuth strategies (Google, Facebook, etc.)
   */
  configureOAuthStrategies() {
    // Configure Google OAuth
    if (this.config.get('auth.googleClientId') && this.config.get('auth.googleClientSecret')) {
      const googleStrategy = new GoogleStrategy(
        this.authService,
        this.logger,
        this.config
      );
      googleStrategy.configure(passport);
      this.logger.info('Google OAuth strategy configured');
    } else {
      this.logger.warn('Google OAuth credentials not found - Google authentication disabled');
    }

    // Configure Facebook OAuth
    if (this.config.get('auth.facebookAppId') && this.config.get('auth.facebookAppSecret')) {
      const facebookStrategy = new FacebookStrategy(
        this.authService,
        this.logger,
        this.config
      );
      facebookStrategy.configure(passport);
      this.logger.info('Facebook OAuth strategy configured');
    } else {
      this.logger.warn('Facebook OAuth credentials not found - Facebook authentication disabled');
    }
  }

  /**
   * Get passport instance
   */
  getPassport() {
    return passport;
  }
}

export default PassportConfig;
