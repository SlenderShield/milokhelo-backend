/**
 * Team Module
 */
import TeamModel from './model/team.model.js';
import { TeamRepository } from './repository/team.repository.js';
import { TeamService } from './service/team.service.js';
import { TeamController } from './controller/team.controller.js';
export { createTeamRoutes } from './routes/team.routes.js';

export function initializeTeamModule(container) {
  const logger = container.resolve('logger');
  const eventBus = container.resolve('eventBus');

  container.registerSingleton('teamRepository', () => new TeamRepository(logger));
  container.registerSingleton('teamService', () => {
    const repo = container.resolve('teamRepository');
    return new TeamService(repo, eventBus, logger);
  });
  container.registerSingleton('teamController', () => {
    const service = container.resolve('teamService');
    return new TeamController(service, logger);
  });

  logger.info('Team module initialized');
}

export { TeamModel, TeamRepository, TeamService, TeamController };
