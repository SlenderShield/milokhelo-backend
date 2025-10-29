/**
 * Maps, Calendar, Notifications, Invitations, Feedback - Consolidated Modules
 */
import {
  LocationModel,
  EventModel,
  NotificationModel,
  DeviceTokenModel,
  InvitationModel,
  FeedbackModel,
} from '../shared/models.js';
import { asyncHandler } from '../../../../common/utils/index.js';
import { HTTP_STATUS } from '../../../../common/constants/index.js';
import express from 'express';

// ==================== MAPS MODULE ====================
export class MapsService {
  constructor(logger) {
    this.logger = logger.child({ context: 'MapsService' });
  }

  async getNearbyVenues(_lat, _lng, _radius = 5) {
    // This would integrate with VenueModel
    return [];
  }

  async submitLocation(entityType, entityId, data, userId) {
    const location = new LocationModel({ entityType, entityId, ...data, submittedBy: userId });
    await location.save();
    return location.toObject();
  }

  async getLocation(entityType, entityId) {
    return LocationModel.findOne({ entityType, entityId }).lean();
  }
}

export class MapsController {
  constructor(mapsService, logger) {
    this.mapsService = mapsService;
    this.logger = logger.child({ context: 'MapsController' });
  }

  getNearby() {
    return asyncHandler(async (req, res) => {
      const { lat, lng, radius } = req.query;
      const venues = await this.mapsService.getNearbyVenues(parseFloat(lat), parseFloat(lng), parseFloat(radius || 5));
      res.status(HTTP_STATUS.OK).json(venues);
    });
  }

  submitLocation() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      const { entityType, entityId, name, lat, lng, address } = req.body;
      const location = await this.mapsService.submitLocation(entityType, entityId, { name, lat, lng, address }, userId);
      res.status(HTTP_STATUS.CREATED).json(location);
    });
  }

  getLocation() {
    return asyncHandler(async (req, res) => {
      const { entityType, entityId } = req.params;
      const location = await this.mapsService.getLocation(entityType, entityId);
      res.status(HTTP_STATUS.OK).json(location);
    });
  }
}

export function createMapsRoutes(controller) {
  const router = express.Router();
  router.get('/nearby', controller.getNearby());
  router.post('/submit', controller.submitLocation());
  router.get('/:entityType/:entityId', controller.getLocation());
  return router;
}

export function initializeMapsModule(container) {
  const logger = container.resolve('logger');
  container.registerSingleton('mapsService', () => new MapsService(logger));
  container.registerSingleton('mapsController', () => {
    const service = container.resolve('mapsService');
    return new MapsController(service, logger);
  });
  logger.info('Maps module initialized');
}

// ==================== CALENDAR MODULE ====================
export class CalendarService {
  constructor(logger) {
    this.logger = logger.child({ context: 'CalendarService' });
  }

  async getUserEvents(userId) {
    return EventModel.find({ userId }).lean();
  }

  async createEvent(userId, data) {
    const event = new EventModel({ userId, ...data });
    await event.save();
    return event.toObject();
  }

  async syncEvents(userId, _deviceEvents) {
    // TODO: Implement sync logic (merge device events with backend)
    return { syncedEvents: await this.getUserEvents(userId) };
  }
}

export class CalendarController {
  constructor(calendarService, logger) {
    this.calendarService = calendarService;
    this.logger = logger.child({ context: 'CalendarController' });
  }

  getEvents() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      const events = await this.calendarService.getUserEvents(userId);
      res.status(HTTP_STATUS.OK).json(events);
    });
  }

  createEvent() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      const event = await this.calendarService.createEvent(userId, req.body);
      res.status(HTTP_STATUS.CREATED).json(event);
    });
  }

  syncEvents() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      const { deviceEvents } = req.body;
      const result = await this.calendarService.syncEvents(userId, deviceEvents);
      res.status(HTTP_STATUS.OK).json(result);
    });
  }
}

export function createCalendarRoutes(controller) {
  const router = express.Router();
  router.get('/events', controller.getEvents());
  router.post('/events', controller.createEvent());
  router.post('/sync', controller.syncEvents());
  return router;
}

export function initializeCalendarModule(container) {
  const logger = container.resolve('logger');
  container.registerSingleton('calendarService', () => new CalendarService(logger));
  container.registerSingleton('calendarController', () => {
    const service = container.resolve('calendarService');
    return new CalendarController(service, logger);
  });
  logger.info('Calendar module initialized');
}

// ==================== NOTIFICATIONS MODULE ====================
export class NotificationService {
  constructor(logger) {
    this.logger = logger.child({ context: 'NotificationService' });
  }

  async getUserNotifications(userId, limit = 50, skip = 0) {
    return NotificationModel.find({ userId }).sort({ createdAt: -1 }).limit(limit).skip(skip).lean();
  }

  async markAsRead(notificationId) {
    return NotificationModel.findByIdAndUpdate(notificationId, { readAt: new Date() }, { new: true }).lean();
  }

  async registerDeviceToken(userId, token, platform) {
    const deviceToken = new DeviceTokenModel({ userId, token, platform });
    await deviceToken.save();
    return deviceToken.toObject();
  }
}

export class NotificationController {
  constructor(notificationService, logger) {
    this.notificationService = notificationService;
    this.logger = logger.child({ context: 'NotificationController' });
  }

