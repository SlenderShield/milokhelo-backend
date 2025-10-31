/**
 * Team Validation Schemas
 * Validation rules for team endpoints
 */
import { body, param } from 'express-validator';

/**
 * Validation for creating a team
 */
export const createTeamValidation = [
  body('name')
    .notEmpty()
    .withMessage('Team name is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Team name must be between 3 and 50 characters')
    .trim(),
  body('sport')
    .notEmpty()
    .withMessage('Sport is required')
    .isIn(['football', 'basketball', 'volleyball', 'tennis', 'badminton', 'cricket', 'other'])
    .withMessage('Invalid sport type'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters')
    .trim(),
  body('joinCode')
    .optional()
    .isLength({ min: 4, max: 20 })
    .withMessage('Join code must be between 4 and 20 characters')
    .trim(),
  body('isPrivate').optional().isBoolean().withMessage('isPrivate must be a boolean'),
];

/**
 * Validation for updating a team
 */
export const updateTeamValidation = [
  param('id').isMongoId().withMessage('Invalid team ID'),
  body('name')
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage('Team name must be between 3 and 50 characters')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters')
    .trim(),
  body('captainId').optional().isMongoId().withMessage('Invalid captain ID'),
  body('joinCode')
    .optional()
    .isLength({ min: 4, max: 20 })
    .withMessage('Join code must be between 4 and 20 characters')
    .trim(),
  body('isPrivate').optional().isBoolean().withMessage('isPrivate must be a boolean'),
  body('avatar').optional().isURL().withMessage('Avatar must be a valid URL'),
];

/**
 * Validation for team ID param
 */
export const teamIdValidation = [param('id').isMongoId().withMessage('Invalid team ID')];

/**
 * Validation for joining a team
 */
export const joinTeamValidation = [
  param('id').isMongoId().withMessage('Invalid team ID'),
  body('joinCode')
    .optional()
    .isLength({ min: 4, max: 20 })
    .withMessage('Join code must be between 4 and 20 characters')
    .trim(),
];

/**
 * Validation for leaving a team
 */
export const leaveTeamValidation = [param('id').isMongoId().withMessage('Invalid team ID')];
