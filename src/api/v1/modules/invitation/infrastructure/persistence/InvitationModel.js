/**
 * Invitation Models
 * Mongoose models for invitations
 */
import mongoose from 'mongoose';

const invitationSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['match', 'tournament', 'team'], required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    message: String,
    status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
    expiresAt: Date,
  },
  { timestamps: true }
);

export const InvitationModel = mongoose.model('Invitation', invitationSchema);
export default InvitationModel;
