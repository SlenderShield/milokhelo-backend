/**
 * Example Repository Implementation
 * Concrete implementation of IExampleRepository using MongoDB
 */
const IExampleRepository = require('../domain/IExampleRepository');
const ExampleEntity = require('../domain/ExampleEntity');
const ExampleModel = require('./ExampleModel');

class ExampleRepository extends IExampleRepository {
  constructor(logger) {
    super();
    this.logger = logger.child({ context: 'ExampleRepository' });
  }

  async create(data) {
    try {
      const doc = await ExampleModel.create(data);
      return this.toEntity(doc);
    } catch (error) {
      this.logger.error('Error creating example', { error: error.message });
      throw error;
    }
  }

  async findById(id) {
    try {
      const doc = await ExampleModel.findById(id);
      return doc ? this.toEntity(doc) : null;
    } catch (error) {
      this.logger.error('Error finding example by id', { id, error: error.message });
      throw error;
    }
  }

  async findAll() {
    try {
      const docs = await ExampleModel.find().sort({ createdAt: -1 });
      return docs.map((doc) => this.toEntity(doc));
    } catch (error) {
      this.logger.error('Error finding all examples', { error: error.message });
      throw error;
    }
  }

  async update(id, data) {
    try {
      const doc = await ExampleModel.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true }
      );
      return doc ? this.toEntity(doc) : null;
    } catch (error) {
      this.logger.error('Error updating example', { id, error: error.message });
      throw error;
    }
  }

  async delete(id) {
    try {
      await ExampleModel.findByIdAndDelete(id);
    } catch (error) {
      this.logger.error('Error deleting example', { id, error: error.message });
      throw error;
    }
  }

  toEntity(doc) {
    return new ExampleEntity({
      id: doc._id.toString(),
      name: doc.name,
      description: doc.description,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}

module.exports = ExampleRepository;
