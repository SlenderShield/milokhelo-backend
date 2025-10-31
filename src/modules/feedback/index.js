/**
 * Feedback Module
 */
import FeedbackModel from './model/feedback.model.js';
import { FeedbackRepository } from './repository/feedback.repository.js';
import { FeedbackService } from './service/feedback.service.js';
import { FeedbackController } from './controller/feedback.controller.js';
export { createFeedbackRoutes } from './routes/feedback.routes.js';

export function initializeFeedbackModule(container) {
  const logger = container.resolve('logger');
  const eventBus = container.resolve('eventBus');

  container.registerSingleton('feedbackRepository', () => new FeedbackRepository(logger));
  container.registerSingleton('feedbackService', () => {
    const repo = container.resolve('feedbackRepository');
    return new FeedbackService(repo, eventBus, logger);
  });
  container.registerSingleton('feedbackController', () => {
    const service = container.resolve('feedbackService');
    return new FeedbackController(service, logger);
  });

  logger.info('Feedback module initialized');
}

export { FeedbackModel, FeedbackRepository, FeedbackService, FeedbackController };
