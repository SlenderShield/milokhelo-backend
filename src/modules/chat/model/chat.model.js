/**
 * Chat Models
 * Mongoose models for chat rooms and messages
 */
import mongoose from 'mongoose';

const chatRoomSchema = new mongoose.Schema(
  {
    name: String,
    type: { type: String, enum: ['match', 'tournament', 'team', 'dm', 'group'], required: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    lastMessage: String,
    lastMessageAt: Date,
    mutedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const chatMessageSchema = new mongoose.Schema(
  {
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom', required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    messageType: { type: String, enum: ['text', 'image', 'video', 'system'], default: 'text' },
    attachments: [String],
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatMessage' },
    reactions: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        emoji: String,
      },
    ],
    deleted: { type: Boolean, default: false },
    editedAt: Date,
  },
  { timestamps: true }
);

export const ChatRoomModel = mongoose.model('ChatRoom', chatRoomSchema);
export const ChatMessageModel = mongoose.model('ChatMessage', chatMessageSchema);
export default ChatRoomModel;
