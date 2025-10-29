/**
 * API v1 Routes
 * Central routing configuration for API version 1
 */
import express from 'express';
import { createExampleRoutes } from './modules/example/index.js';
import { createAuthRoutes } from './modules/auth/index.js';
import { createUserRoutes } from './modules/user/infrastructure/http/UserRoutes.js';
import { createTeamRoutes } from './modules/team/index.js';
import { createMatchRoutes } from './modules/match/index.js';
import { createTournamentRoutes } from './modules/tournament/infrastructure/http/TournamentController.js';
import { createChatRoutes } from './modules/chat/index.js';
import { createVenueRoutes, createVenueManagementRoutes } from './modules/venue/index.js';
import {
  createMapsRoutes,
  createCalendarRoutes,
  createNotificationRoutes,
  createInvitationRoutes,
  createFeedbackRoutes,
  createAdminRoutes,
} from './modules/additional/index.js';

/**
 * Create API v1 router with all module routes
 * @param {Object} container - Dependency injection container
 * @returns {express.Router} Configured router
 */
export function createV1Router(container) {
  const router = express.Router();

  // Example module routes (demo)
  const exampleController = container.resolve('exampleController');
  router.use('/examples', createExampleRoutes(exampleController));

  // Auth routes
  const authController = container.resolve('authController');
  router.use('/auth', createAuthRoutes(authController));

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

  // Maps routes
  const mapsController = container.resolve('mapsController');
  router.use('/maps', createMapsRoutes(mapsController));

  // Calendar routes
  const calendarController = container.resolve('calendarController');
  router.use('/calendar', createCalendarRoutes(calendarController));

  // Notification routes
  const notificationController = container.resolve('notificationController');
  router.use('/notifications', createNotificationRoutes(notificationController));

  // Invitation routes
  const invitationController = container.resolve('invitationController');
  router.use('/invitations', createInvitationRoutes(invitationController));

  // Feedback routes
  const feedbackController = container.resolve('feedbackController');
  router.use('/feedback', createFeedbackRoutes(feedbackController));

  // Admin routes
  const adminController = container.resolve('adminController');
  router.use('/admin', createAdminRoutes(adminController));

  return router;
}
