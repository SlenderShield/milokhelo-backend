/**
 * Base DTO (Data Transfer Object)
 * Provides common functionality for DTOs to transform database models
 * into safe objects for client consumption
 */

class BaseDTO {
  /**
   * Transform a single document or plain object
   * @param {Object} document - Mongoose document or plain object
   * @param {Object} options - Transformation options
   * @returns {Object} Transformed object
   */
  static transform(document, options = {}) {
    if (!document) return null;

    // Convert Mongoose document to plain object if needed
    const obj = document.toObject ? document.toObject() : document;

    // Call the specific DTO's transformOne method
    return this.transformOne(obj, options);
  }

  /**
   * Transform an array of documents
   * @param {Array} documents - Array of documents
   * @param {Object} options - Transformation options
   * @returns {Array} Transformed array
   */
  static transformMany(documents, options = {}) {
    if (!Array.isArray(documents)) return [];
    return documents.map((doc) => this.transform(doc, options));
  }

  /**
   * Transform a single object (to be overridden by subclasses)
   * @param {Object} obj - Plain object
   * @param {Object} options - Transformation options
   * @returns {Object} Transformed object
   */
  static transformOne(obj, options = {}) {
    // Default implementation - remove sensitive fields
    // eslint-disable-next-line no-unused-vars
    const { _id, __v, createdAt, updatedAt, ...rest } = obj;
    return {
      id: _id?.toString(),
      ...rest,
      ...(options.includeTimestamps && { createdAt, updatedAt }),
    };
  }

  /**
   * Remove undefined and null values from object
   */
  static clean(obj) {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = value;
      }
      return acc;
    }, {});
  }
}

export default BaseDTO;
