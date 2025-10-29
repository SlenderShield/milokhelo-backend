/**
 * Tournament Module
 */
import TournamentModel from './infrastructure/persistence/TournamentModel.js';
import { TournamentRepository } from './infrastructure/persistence/TournamentRepository.js';
import { TournamentService } from './application/TournamentService.js';
import { TournamentController, createTournamentRoutes } from './infrastructure/http/TournamentController.js';

export function initializeTournamentModule(container) {
  const logger = container.resolve('logger');
  const eventBus = container.resolve('eventBus');

  container.registerSingleton('tournamentRepository', () => new TournamentRepository(logger));
  container.registerSingleton('tournamentService', () => {
    const repo = container.resolve('tournamentRepository');
    return new TournamentService(repo, eventBus, logger);
  });
  container.registerSingleton('tournamentController', () => {
    const service = container.resolve('tournamentService');
    return new TournamentController(service, logger);
  });

  logger.info('Tournament module initialized');
}

export { TournamentModel, TournamentRepository, TournamentService, TournamentController, createTournamentRoutes };
