/**
 * Calendar Validation Schemas
 * Validation rules for calendar endpoints
 */
import { body, query } from 'express-validator';

/**
 * Validation for creating a calendar event
 */
export const createEventValidation = [
  body('title')
    .notEmpty()
    .withMessage('Event title is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters')
    .trim(),
  body('startTime')
    .notEmpty()
    .withMessage('Start time is required')
    .isISO8601()
    .withMessage('Start time must be a valid ISO 8601 date'),
  body('endTime')
    .notEmpty()
    .withMessage('End time is required')
    .isISO8601()
    .withMessage('End time must be a valid ISO 8601 date')
    .custom((endTime, { req }) => {
      if (new Date(endTime) <= new Date(req.body.startTime)) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),
  body('location')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Location must not exceed 200 characters')
    .trim(),
  body('eventType')
    .optional()
    .isIn(['match', 'tournament', 'training', 'booking', 'other'])
    .withMessage('Invalid event type'),
  body('relatedEntityId')
    .optional()
    .isMongoId()
    .withMessage('Invalid entity ID'),
];

/**
 * Validation for syncing calendar events
 */
export const syncEventsValidation = [
  body('deviceEvents')
    .optional()
    .isArray()
    .withMessage('Device events must be an array'),
  body('deviceEvents.*.title')
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage('Event title must be between 1 and 200 characters'),
  body('deviceEvents.*.startTime')
    .optional()
    .isISO8601()
    .withMessage('Start time must be a valid ISO 8601 date'),
  body('deviceEvents.*.endTime')
    .optional()
    .isISO8601()
    .withMessage('End time must be a valid ISO 8601 date'),
];

/**
 * Validation for getting events
 */
export const getEventsValidation = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  query('eventType')
    .optional()
    .isIn(['match', 'tournament', 'training', 'booking', 'other'])
    .withMessage('Invalid event type'),
];
