/**
 * Match Module
 */
import MatchModel from './model/match.model.js';
import { MatchRepository } from './repository/match.repository.js';
import { MatchService } from './service/match.service.js';
import { MatchController } from './controller/match.controller.js';
export { createMatchRoutes } from './routes/match.routes.js';

export function initializeMatchModule(container) {
  const logger = container.resolve('logger');
  const eventBus = container.resolve('eventBus');

  container.registerSingleton('matchRepository', () => new MatchRepository(logger));
  container.registerSingleton('matchService', () => {
    const repo = container.resolve('matchRepository');
    return new MatchService(repo, eventBus, logger);
  });
  container.registerSingleton('matchController', () => {
    const service = container.resolve('matchService');
    return new MatchController(service, logger);
  });

  logger.info('Match module initialized');
}

export { MatchModel, MatchRepository, MatchService, MatchController };
