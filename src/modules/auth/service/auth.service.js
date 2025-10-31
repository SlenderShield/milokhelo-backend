/**
 * Auth Service - Application Layer
 * Business logic for authentication and authorization
 */
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

class AuthService {
  constructor(authRepository, eventBus, logger, config, emailService) {
    this.authRepository = authRepository;
    this.eventBus = eventBus;
    this.logger = logger.child({ context: 'AuthService' });
    this.config = config;
    this.emailService = emailService;
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

    // Send verification email
    await this.sendVerificationEmail(user.id, user.email, user.name);

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
   * Generate JWT access token
   */
  generateToken(user) {
    const payload = {
      userId: user.id || user._id?.toString(),
      email: user.email,
      roles: user.roles || ['user'],
    };

    return jwt.sign(payload, this.config.get('auth.jwtSecret'), {
      expiresIn: this.config.get('auth.jwtExpiration') || '7d',
    });
  }

  /**
   * Verify JWT token
   */
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.config.get('auth.jwtSecret'));

      // Return user info in consistent format
      return {
        userId: decoded.userId,
        email: decoded.email,
        roles: decoded.roles || ['user'],
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      }
      throw new Error('Token verification failed');
    }
  }

  /**
   * Remove sensitive data from user object
   */
  sanitizeUser(user) {
    if (!user) return null;

    // Convert Mongoose document to plain object if needed
    const userObj = user.toObject ? user.toObject({ virtuals: true }) : { ...user };

    // Extract the ID safely
    const userId = (userObj._id ?? userObj.id)?.toString();

    // Assign normalized id
    if (userId) {
      userObj.id = userId;
    }

    // Log before deleting _id
    this.logger.debug('Sanitizing user object', { userId });

    // Remove Mongo-specific and sensitive fields
    delete userObj._id;
    delete userObj.password;
    delete userObj.oauthTokens;
    delete userObj.__v;

    return userObj;
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

  /**
   * Generate email verification token and send email
   */
  async sendVerificationEmail(userId, email, name) {
    this.logger.info('Sending verification email', { userId, email });

    // Generate token
    const token = this.generateRandomToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store token
    await this.authRepository.createEmailVerificationToken(userId, email, token, expiresAt);

    // Send email
    await this.emailService.sendVerificationEmail(email, name, token);

    return { success: true };
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token) {
    this.logger.info('Verifying email', { token: token.substring(0, 10) + '...' });

    // Find token
    const tokenDoc = await this.authRepository.findEmailVerificationToken(token);
    if (!tokenDoc) {
      throw new Error('Invalid or expired verification token');
    }

    // Check expiration
    if (new Date() > new Date(tokenDoc.expiresAt)) {
      throw new Error('Verification token has expired');
    }

    // Verify user
    const user = await this.authRepository.verifyUserEmail(tokenDoc.userId);

    // Mark token as used
    await this.authRepository.markEmailVerificationTokenUsed(token);

    // Publish event
    await this.eventBus.publish('user.email_verified', {
      userId: user.id,
      email: user.email,
    });

    return this.sanitizeUser(user);
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email) {
    this.logger.info('Resending verification email', { email });

    const user = await this.authRepository.findUserByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.verified) {
      throw new Error('Email already verified');
    }

    await this.sendVerificationEmail(user.id, user.email, user.name);

    return { success: true };
  }

  /**
   * Initiate password reset process
   */
  async forgotPassword(email) {
    this.logger.info('Password reset requested', { email });

    const user = await this.authRepository.findUserByEmail(email);

    // Don't reveal if user exists or not for security
    if (!user) {
      this.logger.warn('Password reset requested for non-existent user', { email });
      return { success: true };
    }

    // Generate token
    const token = this.generateRandomToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token
    await this.authRepository.createPasswordResetToken(user.id, user.email, token, expiresAt);

    // Send email
    await this.emailService.sendPasswordResetEmail(user.email, user.name, token);

    // Publish event
    await this.eventBus.publish('user.password_reset_requested', {
      userId: user.id,
      email: user.email,
    });

    return { success: true };
  }

  /**
   * Validate reset token
   */
  async validateResetToken(token) {
    this.logger.info('Validating reset token', { token: token.substring(0, 10) + '...' });

    const tokenDoc = await this.authRepository.findPasswordResetToken(token);
    if (!tokenDoc) {
      return { valid: false, message: 'Invalid or expired reset token' };
    }

    // Check expiration
    if (new Date() > new Date(tokenDoc.expiresAt)) {
      return { valid: false, message: 'Reset token has expired' };
    }

    return { valid: true, email: tokenDoc.email };
  }

  /**
   * Reset password with token
   */
  async resetPassword(token, newPassword) {
    this.logger.info('Resetting password', { token: token.substring(0, 10) + '...' });

    // Find token
    const tokenDoc = await this.authRepository.findPasswordResetToken(token);
    if (!tokenDoc) {
      throw new Error('Invalid or expired reset token');
    }

    // Check expiration
    if (new Date() > new Date(tokenDoc.expiresAt)) {
      throw new Error('Reset token has expired');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    const user = await this.authRepository.updateUserPassword(tokenDoc.userId, hashedPassword);

    // Mark token as used
    await this.authRepository.markPasswordResetTokenUsed(token);

    // Revoke all refresh tokens for security
    await this.authRepository.revokeAllUserTokens(tokenDoc.userId);

    // Send confirmation email
    await this.emailService.sendPasswordChangedEmail(user.email, user.name);

    // Publish event
    await this.eventBus.publish('user.password_reset', {
      userId: user.id,
      email: user.email,
    });

    return this.sanitizeUser(user);
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(userId, currentPassword, newPassword) {
    this.logger.info('Changing password', { userId });

    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user has a password (OAuth users might not)
    if (!user.password) {
      throw new Error('Cannot change password for OAuth-only accounts');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await this.authRepository.updateUserPassword(userId, hashedPassword);

    // Revoke all refresh tokens for security
    await this.authRepository.revokeAllUserTokens(userId);

    // Send confirmation email
    await this.emailService.sendPasswordChangedEmail(user.email, user.name);

    // Publish event
    await this.eventBus.publish('user.password_changed', {
      userId: user.id,
      email: user.email,
    });

    return { success: true };
  }

  /**
   * Generate refresh token and store it
   */
  async generateRefreshToken(user, deviceInfo = {}) {
    const token = this.generateRandomToken(64);
    const expiresAt = new Date(
      Date.now() + (this.config.get('auth.refreshTokenExpiration') || 30 * 24 * 60 * 60 * 1000) // 30 days
    );
    this.logger.info('Generating refresh token', { user });

    // Store refresh token in database
    await this.authRepository.storeRefreshToken(user.id, token, expiresAt, deviceInfo);
    this.logger.info('Generated refresh token', { token, expiresAt });
    return { token, expiresAt };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken) {
    this.logger.info('Refreshing access token');

    // Find and validate refresh token
    const tokenDoc = await this.authRepository.findRefreshToken(refreshToken);
    if (!tokenDoc) {
      throw new Error('Invalid refresh token');
    }

    // Check expiration
    if (new Date() > new Date(tokenDoc.expiresAt)) {
      throw new Error('Refresh token has expired');
    }

    // Check if token is revoked
    if (tokenDoc.revoked) {
      throw new Error('Refresh token has been revoked');
    }

    // Get user
    const user = await this.authRepository.findUserById(tokenDoc.userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.isActive === false) {
      throw new Error('Account is deactivated');
    }

    // Generate new access token
    const accessToken = this.generateToken(user);

    // Publish event
    await this.eventBus.publish('user.token_refreshed', {
      userId: user.id,
    });

    return {
      accessToken,
      user: this.sanitizeUser(user),
    };
  }

  /**
   * Deactivate user account
   */
  async deactivateAccount(userId) {
    this.logger.info('Deactivating account', { userId });

    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Deactivate user
    await this.authRepository.deactivateUser(userId);

    // Revoke all tokens
    await this.authRepository.revokeAllUserTokens(userId);

    // Send confirmation email
    await this.emailService.sendAccountDeactivatedEmail(user.email, user.name);

    // Publish event
    await this.eventBus.publish('user.account_deactivated', {
      userId: user.id,
      email: user.email,
    });

    return { success: true };
  }

  /**
   * Generate random token
   * @private
   */
  generateRandomToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }
}

export default AuthService;
