/**
 * Feedback Controller - HTTP request handlers
 */
import { asyncHandler, HTTP_STATUS } from '../../../../../../core/http/index.js';

class FeedbackController {
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

export default FeedbackController;
