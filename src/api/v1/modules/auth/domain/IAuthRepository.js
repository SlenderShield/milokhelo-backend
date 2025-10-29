/**
 * Auth Repository Interface
 * Defines contract for authentication data access
 */
class IAuthRepository {
  async findUserByEmail(_email) {
    throw new Error('Method not implemented');
  }

  async findUserById(_id) {
    throw new Error('Method not implemented');
  }

  async createUser(_userData) {
    throw new Error('Method not implemented');
  }

  async updateUser(_id, _userData) {
    throw new Error('Method not implemented');
  }

  async findOrCreateOAuthUser(_profile, _provider) {
    throw new Error('Method not implemented');
  }

  async storeRefreshToken(_userId, _token, _expiresAt) {
    throw new Error('Method not implemented');
  }

  async findRefreshToken(_token) {
    throw new Error('Method not implemented');
  }

  async revokeRefreshToken(_token) {
    throw new Error('Method not implemented');
  }
}

export default IAuthRepository;
