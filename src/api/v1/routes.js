/**
 * API v1 Routes
 * Central routing configuration for API version 1
 */
import express from 'express';
import { createAuthRoutes } from '@/new-modules/auth/index.js';
import { createUserRoutes } from '@/new-modules/user/index.js';
import { createTeamRoutes } from './modules/team/index.js';
import { createMatchRoutes } from './modules/match/index.js';
import { createTournamentRoutes } from '@/new-modules/tournament/index.js';
import { createChatRoutes } from './modules/chat/index.js';
import { createVenueRoutes, createVenueManagementRoutes } from './modules/venue/index.js';
import {
  initializeNotificationModule,
  createNotificationRoutes,
} from './modules/notification/index.js';
import { initializeMapsModule, createMapsRoutes } from './modules/maps/index.js';
import { initializeCalendarModule, createCalendarRoutes } from './modules/calendar/index.js';
import { initializeInvitationModule, createInvitationRoutes } from './modules/invitation/index.js';
import { initializeFeedbackModule, createFeedbackRoutes } from './modules/feedback/index.js';
import { initializeAdminModule, createAdminRoutes } from './modules/admin/index.js';

/**
 * Create API v1 router with all module routes
 * @param {Object} container - Dependency injection container
 * @returns {express.Router} Configured router
 */
export function createV1Router(container) {
  const router = express.Router();

  // Auth routes
  const authController = container.resolve('authController');
  const jwtAuthMiddleware = container.resolve('jwtAuthMiddleware');
  router.use('/auth', createAuthRoutes(authController, jwtAuthMiddleware));

  // User routes
  const userController = container.resolve('userController');
  router.use('/users', createUserRoutes(userController));

  // Team routes
  const teamController = container.resolve('teamController');
  router.use('/teams', createTeamRoutes(teamController));

  // Match routes
  const matchController = container.resolve('matchController');
  router.use('/matches', createMatchRoutes(matchController));

  // Tournament routes
  const tournamentController = container.resolve('tournamentController');
  router.use('/tournaments', createTournamentRoutes(tournamentController));

  // Chat routes
  const chatController = container.resolve('chatController');
  router.use('/chat', createChatRoutes(chatController));

  // Venue routes (user-facing and owner/manager)
  const venueController = container.resolve('venueController');
  router.use('/venues', createVenueRoutes(venueController));
  router.use('/venue-management', createVenueManagementRoutes(venueController));

  // Initialize and use Maps module
  initializeMapsModule(container);
  const mapsController = container.resolve('mapsController');
  router.use('/maps', createMapsRoutes(mapsController));

  // Initialize and use Calendar module
  initializeCalendarModule(container);
  const calendarController = container.resolve('calendarController');
  router.use('/calendar', createCalendarRoutes(calendarController));

  // Initialize and use Notification module
  initializeNotificationModule(container);
  const notificationController = container.resolve('notificationController');
  router.use('/notifications', createNotificationRoutes(notificationController));

  // Initialize and use Invitation module
  initializeInvitationModule(container);
  const invitationController = container.resolve('invitationController');
  router.use('/invitations', createInvitationRoutes(invitationController));

  // Initialize and use Feedback module
  initializeFeedbackModule(container);
  const feedbackController = container.resolve('feedbackController');
  router.use('/feedback', createFeedbackRoutes(feedbackController));

  // Initialize and use Admin module
  initializeAdminModule(container);
  const adminController = container.resolve('adminController');
  router.use('/admin', createAdminRoutes(adminController));

  return router;
}
