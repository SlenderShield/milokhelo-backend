/**
 * Validation Middleware
 * Handles request validation using express-validator
 */
import { validationResult } from 'express-validator';
import { HTTP_STATUS } from '../errors/index.js';

/**
 * Middleware to check validation results
 * Should be used after validation chain
 * @returns {Function} Express middleware
 */
export function validateRequest() {
  return (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().map((error) => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value,
      }));

      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        status: 'error',
        message: 'Validation failed',
        errors: formattedErrors,
      });
    }

    next();
  };
}

/**
 * Create validation middleware with custom error handler
 * @param {Array} validations - Array of express-validator validation chains
 * @returns {Array} Array of middleware functions
 */
export function validate(validations) {
  return [...validations, validateRequest()];
}
