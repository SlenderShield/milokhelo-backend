/**
 * Auth Repository Implementation
 * Handles database operations for authentication
 */
import UserModel from '../model/user.model.js';
import { EmailVerificationToken, PasswordResetToken, RefreshToken } from '../model/token.model.js';

class AuthRepository {
  constructor(logger) {
    this.logger = logger.child({ context: 'AuthRepository' });
  }

  async findUserByEmail(email) {
    return UserModel.findOne({ email });
  }

  async findUserById(id) {
    return UserModel.findById(id);
  }

  async createUser(userData) {
    const user = new UserModel(userData);
    await user.save();
    return user.toJSON();
  }

  async updateUser(id, userData) {
    const user = await UserModel.findByIdAndUpdate(id, userData, {
      new: true,
      runValidators: true,
    });
    return user;
  }

  async findOrCreateOAuthUser(profile, provider) {
    this.logger.info('Finding or creating OAuth user', { provider, profileId: profile.id });

    // Build query based on provider
    const query = {};
    if (provider === 'google') {
      query['oauthProviders.google.id'] = profile.id;
    } else if (provider === 'facebook') {
      query['oauthProviders.facebook.id'] = profile.id;
    }

    // Try to find existing user
    let user = await UserModel.findOne(query);

    if (!user) {
      // Check if user exists with same email
      user = await UserModel.findOne({ email: profile.emails?.[0]?.value });

      if (user) {
        // Link OAuth account to existing user
        if (provider === 'google') {
          user.oauthProviders.google = {
            id: profile.id,
            email: profile.emails?.[0]?.value,
          };
        } else if (provider === 'facebook') {
          user.oauthProviders.facebook = {
            id: profile.id,
            email: profile.emails?.[0]?.value,
          };
        }
        await user.save();
      } else {
        // Create new user
        const userData = {
          name: profile.displayName || profile.name?.givenName + ' ' + profile.name?.familyName,
          email: profile.emails?.[0]?.value,
          avatar: profile.photos?.[0]?.value,
          verified: true, // OAuth users are pre-verified
          oauthProviders: {},
        };

        if (provider === 'google') {
          userData.oauthProviders.google = {
            id: profile.id,
            email: profile.emails?.[0]?.value,
          };
        } else if (provider === 'facebook') {
          userData.oauthProviders.facebook = {
            id: profile.id,
            email: profile.emails?.[0]?.value,
          };
        }

        user = new UserModel(userData);
        await user.save();
      }
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    return user.toJSON();
  }

  async storeRefreshToken(userId, token, expiresAt, deviceInfo = {}) {
    this.logger.info('Storing refresh token', { userId });
    const refreshToken = new RefreshToken({
      userId,
      token,
      expiresAt,
      deviceInfo,
    });
    await refreshToken.save();
    return refreshToken.toJSON();
  }

  async findRefreshToken(token) {
    this.logger.info('Finding refresh token', { token: token.substring(0, 10) + '...' });
    return RefreshToken.findOne({ token, revoked: false });
  }

  async revokeRefreshToken(token) {
    this.logger.info('Revoking refresh token', { token: token.substring(0, 10) + '...' });
    const result = await RefreshToken.updateOne(
      { token },
      { revoked: true, revokedAt: new Date() }
    );
    return result.modifiedCount > 0;
  }

  async revokeAllUserTokens(userId) {
    this.logger.info('Revoking all user tokens', { userId });
    const result = await RefreshToken.updateMany(
      { userId, revoked: false },
      { revoked: true, revokedAt: new Date() }
    );
    return result.modifiedCount;
  }

  async createEmailVerificationToken(userId, email, token, expiresAt) {
    this.logger.info('Creating email verification token', { userId, email });
    // Delete any existing tokens for this user
    await EmailVerificationToken.deleteMany({ userId, used: false });

    const verificationToken = new EmailVerificationToken({
      userId,
      email,
      token,
      expiresAt,
    });
    await verificationToken.save();
    return verificationToken.toJSON();
  }

  async findEmailVerificationToken(token) {
    return EmailVerificationToken.findOne({ token, used: false });
  }

  async markEmailVerificationTokenUsed(token) {
    const result = await EmailVerificationToken.updateOne({ token }, { used: true });
    return result.modifiedCount > 0;
  }

  async createPasswordResetToken(userId, email, token, expiresAt) {
    this.logger.info('Creating password reset token', { userId, email });
    // Delete any existing tokens for this user
    await PasswordResetToken.deleteMany({ userId, used: false });

    const resetToken = new PasswordResetToken({
      userId,
      email,
      token,
      expiresAt,
    });
    await resetToken.save();
    return resetToken.toJSON();
  }

  async findPasswordResetToken(token) {
    return PasswordResetToken.findOne({ token, used: false });
  }

  async markPasswordResetTokenUsed(token) {
    const result = await PasswordResetToken.updateOne({ token }, { used: true });
    return result.modifiedCount > 0;
  }

  async updateUserPassword(userId, hashedPassword) {
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { password: hashedPassword },
      { new: true, runValidators: true }
    );
    return user;
  }

  async verifyUserEmail(userId) {
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { verified: true },
      { new: true, runValidators: true }
    );
    return user;
  }

  async deactivateUser(userId) {
    const user = await UserModel.findByIdAndUpdate(
      userId,
      {
        isActive: false,
        deactivatedAt: new Date(),
      },
      { new: true, runValidators: true }
    );
    return user;
  }
}

export default AuthRepository;