  getNotifications() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      const { limit, skip } = req.query;
      const notifications = await this.notificationService.getUserNotifications(userId, limit, skip);
      res.status(HTTP_STATUS.OK).json(notifications);
    });
  }

  markAsRead() {
    return asyncHandler(async (req, res) => {
      const { id } = req.params;
      const notification = await this.notificationService.markAsRead(id);
      res.status(HTTP_STATUS.OK).json(notification);
    });
  }

  registerPushToken() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      const { token, platform } = req.body;
      const deviceToken = await this.notificationService.registerDeviceToken(userId, token, platform);
      res.status(HTTP_STATUS.CREATED).json(deviceToken);
    });
  }
}

export function createNotificationRoutes(controller) {
  const router = express.Router();
  router.get('/', controller.getNotifications());
  router.patch('/:id/read', controller.markAsRead());
  router.post('/push-token', controller.registerPushToken());
  return router;
}

export function initializeNotificationModule(container) {
  const logger = container.resolve('logger');
  container.registerSingleton('notificationService', () => new NotificationService(logger));
  container.registerSingleton('notificationController', () => {
    const service = container.resolve('notificationService');
    return new NotificationController(service, logger);
  });
  logger.info('Notification module initialized');
}

// ==================== INVITATIONS MODULE ====================
export class InvitationService {
  constructor(eventBus, logger) {
    this.eventBus = eventBus;
    this.logger = logger.child({ context: 'InvitationService' });
  }

  async createInvitation(senderId, data) {
    const invitation = new InvitationModel({ senderId, ...data });
    await invitation.save();
    await this.eventBus.publish('invitation.created', { invitationId: invitation._id, recipientId: data.recipientId });
    return invitation.toObject();
  }

  async getUserInvitations(userId) {
    return InvitationModel.find({ recipientId: userId, status: 'pending' }).lean();
  }

  async respondToInvitation(invitationId, action) {
    const invitation = await InvitationModel.findByIdAndUpdate(
      invitationId,
      { status: action === 'accept' ? 'accepted' : 'declined' },
      { new: true }
    ).lean();
    await this.eventBus.publish('invitation.responded', { invitationId, action });
    return invitation;
  }
}

export class InvitationController {
  constructor(invitationService, logger) {
    this.invitationService = invitationService;
    this.logger = logger.child({ context: 'InvitationController' });
  }

  createInvitation() {
    return asyncHandler(async (req, res) => {
      const senderId = req.session?.userId;
      const invitation = await this.invitationService.createInvitation(senderId, req.body);
      res.status(HTTP_STATUS.CREATED).json(invitation);
    });
  }

  getInvitations() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      const invitations = await this.invitationService.getUserInvitations(userId);
      res.status(HTTP_STATUS.OK).json(invitations);
    });
  }

  respondToInvitation() {
    return asyncHandler(async (req, res) => {
      const { id } = req.params;
      const { action } = req.body;
      const invitation = await this.invitationService.respondToInvitation(id, action);
      res.status(HTTP_STATUS.OK).json(invitation);
    });
  }
}

export function createInvitationRoutes(controller) {
  const router = express.Router();
  router.post('/', controller.createInvitation());
  router.get('/', controller.getInvitations());
  router.post('/:id/respond', controller.respondToInvitation());
  return router;
}

export function initializeInvitationModule(container) {
  const logger = container.resolve('logger');
  const eventBus = container.resolve('eventBus');
  container.registerSingleton('invitationService', () => new InvitationService(eventBus, logger));
  container.registerSingleton('invitationController', () => {
    const service = container.resolve('invitationService');
    return new InvitationController(service, logger);
  });
  logger.info('Invitation module initialized');
}

// ==================== FEEDBACK MODULE ====================
export class FeedbackService {
  constructor(logger) {
    this.logger = logger.child({ context: 'FeedbackService' });
  }

  async createFeedback(userId, data) {
    const feedback = new FeedbackModel({ userId, ...data });
    await feedback.save();
    return feedback.toObject();
  }

  async getAllFeedback() {
    return FeedbackModel.find().lean();
  }
}

export class FeedbackController {
  constructor(feedbackService, logger) {
    this.feedbackService = feedbackService;
    this.logger = logger.child({ context: 'FeedbackController' });
  }

  submitFeedback() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      const feedback = await this.feedbackService.createFeedback(userId, req.body);
      res.status(HTTP_STATUS.CREATED).json(feedback);
    });
  }

  listFeedback() {
    return asyncHandler(async (req, res) => {
      // TODO: Add admin authorization check
      const feedback = await this.feedbackService.getAllFeedback();
      res.status(HTTP_STATUS.OK).json(feedback);
    });
  }
}

export function createFeedbackRoutes(controller) {
  const router = express.Router();
  router.post('/', controller.submitFeedback());
  router.get('/', controller.listFeedback());
  return router;
}

export function initializeFeedbackModule(container) {
  const logger = container.resolve('logger');
  container.registerSingleton('feedbackService', () => new FeedbackService(logger));
  container.registerSingleton('feedbackController', () => {
    const service = container.resolve('feedbackService');
    return new FeedbackController(service, logger);
  });
  logger.info('Feedback module initialized');
}

// ==================== ADMIN MODULE (Stub) ====================
export class AdminController {
  constructor(logger) {
    this.logger = logger.child({ context: 'AdminController' });
  }

  getReports() {
    return asyncHandler(async (_req, res) => {
      // TODO: Implement admin reports
      res.status(HTTP_STATUS.OK).json({ message: 'Admin reports endpoint - TODO' });
    });
  }
}

export function createAdminRoutes(controller) {
  const router = express.Router();
  router.get('/reports', controller.getReports());
  return router;
}

export function initializeAdminModule(container) {
  const logger = container.resolve('logger');
  container.registerSingleton('adminController', () => new AdminController(logger));
  logger.info('Admin module initialized');
}
