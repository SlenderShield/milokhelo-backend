/**
 * Match Module
 */
import MatchModel from './infrastructure/persistence/MatchModel.js';
import MatchRepository from './infrastructure/persistence/MatchRepository.js';
import MatchService from './application/MatchService.js';
import MatchController from './infrastructure/http/MatchController.js';
import { createMatchRoutes } from './infrastructure/http/MatchRoutes.js';

function initializeMatchModule(container) {
  const logger = container.resolve('logger');
  const eventBus = container.resolve('eventBus');

  container.registerSingleton('matchRepository', () => {
    return new MatchRepository(logger);
  });

  container.registerSingleton('matchService', () => {
    const repository = container.resolve('matchRepository');
    return new MatchService(repository, eventBus, logger);
  });

  container.registerSingleton('matchController', () => {
    const service = container.resolve('matchService');
    return new MatchController(service, logger);
  });

  logger.info('Match module initialized');
}

export { MatchModel, MatchRepository, MatchService, MatchController, createMatchRoutes, initializeMatchModule };
