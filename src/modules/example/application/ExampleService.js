/**
 * Example Service - Application Layer
 * Contains business logic and orchestrates domain operations
 */
import {  EVENTS  } from '../../../shared/constants.js';

class ExampleService {
  constructor(repository, eventBus, logger) {
    this.repository = repository;
    this.eventBus = eventBus;
    this.logger = logger.child({ context: 'ExampleService' });
  }

  async create(data) {
    try {
      this.logger.info('Creating example entity', { data });

      // Business logic here
      const entity = await this.repository.create(data);

      // Publish event for other modules
      await this.eventBus.publish(EVENTS.EXAMPLE.CREATED, {
        id: entity.id,
        name: entity.name,
      });

      this.logger.info('Example entity created', { id: entity.id });
      return entity;
    } catch (error) {
      this.logger.error('Failed to create example entity', { error: error.message });
      throw error;
    }
  }

  async findById(id) {
    try {
      this.logger.debug('Finding example entity by id', { id });
      const entity = await this.repository.findById(id);

      if (!entity) {
        throw new Error('Entity not found');
      }

      return entity;
    } catch (error) {
      this.logger.error('Failed to find example entity', { id, error: error.message });
      throw error;
    }
  }

  async findAll() {
    try {
      this.logger.debug('Finding all example entities');
      return await this.repository.findAll();
    } catch (error) {
      this.logger.error('Failed to find example entities', { error: error.message });
      throw error;
    }
  }

  async update(id, data) {
    try {
      this.logger.info('Updating example entity', { id, data });

      const entity = await this.repository.update(id, data);

      if (!entity) {
        throw new Error('Entity not found');
      }

      // Publish event for other modules
      await this.eventBus.publish(EVENTS.EXAMPLE.UPDATED, {
        id: entity.id,
        name: entity.name,
      });

      this.logger.info('Example entity updated', { id });
      return entity;
    } catch (error) {
      this.logger.error('Failed to update example entity', { id, error: error.message });
      throw error;
    }
  }

  async delete(id) {
    try {
      this.logger.info('Deleting example entity', { id });

      await this.repository.delete(id);

      // Publish event for other modules
      await this.eventBus.publish(EVENTS.EXAMPLE.DELETED, { id });

      this.logger.info('Example entity deleted', { id });
    } catch (error) {
      this.logger.error('Failed to delete example entity', { id, error: error.message });
      throw error;
    }
  }
}

export default ExampleService;