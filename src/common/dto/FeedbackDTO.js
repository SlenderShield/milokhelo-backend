/**
 * Feedback DTO (Data Transfer Object)
 * Transforms Feedback model data for safe client consumption
 */
import BaseDTO from './BaseDTO.js';

class FeedbackDTO extends BaseDTO {
  static transformOne(feedback, options = {}) {
    if (!feedback) return null;

    const safe = {
      id: feedback._id?.toString(),
      userId: feedback.userId?.toString(),
      type: feedback.type,
      subject: feedback.subject,
      message: feedback.message,
      status: feedback.status,
      category: feedback.category,
      priority: feedback.priority,
      response: options.isAdmin || options.isOwner ? feedback.response : undefined,
      respondedAt: options.isAdmin || options.isOwner ? feedback.respondedAt : undefined,
      respondedBy: options.isAdmin ? feedback.respondedBy?.toString() : undefined,
    };

    if (options.includeTimestamps) {
      safe.createdAt = feedback.createdAt;
      safe.updatedAt = feedback.updatedAt;
    }

    return this.clean(safe);
  }
}

export default FeedbackDTO;
