/**
 * Tournament Module
 */
import TournamentModel from './model/tournament.model.js';
import { TournamentRepository } from './repository/tournament.repository.js';
import { TournamentService } from './service/tournament.service.js';
import { TournamentController, createTournamentRoutes } from './controller/tournament.controller.js';
import { BracketGenerator } from './service/bracketGenerator.service.js';

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

export { 
  TournamentModel, 
  TournamentRepository, 
  TournamentService, 
  TournamentController, 
  createTournamentRoutes,
  BracketGenerator 
};
