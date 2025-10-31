/**
 * API v1 Routes
 * Central routing configuration for API version 1
 */
import express from 'express';
import { createAuthRoutes } from '@/new-modules/auth/index.js';
import { createUserRoutes } from '@/new-modules/user/index.js';
import { createTeamRoutes } from '@/new-modules/team/index.js';
import { createMatchRoutes } from '@/new-modules/match/index.js';
import { createTournamentRoutes } from '@/new-modules/tournament/index.js';
import { createChatRoutes } from '@/new-modules/chat/index.js';
import { createVenueRoutes, createVenueManagementRoutes } from '@/new-modules/venue/index.js';
import { createNotificationRoutes } from '@/new-modules/notification/index.js';
import { createMapsRoutes } from '@/new-modules/maps/index.js';
import { createCalendarRoutes } from '@/new-modules/calendar/index.js';
import { createInvitationRoutes } from '@/new-modules/invitation/index.js';
import { createFeedbackRoutes } from '@/new-modules/feedback/index.js';
import { createAdminRoutes } from '@/new-modules/admin/index.js';

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

  // Maps module
  const mapsController = container.resolve('mapsController');
  router.use('/maps', createMapsRoutes(mapsController));

  // Calendar module
  const calendarController = container.resolve('calendarController');
  router.use('/calendar', createCalendarRoutes(calendarController));

  // Notification module
  const notificationController = container.resolve('notificationController');
  router.use('/notifications', createNotificationRoutes(notificationController));

  // Invitation module
  const invitationController = container.resolve('invitationController');
  router.use('/invitations', createInvitationRoutes(invitationController));

  // Feedback module
  const feedbackController = container.resolve('feedbackController');
  router.use('/feedback', createFeedbackRoutes(feedbackController));

  // Admin module
  const adminController = container.resolve('adminController');
  router.use('/admin', createAdminRoutes(adminController));

  return router;
}
