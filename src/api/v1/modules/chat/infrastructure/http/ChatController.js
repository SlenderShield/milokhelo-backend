/**
 * Chat Controller
 */
import { asyncHandler, HTTP_STATUS } from '@/core/http/index.js';

class ChatController {
  constructor(chatService, logger) {
    this.chatService = chatService;
    this.logger = logger.child({ context: 'ChatController' });
  }

  createRoom() {
    return asyncHandler(async (req, res) => {
      const room = await this.chatService.createRoom(req.body);
      res.status(HTTP_STATUS.CREATED).json(room);
    });
  }

  getRooms() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      const rooms = await this.chatService.getUserRooms(userId);
      res.status(HTTP_STATUS.OK).json(rooms);
    });
  }

  getRoomById() {
    return asyncHandler(async (req, res) => {
      const room = await this.chatService.getRoomById(req.params.roomId);
      res.status(HTTP_STATUS.OK).json(room);
    });
  }

  updateRoom() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      const room = await this.chatService.updateRoom(req.params.roomId, req.body, userId);
      res.status(HTTP_STATUS.OK).json(room);
    });
  }

  archiveRoom() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      await this.chatService.archiveRoom(req.params.roomId, userId);
      res.status(HTTP_STATUS.NO_CONTENT).send();
    });
  }

  getMessages() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      const { roomId } = req.params;
      const { limit, before } = req.query;
      const messages = await this.chatService.getMessages(
        roomId,
        userId,
        limit ? parseInt(limit) : 50,
        before
      );
      res.status(HTTP_STATUS.OK).json(messages);
    });
  }

  sendMessage() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      const { roomId } = req.params;
      const message = await this.chatService.sendMessage(roomId, userId, req.body);
      res.status(HTTP_STATUS.CREATED).json(message);
    });
  }

  editMessage() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      const { messageId } = req.params;
      const message = await this.chatService.editMessage(messageId, userId, req.body.content);
      res.status(HTTP_STATUS.OK).json(message);
    });
  }

  deleteMessage() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      const { messageId } = req.params;
      await this.chatService.deleteMessage(messageId, userId);
      res.status(HTTP_STATUS.NO_CONTENT).send();
    });
  }

  addReaction() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      const { messageId } = req.params;
      const { emoji } = req.body;
      const message = await this.chatService.addReaction(messageId, userId, emoji);
      res.status(HTTP_STATUS.OK).json(message);
    });
  }

  removeReaction() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      const { messageId } = req.params;
      const { emoji } = req.body;
      const message = await this.chatService.removeReaction(messageId, userId, emoji);
      res.status(HTTP_STATUS.OK).json(message);
    });
  }
}

export default ChatController;
