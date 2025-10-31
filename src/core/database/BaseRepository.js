/**
 * Base Repository
 * Provides common CRUD operations and pagination helpers
 * 
 * Features:
 * - Standard CRUD operations
 * - Pagination support
 * - Transaction support
 * - Audit trail hooks
 * - Schema versioning
 */

class BaseRepository {
  constructor(model, logger) {
    this.model = model;
    this.logger = logger;
    this.schemaVersion = 1; // Default schema version
  }

  /**
   * Find by ID
   */
  async findById(id, options = {}) {
    try {
      const query = this.model.findById(id);
      
      if (options.populate) {
        query.populate(options.populate);
      }
      
      if (options.select) {
        query.select(options.select);
      }

      return await query.exec();
    } catch (error) {
      this.logger.error('Repository findById error', {
        model: this.model.modelName,
        id,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Find one by criteria
   */
  async findOne(criteria, options = {}) {
    try {
      const query = this.model.findOne(criteria);
      
      if (options.populate) {
        query.populate(options.populate);
      }
      
      if (options.select) {
        query.select(options.select);
      }

      return await query.exec();
    } catch (error) {
      this.logger.error('Repository findOne error', {
        model: this.model.modelName,
        criteria,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Find many by criteria
   */
  async find(criteria = {}, options = {}) {
    try {
      const query = this.model.find(criteria);
      
      if (options.populate) {
        query.populate(options.populate);
      }
      
      if (options.select) {
        query.select(options.select);
      }
      
      if (options.sort) {
        query.sort(options.sort);
      }
      
      if (options.limit) {
        query.limit(options.limit);
      }
      
      if (options.skip) {
        query.skip(options.skip);
      }

      return await query.exec();
    } catch (error) {
      this.logger.error('Repository find error', {
        model: this.model.modelName,
        criteria,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Find with pagination
   */
  async findPaginated(criteria = {}, options = {}) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    try {
      const [items, total] = await Promise.all([
        this.find(criteria, { ...options, skip, limit }),
        this.count(criteria),
      ]);

      return {
        items,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      this.logger.error('Repository findPaginated error', {
        model: this.model.modelName,
        criteria,
        page,
        limit,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Count documents
   */
  async count(criteria = {}) {
    try {
      return await this.model.countDocuments(criteria);
    } catch (error) {
      this.logger.error('Repository count error', {
        model: this.model.modelName,
        criteria,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Create document
   */
  async create(data, options = {}) {
    try {
      // Add audit trail
      const enrichedData = {
        ...data,
        _schemaVersion: this.schemaVersion,
        ...(options.createdBy && { createdBy: options.createdBy }),
      };

      const document = new this.model(enrichedData);
      
      if (options.session) {
        return await document.save({ session: options.session });
      }
      
      return await document.save();
    } catch (error) {
      this.logger.error('Repository create error', {
        model: this.model.modelName,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Update by ID
   */
  async updateById(id, data, options = {}) {
    try {
      // Add audit trail
      const enrichedData = {
        ...data,
        ...(options.updatedBy && { updatedBy: options.updatedBy }),
        updatedAt: new Date(),
      };

      const updateOptions = {
        new: true,
        runValidators: true,
        ...(options.session && { session: options.session }),
      };

      return await this.model.findByIdAndUpdate(id, enrichedData, updateOptions);
    } catch (error) {
      this.logger.error('Repository updateById error', {
        model: this.model.modelName,
        id,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Update one by criteria
   */
  async updateOne(criteria, data, options = {}) {
    try {
      const enrichedData = {
        ...data,
        ...(options.updatedBy && { updatedBy: options.updatedBy }),
        updatedAt: new Date(),
      };

      const updateOptions = {
        new: true,
        runValidators: true,
        ...(options.session && { session: options.session }),
      };

      return await this.model.findOneAndUpdate(criteria, enrichedData, updateOptions);
    } catch (error) {
      this.logger.error('Repository updateOne error', {
        model: this.model.modelName,
        criteria,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Delete by ID
   */
  async deleteById(id, options = {}) {
    try {
      if (options.session) {
        return await this.model.findByIdAndDelete(id, { session: options.session });
      }
      
      return await this.model.findByIdAndDelete(id);
    } catch (error) {
      this.logger.error('Repository deleteById error', {
        model: this.model.modelName,
        id,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Delete one by criteria
   */
  async deleteOne(criteria, options = {}) {
    try {
      if (options.session) {
        return await this.model.findOneAndDelete(criteria, { session: options.session });
      }
      
      return await this.model.findOneAndDelete(criteria);
    } catch (error) {
      this.logger.error('Repository deleteOne error', {
        model: this.model.modelName,
        criteria,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Delete many by criteria
   */
  async deleteMany(criteria, options = {}) {
    try {
      if (options.session) {
        return await this.model.deleteMany(criteria, { session: options.session });
      }
      
      return await this.model.deleteMany(criteria);
    } catch (error) {
      this.logger.error('Repository deleteMany error', {
        model: this.model.modelName,
        criteria,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Execute operation within transaction
   */
  async withTransaction(callback) {
    const session = await this.model.db.startSession();
    
    try {
      session.startTransaction();
      
      const result = await callback(session);
      
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      this.logger.error('Transaction error', {
        model: this.model.modelName,
        error: error.message,
      });
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Check if document exists
   */
  async exists(criteria) {
    try {
      const count = await this.model.countDocuments(criteria).limit(1);
      return count > 0;
    } catch (error) {
      this.logger.error('Repository exists error', {
        model: this.model.modelName,
        criteria,
        error: error.message,
      });
      throw error;
    }
  }
}

export default BaseRepository;
