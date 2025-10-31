/**
 * Chat Service
 */
class ChatService {
  constructor(chatRepository, eventBus, logger) {
    this.chatRepository = chatRepository;
    this.eventBus = eventBus;
    this.logger = logger.child({ context: 'ChatService' });
  }

  async createRoom(data) {
    this.logger.info('Creating chat room', { type: data.type });
    
    const room = await this.chatRepository.createRoom(data);
    await this.eventBus.publish('chat.room_created', { roomId: room._id, participants: data.participants });
    
    return room;
  }

  async getRoomById(roomId) {
    return this.chatRepository.findRoomById(roomId);
  }

  async getUserRooms(userId) {
    return this.chatRepository.findUserRooms(userId);
  }

  async updateRoom(roomId, data, userId) {
    const room = await this.chatRepository.findRoomById(roomId);
    
    if (!room) {
      throw new Error('Room not found');
    }

    // Check if user is participant
    const isParticipant = room.participants.some(p => p._id.toString() === userId);
    if (!isParticipant) {
      throw new Error('Not authorized');
    }

    return this.chatRepository.updateRoom(roomId, data);
  }

  async archiveRoom(roomId, userId) {
    const room = await this.chatRepository.findRoomById(roomId);
    
    if (!room) {
      throw new Error('Room not found');
    }

    const isParticipant = room.participants.some(p => p._id.toString() === userId);
    if (!isParticipant) {
      throw new Error('Not authorized');
    }

    return this.chatRepository.archiveRoom(roomId);
  }

  async sendMessage(roomId, senderId, data) {
    this.logger.info('Sending message', { roomId, senderId });

    // Verify room exists and user is participant
    const room = await this.chatRepository.findRoomById(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    const isParticipant = room.participants.some(p => p._id.toString() === senderId);
    if (!isParticipant) {
      throw new Error('Not authorized');
    }

    const message = await this.chatRepository.createMessage({
      roomId,
      senderId,
      ...data,
    });

    await this.eventBus.publish('chat.message_sent', {
      roomId,
      messageId: message._id,
      senderId,
      content: message.content,
    });

    return message;
  }

  async getMessages(roomId, userId, limit = 50, before = null) {
    // Verify user is participant
    const room = await this.chatRepository.findRoomById(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    const isParticipant = room.participants.some(p => p._id.toString() === userId);
    if (!isParticipant) {
      throw new Error('Not authorized');
    }

    return this.chatRepository.findMessages(roomId, limit, before);
  }

  async editMessage(messageId, userId, content) {
    const message = await this.chatRepository.findMessageById(messageId);

    if (!message) {
      throw new Error('Message not found');
    }

    if (message.senderId.toString() !== userId) {
      throw new Error('Not authorized');
    }

    if (message.deleted) {
      throw new Error('Cannot edit deleted message');
    }

    const updated = await this.chatRepository.updateMessage(messageId, { content });
    
    await this.eventBus.publish('chat.message_edited', {
      messageId,
      roomId: message.roomId,
      senderId: userId,
    });

    return updated;
  }

  async deleteMessage(messageId, userId) {
    const message = await this.chatRepository.findMessageById(messageId);

    if (!message) {
      throw new Error('Message not found');
    }

    if (message.senderId.toString() !== userId) {
      throw new Error('Not authorized');
    }

    const deleted = await this.chatRepository.deleteMessage(messageId);
    
    await this.eventBus.publish('chat.message_deleted', {
      messageId,
      roomId: message.roomId,
      senderId: userId,
    });

    return deleted;
  }

  async addReaction(messageId, userId, emoji) {
    const message = await this.chatRepository.findMessageById(messageId);

    if (!message) {
      throw new Error('Message not found');
    }

    // Verify user is participant of the room
    const room = await this.chatRepository.findRoomById(message.roomId);
    const isParticipant = room.participants.some(p => p._id.toString() === userId);
    if (!isParticipant) {
      throw new Error('Not authorized');
    }

    return this.chatRepository.addReaction(messageId, userId, emoji);
  }

  async removeReaction(messageId, userId, emoji) {
    const message = await this.chatRepository.findMessageById(messageId);

    if (!message) {
      throw new Error('Message not found');
    }

    return this.chatRepository.removeReaction(messageId, userId, emoji);
  }
}

export default ChatService;
