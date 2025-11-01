/**
 * Feedback Models
 * Mongoose models for user feedback
 */
import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['bug', 'suggestion', 'report'], required: true },
    message: { type: String, required: true },
    relatedTo: {
      type: { type: String, enum: ['match', 'tournament', 'venue', 'user'] },
      id: mongoose.Schema.Types.ObjectId,
    },
    status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
  },
  { timestamps: true }
);

export const FeedbackModel = mongoose.model('Feedback', feedbackSchema);
export default FeedbackModel;
