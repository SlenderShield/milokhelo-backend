/**
 * Venue Module
 */
import VenueModel from './model/venue.model.js';
import { VenueRepository } from './repository/venue.repository.js';
import { VenueService } from './service/venue.service.js';
import { VenueController } from './controller/venue.controller.js';
export { createVenueRoutes, createVenueManagementRoutes } from './routes/venue.routes.js';

export function initializeVenueModule(container) {
  const logger = container.resolve('logger');
  const eventBus = container.resolve('eventBus');

  container.registerSingleton('venueRepository', () => new VenueRepository(logger));
  container.registerSingleton('venueService', () => {
    const repo = container.resolve('venueRepository');
    return new VenueService(repo, eventBus, logger);
  });
  container.registerSingleton('venueController', () => {
    const service = container.resolve('venueService');
    return new VenueController(service, logger);
  });

  logger.info('Venue module initialized');
}

export { VenueModel, VenueRepository, VenueService, VenueController };
