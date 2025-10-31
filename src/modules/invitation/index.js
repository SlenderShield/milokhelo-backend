/**
 * Invitation Module
 */
import InvitationModel from './model/invitation.model.js';
import { InvitationRepository } from './repository/invitation.repository.js';
import { InvitationService } from './service/invitation.service.js';
import { InvitationController } from './controller/invitation.controller.js';
export { createInvitationRoutes } from './routes/invitation.routes.js';

export function initializeInvitationModule(container) {
  const logger = container.resolve('logger');
  const eventBus = container.resolve('eventBus');

  container.registerSingleton('invitationRepository', () => new InvitationRepository(logger));
  container.registerSingleton('invitationService', () => {
    const repo = container.resolve('invitationRepository');
    return new InvitationService(repo, eventBus, logger);
  });
  container.registerSingleton('invitationController', () => {
    const service = container.resolve('invitationService');
    return new InvitationController(service, logger);
  });

  logger.info('Invitation module initialized');
}

export { InvitationModel, InvitationRepository, InvitationService, InvitationController };
