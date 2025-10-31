/**
 * Feedback Controller - HTTP request handlers
 */
import { asyncHandler, HTTP_STATUS } from '@/core/http/index.js';
import { FeedbackDTO } from '@/common/dto/index.js';

class FeedbackController {
  constructor(feedbackService, logger) {
    this.feedbackService = feedbackService;
    this.logger = logger.child({ context: 'FeedbackController' });
  }

  submitFeedback() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      const feedback = await this.feedbackService.createFeedback(userId, req.body);
      const safeFeedback = FeedbackDTO.transform(feedback, {
        isOwner: true,
        includeTimestamps: true,
      });
      res.status(HTTP_STATUS.CREATED).json(safeFeedback);
    });
  }

  listFeedback() {
    return asyncHandler(async (req, res) => {
      const userRoles = req.user?.roles || req.session?.user?.roles || [];
      const isAdmin = userRoles.includes('admin') || userRoles.includes('superadmin');
      const feedback = await this.feedbackService.getAllFeedback();
      const safeFeedback = feedback.map((f) =>
        FeedbackDTO.transform(f, { isAdmin, includeTimestamps: true })
      );
      res.status(HTTP_STATUS.OK).json(safeFeedback);
    });
  }
}

export default FeedbackController;
