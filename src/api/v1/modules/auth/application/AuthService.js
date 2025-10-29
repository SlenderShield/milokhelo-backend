/**
 * Auth Service - Application Layer
 * Business logic for authentication and authorization
 */
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

class AuthService {
  constructor(authRepository, eventBus, logger, config) {
    this.authRepository = authRepository;
    this.eventBus = eventBus;
    this.logger = logger.child({ context: 'AuthService' });
    this.config = config;
  }

  /**
   * Register a new user with email/password
   */
  async register(userData) {
    this.logger.info('Registering new user', { email: userData.email });

    // Check if user already exists
    const existingUser = await this.authRepository.findUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Create user
    const user = await this.authRepository.createUser({
      ...userData,
      password: hashedPassword,
      verified: false,
    });

    // Publish event
    await this.eventBus.publish('user.registered', {
      userId: user.id,
      email: user.email,
    });

    return this.sanitizeUser(user);
  }

  /**
   * Login with email/password
   */
  async login(email, password) {
    this.logger.info('User login attempt', { email });

    const user = await this.authRepository.findUserByEmail(email);
    if (!user || !user.password) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Publish event
    await this.eventBus.publish('user.logged_in', {
      userId: user.id,
      email: user.email,
    });

    return this.sanitizeUser(user);
  }

  /**
   * Handle OAuth callback and find/create user
   */
  async handleOAuthCallback(profile, provider) {
    this.logger.info('OAuth callback', { provider, profileId: profile.id });

    const user = await this.authRepository.findOrCreateOAuthUser(profile, provider);

    // Publish event
    await this.eventBus.publish('user.oauth_logged_in', {
      userId: user.id,
      provider,
    });

    return this.sanitizeUser(user);
  }

  /**
   * Get user by ID
   */
  async getUserById(userId) {
    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return this.sanitizeUser(user);
  }

  /**
   * Generate JWT token
   */
  generateToken(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      roles: user.roles || [],
    };

    return jwt.sign(payload, this.config.get('auth.jwtSecret'), {
      expiresIn: this.config.get('auth.jwtExpiration'),
    });
  }

  /**
   * Verify JWT token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, this.config.get('auth.jwtSecret'));
    } catch {
      throw new Error('Invalid token');
    }
  }

  /**
   * Remove sensitive data from user object
   */
  sanitizeUser(user) {
    const sanitized = { ...user };
    delete sanitized.password;
    delete sanitized.oauthTokens;
    return sanitized;
  }

  /**
   * Validate session (stub for session-based auth)
   */
  async validateSession(sessionId) {
    // TODO: Implement session validation with Redis
    this.logger.debug('Validating session', { sessionId });
    return { valid: true };
  }

  /**
   * Logout user
   */
  async logout(userId) {
    this.logger.info('User logout', { userId });

    // Publish event
    await this.eventBus.publish('user.logged_out', { userId });

    return { success: true };
  }
}

export default AuthService;
