/**
 * Configuration Validator
 * Validates required environment variables at startup (fail-fast)
 */

class ConfigValidator {
  constructor(config) {
    this.config = config;
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Validate all required configuration
   */
  validate() {
    this.validateApp();
    this.validateDatabase();
    this.validateRedis();
    this.validateAuth();
    this.validateOAuth();
    this.validateNotifications();

    if (this.errors.length > 0) {
      console.error('❌ Configuration validation failed:');
      this.errors.forEach((error) => console.error(`  - ${error}`));
      throw new Error(
        `Configuration validation failed with ${this.errors.length} error(s). Please check your environment variables.`
      );
    }

    if (this.warnings.length > 0) {
      console.warn('⚠️  Configuration warnings:');
      this.warnings.forEach((warning) => console.warn(`  - ${warning}`));
    }

    console.log('✅ Configuration validation passed');
  }

  /**
   * Validate app configuration
   */
  validateApp() {
    this.validateRequired('app.name', 'APP_NAME or default');
    this.validateRequired('app.port', 'PORT');

    const env = this.config.get('app.env');
    if (!['development', 'test', 'production'].includes(env)) {
      this.errors.push(`Invalid NODE_ENV: ${env}. Must be development, test, or production.`);
    }
  }

  /**
   * Validate database configuration
   */
  validateDatabase() {
    const mongoUri = this.config.get('database.mongodb.uri');
    if (!mongoUri) {
      this.errors.push('MONGODB_URI is required');
    } else if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
      this.errors.push('MONGODB_URI must start with mongodb:// or mongodb+srv://');
    }
  }

  /**
   * Validate Redis configuration
   */
  validateRedis() {
    this.validateRequired('redis.host', 'REDIS_HOST');
    const port = this.config.get('redis.port');
    if (port && (isNaN(port) || port < 1 || port > 65535)) {
      this.errors.push(`Invalid REDIS_PORT: ${port}. Must be between 1 and 65535.`);
    }
  }

  /**
   * Validate authentication configuration
   */
  validateAuth() {
    const jwtSecret = this.config.get('auth.jwt.secret');
    const sessionSecret = this.config.get('session.secret');

    if (!jwtSecret) {
      this.errors.push('JWT_SECRET is required for authentication');
    } else if (jwtSecret.length < 32) {
      this.warnings.push('JWT_SECRET should be at least 32 characters for security');
    }

    if (!sessionSecret) {
      this.errors.push('SESSION_SECRET is required for session management');
    } else if (sessionSecret.length < 32) {
      this.warnings.push('SESSION_SECRET should be at least 32 characters for security');
    }
  }

  /**
   * Validate OAuth configuration
   */
  validateOAuth() {
    const env = this.config.get('app.env');

    // OAuth is optional, but if configured, must be valid
    const googleClientId = this.config.get('auth.oauth.google.clientId');
    const googleClientSecret = this.config.get('auth.oauth.google.clientSecret');
    const facebookAppId = this.config.get('auth.oauth.facebook.appId');
    const facebookAppSecret = this.config.get('auth.oauth.facebook.appSecret');

    if (googleClientId && !googleClientSecret) {
      this.warnings.push('GOOGLE_CLIENT_ID is set but GOOGLE_CLIENT_SECRET is missing');
    }

    if (facebookAppId && !facebookAppSecret) {
      this.warnings.push('FACEBOOK_APP_ID is set but FACEBOOK_APP_SECRET is missing');
    }

    if (env === 'production') {
      const callbackUrl = this.config.get('auth.oauth.callbackUrl');
      if (callbackUrl && callbackUrl.includes('localhost')) {
        this.warnings.push('OAuth callback URL contains localhost in production');
      }
    }
  }

  /**
   * Validate notification configuration
   */
  validateNotifications() {
    // FCM and APNS are optional
    const fcmServerKey = this.config.get('firebase.serverKey');
    const apnKeyPath = this.config.get('apn.keyPath');

    if (fcmServerKey && !apnKeyPath) {
      this.warnings.push('FCM configured but APNS is not (iOS notifications unavailable)');
    }

    if (!fcmServerKey && apnKeyPath) {
      this.warnings.push('APNS configured but FCM is not (Android notifications unavailable)');
    }
  }

  /**
   * Validate that a required config key exists
   */
  validateRequired(key, envVar) {
    const value = this.config.get(key);
    if (value === undefined || value === null || value === '') {
      this.errors.push(`${envVar} is required but not set`);
    }
  }
}

export default ConfigValidator;
