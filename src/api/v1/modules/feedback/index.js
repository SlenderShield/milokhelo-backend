/**
 * Feedback Module
 */
import FeedbackRepository from './infrastructure/persistence/FeedbackRepository.js';
import FeedbackService from './application/FeedbackService.js';
import FeedbackController from './infrastructure/http/FeedbackController.js';
import { createFeedbackRoutes } from './infrastructure/http/FeedbackRoutes.js';

export function initializeFeedbackModule(container) {
  const logger = container.resolve('logger');

  container.registerSingleton('feedbackRepository', () => {
    return new FeedbackRepository(logger);
  });

  container.registerSingleton('feedbackService', () => {
    const repository = container.resolve('feedbackRepository');
    return new FeedbackService(repository, logger);
  });

  container.registerSingleton('feedbackController', () => {
    const service = container.resolve('feedbackService');
    return new FeedbackController(service, logger);
  });

  logger.info('Feedback module initialized');
}

export { FeedbackService, FeedbackController, createFeedbackRoutes };
