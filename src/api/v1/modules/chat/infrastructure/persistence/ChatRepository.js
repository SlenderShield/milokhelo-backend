/**
 * Chat Repository
 */
import { ChatRoomModel, ChatMessageModel } from './ChatModel.js';

class ChatRepository {
  constructor(logger) {
    this.logger = logger.child({ context: 'ChatRepository' });
  }

  async createRoom(data) {
    const room = new ChatRoomModel(data);
    await room.save();
    return room.toObject();
  }

  async findRoomById(id) {
    return ChatRoomModel.findById(id).populate('participants', 'username displayName avatar').lean();
  }

  async findUserRooms(userId) {
    return ChatRoomModel.find({ participants: userId, isArchived: false })
      .populate('participants', 'username displayName avatar')
      .sort({ lastMessageAt: -1 })
      .lean();
  }

  async updateRoom(id, data) {
    return ChatRoomModel.findByIdAndUpdate(id, data, { new: true }).lean();
  }

  async archiveRoom(id) {
    return ChatRoomModel.findByIdAndUpdate(id, { isArchived: true }, { new: true }).lean();
  }

  async createMessage(data) {
    const message = new ChatMessageModel(data);
    await message.save();
    
    // Update room's last message
    await ChatRoomModel.findByIdAndUpdate(data.roomId, {
      lastMessage: data.content,
      lastMessageAt: new Date(),
    });
    
    return message.toObject();
  }

  async findMessages(roomId, limit = 50, before = null) {
    const query = { roomId, deleted: false };
    if (before) query.createdAt = { $lt: new Date(before) };
    
    return ChatMessageModel.find(query)
      .populate('senderId', 'username displayName avatar')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  async findMessageById(id) {
    return ChatMessageModel.findById(id).lean();
  }

  async updateMessage(id, data) {
    return ChatMessageModel.findByIdAndUpdate(
      id,
      { ...data, editedAt: new Date() },
      { new: true }
    ).lean();
  }

  async deleteMessage(id) {
    return ChatMessageModel.findByIdAndUpdate(
      id,
      { deleted: true },
      { new: true }
    ).lean();
  }

  async addReaction(messageId, userId, emoji) {
    return ChatMessageModel.findByIdAndUpdate(
      messageId,
      { $addToSet: { reactions: { userId, emoji } } },
      { new: true }
    ).lean();
  }

  async removeReaction(messageId, userId, emoji) {
    return ChatMessageModel.findByIdAndUpdate(
      messageId,
      { $pull: { reactions: { userId, emoji } } },
      { new: true }
    ).lean();
  }
}

export default ChatRepository;
