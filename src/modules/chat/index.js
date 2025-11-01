/**
 * Chat Module
 */
import ChatModel from './model/chat.model.js';
import { ChatRepository } from './repository/chat.repository.js';
import { ChatService } from './service/chat.service.js';
import { ChatController } from './controller/chat.controller.js';
export { createChatRoutes } from './routes/chat.routes.js';

export function initializeChatModule(container) {
  const logger = container.resolve('logger');
  const eventBus = container.resolve('eventBus');

  container.registerSingleton('chatRepository', () => new ChatRepository(logger));
  container.registerSingleton('chatService', () => {
    const repo = container.resolve('chatRepository');
    return new ChatService(repo, eventBus, logger);
  });
  container.registerSingleton('chatController', () => {
    const service = container.resolve('chatService');
    return new ChatController(service, logger);
  });

  logger.info('Chat module initialized');
}

export { ChatModel, ChatRepository, ChatService, ChatController };
