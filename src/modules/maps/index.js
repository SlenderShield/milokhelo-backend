/**
 * Maps Module
 */
import MapsModel from './model/maps.model.js';
import { MapsRepository } from './repository/maps.repository.js';
import { MapsService } from './service/maps.service.js';
import { MapsController } from './controller/maps.controller.js';
export { createMapsRoutes } from './routes/maps.routes.js';

export function initializeMapsModule(container) {
  const logger = container.resolve('logger');
  const eventBus = container.resolve('eventBus');

  container.registerSingleton('mapsRepository', () => new MapsRepository(logger));
  container.registerSingleton('mapsService', () => {
    const repo = container.resolve('mapsRepository');
    return new MapsService(repo, eventBus, logger);
  });
  container.registerSingleton('mapsController', () => {
    const service = container.resolve('mapsService');
    return new MapsController(service, logger);
  });

  logger.info('Maps module initialized');
}

export { MapsModel, MapsRepository, MapsService, MapsController };
