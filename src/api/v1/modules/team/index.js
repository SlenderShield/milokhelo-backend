/**
 * Team Module
 */
import TeamModel from './infrastructure/persistence/TeamModel.js';
import TeamRepository from './infrastructure/persistence/TeamRepository.js';
import TeamService from './application/TeamService.js';
import TeamController from './infrastructure/http/TeamController.js';
import { createTeamRoutes } from './infrastructure/http/TeamRoutes.js';

function initializeTeamModule(container) {
  const logger = container.resolve('logger');
  const eventBus = container.resolve('eventBus');

  container.registerSingleton('teamRepository', () => {
    return new TeamRepository(logger);
  });

  container.registerSingleton('teamService', () => {
    const repository = container.resolve('teamRepository');
    return new TeamService(repository, eventBus, logger);
  });

  container.registerSingleton('teamController', () => {
    const service = container.resolve('teamService');
    return new TeamController(service, logger);
  });

  logger.info('Team module initialized');
}

export { TeamModel, TeamRepository, TeamService, TeamController, createTeamRoutes, initializeTeamModule };
