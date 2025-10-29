/**
 * User Entity
 * Core user business object
 */
class UserEntity {
  constructor(data = {}) {
    this.id = data.id || null;
    this.username = data.username;
    this.email = data.email;
    this.displayName = data.displayName;
    this.avatar = data.avatar || null;
    this.role = data.role || 'user';
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Validate user entity
   */
  validate() {
    const errors = [];

    if (!this.username || this.username.length < 3) {
      errors.push('Username must be at least 3 characters');
    }

    if (!this.email || !this.isValidEmail(this.email)) {
      errors.push('Valid email is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if email is valid
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Convert to plain object (for API responses)
   */
  toJSON() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      displayName: this.displayName,
      avatar: this.avatar,
      role: this.role,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

export default UserEntity;
