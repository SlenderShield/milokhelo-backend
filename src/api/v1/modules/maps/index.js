/**
 * Maps Module
 */
import MapsRepository from './infrastructure/persistence/MapsRepository.js';
import MapsService from './application/MapsService.js';
import MapsController from './infrastructure/http/MapsController.js';
import { createMapsRoutes } from './infrastructure/http/MapsRoutes.js';

export function initializeMapsModule(container) {
  const logger = container.resolve('logger');

  container.registerSingleton('mapsRepository', () => {
    return new MapsRepository(logger);
  });

  container.registerSingleton('mapsService', () => {
    const repository = container.resolve('mapsRepository');
    return new MapsService(repository, logger);
  });

  container.registerSingleton('mapsController', () => {
    const service = container.resolve('mapsService');
    return new MapsController(service, logger);
  });

  logger.info('Maps module initialized');
}

export { MapsService, MapsController, createMapsRoutes };
