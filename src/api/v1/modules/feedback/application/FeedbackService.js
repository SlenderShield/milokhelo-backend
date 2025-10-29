/**
 * Feedback Service - Business logic for feedback
 */
class FeedbackService {
  constructor(feedbackRepository, logger) {
    this.feedbackRepository = feedbackRepository;
    this.logger = logger.child({ context: 'FeedbackService' });
  }

  async createFeedback(userId, data) {
    this.logger.info({ userId }, 'Creating feedback');
    return this.feedbackRepository.create({ userId, ...data });
  }

  async getAllFeedback() {
    this.logger.debug('Fetching all feedback');
    return this.feedbackRepository.findAll();
  }
}

export default FeedbackService;
