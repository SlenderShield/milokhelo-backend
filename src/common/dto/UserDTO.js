/**
 * User DTO (Data Transfer Object)
 * Transforms User model data for safe client consumption
 * Excludes sensitive fields like password, OAuth tokens, etc.
 */
import BaseDTO from './BaseDTO.js';

class UserDTO extends BaseDTO {
  static transformOne(user, options = {}) {
    if (!user) return null;

    const safe = {
      id: user._id?.toString(),
      username: user.username,
      name: user.name,
      email: user.email,
      phone: options.showPrivate ? user.phone : undefined,
      avatar: user.avatar,
      bio: user.bio,
      roles: user.roles,
      verified: user.verified,
      isActive: user.isActive,
      sportsPreferences: user.sportsPreferences,
      location: user.location
        ? {
            city: user.location.city,
            coordinates: options.showPrivate ? user.location.coordinates : undefined,
          }
        : undefined,
      privacy: user.privacy,
      achievements:
        user.achievements?.map((a) => (a._id ? a._id.toString() : a.toString())) || [],
      friends: user.friends?.map((f) => (f._id ? f._id.toString() : f.toString())) || [],
      lastLogin: user.lastLogin,
    };

    // Include timestamps if requested
    if (options.includeTimestamps) {
      safe.createdAt = user.createdAt;
      safe.updatedAt = user.updatedAt;
    }

    // Apply privacy settings if viewing someone else's profile
    if (!options.isOwner && user.privacy) {
      if (!user.privacy.showPhone) {
        delete safe.phone;
      }
      if (!user.privacy.showLocation) {
        delete safe.location;
      }
    }

    return this.clean(safe);
  }

  /**
   * Transform user with minimal data (for lists)
   */
  static transformMinimal(user) {
    if (!user) return null;

    const obj = user.toObject ? user.toObject() : user;

    return this.clean({
      id: obj._id?.toString(),
      username: obj.username,
      name: obj.name,
      avatar: obj.avatar,
      roles: obj.roles,
    });
  }

  /**
   * Transform user for search results
   */
  static transformForSearch(user) {
    if (!user) return null;

    const obj = user.toObject ? user.toObject() : user;

    return this.clean({
      id: obj._id?.toString(),
      username: obj.username,
      name: obj.name,
      avatar: obj.avatar,
      bio: obj.bio,
      sportsPreferences: obj.sportsPreferences,
      location: obj.location?.city,
    });
  }
}

export default UserDTO;
