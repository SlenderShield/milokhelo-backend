/**
 * User Repository Interface
 * Defines contract for user data access
 */
class IUserRepository {
  async create(_user) {
    throw new Error('Method not implemented');
  }

  async findById(_id) {
    throw new Error('Method not implemented');
  }

  async findByEmail(_email) {
    throw new Error('Method not implemented');
  }

  async findByUsername(_username) {
    throw new Error('Method not implemented');
  }

  async update(_id, _userData) {
    throw new Error('Method not implemented');
  }

  async delete(_id) {
    throw new Error('Method not implemented');
  }

  async findAll(_filters = {}) {
    throw new Error('Method not implemented');
  }
}

export default IUserRepository;
