/**
 * Chat Routes
 */
import express from 'express';

export function createChatRoutes(chatController) {
  const router = express.Router();

  // Room routes
  router.post('/rooms', chatController.createRoom());
  router.get('/rooms', chatController.getRooms());
  router.get('/rooms/:roomId', chatController.getRoomById());
  router.patch('/rooms/:roomId', chatController.updateRoom());
  router.delete('/rooms/:roomId', chatController.archiveRoom());

  // Message routes
  router.get('/rooms/:roomId/messages', chatController.getMessages());
  router.post('/rooms/:roomId/messages', chatController.sendMessage());
  router.patch('/messages/:messageId', chatController.editMessage());
  router.delete('/messages/:messageId', chatController.deleteMessage());

  // Reaction routes
  router.post('/messages/:messageId/reactions', chatController.addReaction());
  router.delete('/messages/:messageId/reactions', chatController.removeReaction());

  return router;
}
