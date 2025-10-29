/**
 * Notification Validation Schemas
 * Validation rules for notification endpoints
 */
import { body, param, query } from 'express-validator';

/**
 * Validation for registering push token
 */
export const registerPushTokenValidation = [
  body('token')
    .notEmpty()
    .withMessage('Push token is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Push token must be between 10 and 500 characters')
    .trim(),
  body('platform')
    .notEmpty()
    .withMessage('Platform is required')
    .isIn(['ios', 'android', 'web'])
    .withMessage('Platform must be ios, android, or web'),
  body('deviceId')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Device ID must not exceed 100 characters')
    .trim(),
];

/**
 * Validation for marking notification as read
 */
export const markAsReadValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid notification ID'),
];

/**
 * Validation for getting notifications
 */
export const getNotificationsValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  query('skip')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Skip must be a non-negative integer')
    .toInt(),
  query('unreadOnly')
    .optional()
    .isBoolean()
    .withMessage('unreadOnly must be a boolean')
    .toBoolean(),
];

/**
 * Validation for creating a notification (admin/system use)
 */
export const createNotificationValidation = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid user ID'),
  body('type')
    .notEmpty()
    .withMessage('Notification type is required')
    .isIn(['match', 'tournament', 'team', 'invitation', 'achievement', 'system', 'booking'])
    .withMessage('Invalid notification type'),
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters')
    .trim(),
  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 1, max: 500 })
    .withMessage('Message must be between 1 and 500 characters')
    .trim(),
  body('relatedEntityId')
    .optional()
    .isMongoId()
    .withMessage('Invalid entity ID'),
  body('priority')
    .optional()
    .isIn(['low', 'normal', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
];
