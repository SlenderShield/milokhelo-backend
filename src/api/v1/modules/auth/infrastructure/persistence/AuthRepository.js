/**
 * Auth Repository Implementation
 * Handles database operations for authentication
 */
import UserModel from './UserModel.js';

class AuthRepository {
  constructor(logger) {
    this.logger = logger.child({ context: 'AuthRepository' });
  }

  async findUserByEmail(email) {
    return UserModel.findOne({ email }).lean();
  }

  async findUserById(id) {
    return UserModel.findById(id).lean();
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
    }).lean();
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

  async storeRefreshToken(userId, token, expiresAt) {
    // TODO: Implement with Redis or separate token collection
    this.logger.info('Storing refresh token', { userId });
    return { userId, token, expiresAt };
  }

  async findRefreshToken(token) {
    // TODO: Implement with Redis or separate token collection
    this.logger.info('Finding refresh token', { token: token.substring(0, 10) + '...' });
    return null;
  }

  async revokeRefreshToken(token) {
    // TODO: Implement with Redis or separate token collection
    this.logger.info('Revoking refresh token', { token: token.substring(0, 10) + '...' });
    return true;
  }
}

export default AuthRepository;
