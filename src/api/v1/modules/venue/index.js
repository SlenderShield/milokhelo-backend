/**
 * Venue Module
 */
import { VenueModel, BookingModel } from './infrastructure/persistence/VenueModel.js';
import VenueRepository from './infrastructure/persistence/VenueRepository.js';
import VenueService from './application/VenueService.js';
import VenueController from './infrastructure/http/VenueController.js';
import { createVenueRoutes, createVenueManagementRoutes } from './infrastructure/http/VenueRoutes.js';

function initializeVenueModule(container) {
  const logger = container.resolve('logger');
  const eventBus = container.resolve('eventBus');

  container.registerSingleton('venueRepository', () => {
    return new VenueRepository(logger);
  });

  container.registerSingleton('venueService', () => {
    const repository = container.resolve('venueRepository');
    return new VenueService(repository, eventBus, logger);
  });

  container.registerSingleton('venueController', () => {
    const service = container.resolve('venueService');
    return new VenueController(service, logger);
  });

  logger.info('Venue module initialized');
}

export {
  VenueModel,
  BookingModel,
  VenueRepository,
  VenueService,
  VenueController,
  createVenueRoutes,
  createVenueManagementRoutes,
  initializeVenueModule,
};
