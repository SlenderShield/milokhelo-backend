/**
 * Venue Routes
 */
import express from 'express';

export function createVenueRoutes(venueController) {
  const router = express.Router();

  // User endpoints
  router.get('/', venueController.listVenues());
  router.get('/search', venueController.searchVenues());
  router.get('/nearby', venueController.findNearby());
  router.get('/:venueId', venueController.getById());
  router.get('/:venueId/availability', venueController.checkAvailability());
  router.post('/:venueId/book', venueController.bookVenue());

  return router;
}

export function createVenueManagementRoutes(venueController) {
  const router = express.Router();

  // Owner endpoints
  router.get('/venues', venueController.getMyVenues());
  router.post('/venues', venueController.createVenue());
  router.get('/venues/:venueId', venueController.getById());
  router.patch('/venues/:venueId', venueController.updateVenue());
  router.delete('/venues/:venueId', venueController.deleteVenue());
  router.get('/venues/:venueId/bookings', venueController.getVenueBookings());
  router.post('/bookings/:bookingId/approve', venueController.approveBooking());
  router.post('/bookings/:bookingId/reject', venueController.rejectBooking());

  return router;
}
