/**
 * Invitation Module
 */
import InvitationRepository from './infrastructure/persistence/InvitationRepository.js';
import InvitationService from './application/InvitationService.js';
import InvitationController from './infrastructure/http/InvitationController.js';
import { createInvitationRoutes } from './infrastructure/http/InvitationRoutes.js';

export function initializeInvitationModule(container) {
  const logger = container.resolve('logger');
  const eventBus = container.resolve('eventBus');

  container.registerSingleton('invitationRepository', () => {
    return new InvitationRepository(logger);
  });

  container.registerSingleton('invitationService', () => {
    const repository = container.resolve('invitationRepository');
    return new InvitationService(repository, eventBus, logger);
  });

  container.registerSingleton('invitationController', () => {
    const service = container.resolve('invitationService');
    return new InvitationController(service, logger);
  });

  logger.info('Invitation module initialized');
}

export { InvitationService, InvitationController, createInvitationRoutes };
