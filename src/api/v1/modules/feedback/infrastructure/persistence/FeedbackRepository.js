/**
 * Feedback Repository
 */
import { FeedbackModel } from './FeedbackModel.js';

class FeedbackRepository {
  constructor(logger) {
    this.logger = logger.child({ context: 'FeedbackRepository' });
  }

  async create(data) {
    const feedback = new FeedbackModel(data);
    await feedback.save();
    return feedback.toObject();
  }

  async findAll() {
    return FeedbackModel.find().lean();
  }

  async findById(id) {
    return FeedbackModel.findById(id).lean();
  }

  async findByUserId(userId) {
    return FeedbackModel.find({ userId }).lean();
  }
}

export default FeedbackRepository;
