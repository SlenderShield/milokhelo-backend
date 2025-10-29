/**
 * Chat Module
 */
import { ChatRoomModel, ChatMessageModel } from './infrastructure/persistence/ChatModel.js';
import ChatRepository from './infrastructure/persistence/ChatRepository.js';
import ChatService from './application/ChatService.js';
import ChatController from './infrastructure/http/ChatController.js';
import { createChatRoutes } from './infrastructure/http/ChatRoutes.js';

function initializeChatModule(container) {
  const logger = container.resolve('logger');
  const eventBus = container.resolve('eventBus');

  container.registerSingleton('chatRepository', () => {
    return new ChatRepository(logger);
  });

  container.registerSingleton('chatService', () => {
    const repository = container.resolve('chatRepository');
    return new ChatService(repository, eventBus, logger);
  });

  container.registerSingleton('chatController', () => {
    const service = container.resolve('chatService');
    return new ChatController(service, logger);
  });

  logger.info('Chat module initialized');
}

export { ChatRoomModel, ChatMessageModel, ChatRepository, ChatService, ChatController, createChatRoutes, initializeChatModule };

