/**
 * Chat DTO (Data Transfer Object)
 * Transforms Chat/Message model data for safe client consumption
 */
import BaseDTO from './BaseDTO.js';

class ChatDTO extends BaseDTO {
  static transformOne(chat, options = {}) {
    if (!chat) return null;

    const safe = {
      id: chat._id?.toString(),
      roomId: chat.roomId?.toString(),
      senderId: chat.senderId?.toString(),
      message: chat.message,
      type: chat.type,
      attachments: chat.attachments,
      readBy: chat.readBy?.map((id) => id.toString()) || [],
      isEdited: chat.isEdited,
      editedAt: chat.editedAt,
      deletedAt: chat.deletedAt,
    };

    if (options.includeTimestamps) {
      safe.createdAt = chat.createdAt;
      safe.updatedAt = chat.updatedAt;
    }

    return this.clean(safe);
  }

  /**
   * Transform chat room data
   */
  static transformRoom(room) {
    if (!room) return null;

    const obj = room.toObject ? room.toObject() : room;

    return this.clean({
      id: obj._id?.toString(),
      name: obj.name,
      type: obj.type,
      participants: obj.participants?.map((p) => p.toString()) || [],
      lastMessage: obj.lastMessage,
      lastMessageAt: obj.lastMessageAt,
      createdAt: obj.createdAt,
    });
  }
}

export default ChatDTO;
