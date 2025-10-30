/**
 * Tournament Validation Schemas
 * Validation rules for tournament endpoints
 */
import { body, param } from 'express-validator';

/**
 * Validation for creating a tournament
 */
export const createTournamentValidation = [
  body('title')
    .notEmpty()
    .withMessage('Tournament title is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters')
    .trim(),
  body('sport')
    .notEmpty()
    .withMessage('Sport is required')
    .isIn(['football', 'basketball', 'volleyball', 'tennis', 'badminton', 'cricket', 'other'])
    .withMessage('Invalid sport type'),
  body('type')
    .notEmpty()
    .withMessage('Tournament type is required')
    .isIn(['knockout', 'league'])
    .withMessage('Invalid tournament type. Must be knockout or league'),
  body('registrationWindow.start')
    .notEmpty()
    .withMessage('Registration start date is required')
    .isISO8601()
    .withMessage('Registration start must be a valid ISO 8601 date'),
  body('registrationWindow.end')
    .notEmpty()
    .withMessage('Registration end date is required')
    .isISO8601()
    .withMessage('Registration end must be a valid ISO 8601 date')
    .custom((endDate, { req }) => {
      if (new Date(endDate) <= new Date(req.body.registrationWindow?.start)) {
        throw new Error('Registration end date must be after start date');
      }
      return true;
    }),
  body('minTeams')
    .optional()
    .isInt({ min: 2, max: 100 })
    .withMessage('Minimum teams must be between 2 and 100')
    .toInt(),
  body('maxTeams')
    .optional()
    .isInt({ min: 2, max: 100 })
    .withMessage('Maximum teams must be between 2 and 100')
    .toInt()
    .custom((maxTeams, { req }) => {
      if (req.body.minTeams && maxTeams < req.body.minTeams) {
        throw new Error('Maximum teams must be greater than or equal to minimum teams');
      }
      return true;
    }),
  body('entryFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Entry fee must be a positive number')
    .toFloat(),
  body('prizePool')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Prize pool description must not exceed 500 characters')
    .trim(),
  body('rules')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Rules must not exceed 2000 characters')
    .trim(),
  body('visibility')
    .optional()
    .isIn(['public', 'private'])
    .withMessage('Visibility must be either public or private'),
];

/**
 * Validation for updating a tournament
 */
export const updateTournamentValidation = [
  param('id').isMongoId().withMessage('Invalid tournament ID'),
  body('title')
    .optional()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters')
    .trim(),
  body('sport')
    .optional()
    .isIn(['football', 'basketball', 'volleyball', 'tennis', 'badminton', 'cricket', 'other'])
    .withMessage('Invalid sport type'),
  body('type').optional().isIn(['knockout', 'league']).withMessage('Invalid tournament type'),
  body('registrationWindow.start')
    .optional()
    .isISO8601()
    .withMessage('Registration start must be a valid ISO 8601 date'),
  body('registrationWindow.end')
    .optional()
    .isISO8601()
    .withMessage('Registration end must be a valid ISO 8601 date'),
  body('minTeams')
    .optional()
    .isInt({ min: 2, max: 100 })
    .withMessage('Minimum teams must be between 2 and 100')
    .toInt(),
  body('maxTeams')
    .optional()
    .isInt({ min: 2, max: 100 })
    .withMessage('Maximum teams must be between 2 and 100')
    .toInt(),
  body('entryFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Entry fee must be a positive number')
    .toFloat(),
  body('prizePool')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Prize pool description must not exceed 500 characters')
    .trim(),
  body('rules')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Rules must not exceed 2000 characters')
    .trim(),
  body('visibility')
    .optional()
    .isIn(['public', 'private'])
    .withMessage('Visibility must be either public or private'),
  body('status')
    .optional()
    .isIn(['registration', 'ongoing', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
];

/**
 * Validation for tournament ID param
 */
export const tournamentIdValidation = [
  param('id').isMongoId().withMessage('Invalid tournament ID'),
];

/**
 * Validation for joining tournament
 */
export const joinTournamentValidation = [
  param('id').isMongoId().withMessage('Invalid tournament ID'),
  body('teamId')
    .notEmpty()
    .withMessage('Team ID is required')
    .isMongoId()
    .withMessage('Invalid team ID'),
];

/**
 * Validation for starting tournament
 */
export const startTournamentValidation = [
  param('id').isMongoId().withMessage('Invalid tournament ID'),
];
