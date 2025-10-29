/**
 * Match Validation Schemas
 * Validation rules for match endpoints
 */
import { body, param, query } from 'express-validator';

/**
 * Validation for creating a match
 */
export const createMatchValidation = [
  body('title')
    .notEmpty()
    .withMessage('Match title is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters')
    .trim(),
  body('sport')
    .notEmpty()
    .withMessage('Sport is required')
    .isIn(['football', 'basketball', 'volleyball', 'tennis', 'badminton', 'cricket', 'other'])
    .withMessage('Invalid sport type'),
  body('matchType')
    .notEmpty()
    .withMessage('Match type is required')
    .isIn(['individual', 'team', 'friendly', 'competitive'])
    .withMessage('Invalid match type'),
  body('date')
    .notEmpty()
    .withMessage('Match date is required')
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date')
    .custom((date) => {
      if (new Date(date) < new Date()) {
        throw new Error('Match date cannot be in the past');
      }
      return true;
    }),
  body('location')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Location must not exceed 200 characters')
    .trim(),
  body('venueId')
    .optional()
    .isMongoId()
    .withMessage('Invalid venue ID'),
  body('maxParticipants')
    .optional()
    .isInt({ min: 2, max: 100 })
    .withMessage('Max participants must be between 2 and 100')
    .toInt(),
  body('skillLevel')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced', 'professional'])
    .withMessage('Invalid skill level'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters')
    .trim(),
];

/**
 * Validation for updating match
 */
export const updateMatchValidation = [
  param('matchId')
    .isMongoId()
    .withMessage('Invalid match ID'),
  body('title')
    .optional()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters')
    .trim(),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date'),
  body('location')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Location must not exceed 200 characters')
    .trim(),
  body('status')
    .optional()
    .isIn(['scheduled', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
];

/**
 * Validation for match ID param
 */
export const matchIdValidation = [
  param('matchId')
    .isMongoId()
    .withMessage('Invalid match ID'),
];

/**
 * Validation for finishing match
 */
export const finishMatchValidation = [
  param('matchId')
    .isMongoId()
    .withMessage('Invalid match ID'),
  body('winnerId')
    .optional()
    .isMongoId()
    .withMessage('Invalid winner ID'),
  body('score')
    .optional()
    .isObject()
    .withMessage('Score must be an object'),
  body('stats')
    .optional()
    .isArray()
    .withMessage('Stats must be an array'),
];

/**
 * Validation for searching nearby matches
 */
export const nearbyMatchesValidation = [
  query('latitude')
    .notEmpty()
    .withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90')
    .toFloat(),
  query('longitude')
    .notEmpty()
    .withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180')
    .toFloat(),
  query('maxDistance')
    .optional()
    .isInt({ min: 100, max: 100000 })
    .withMessage('Max distance must be between 100 and 100000 meters')
    .toInt(),
];
