/**
 * Example Repository Interface
 * Defines contract for data access
 */
class IExampleRepository {
  async create(_entity) {
    throw new Error('create method must be implemented');
  }

  async findById(_id) {
    throw new Error('findById method must be implemented');
  }

  async findAll() {
    throw new Error('findAll method must be implemented');
  }

  async update(_id, _data) {
    throw new Error('update method must be implemented');
  }

  async delete(_id) {
    throw new Error('delete method must be implemented');
  }
}

module.exports = IExampleRepository;
