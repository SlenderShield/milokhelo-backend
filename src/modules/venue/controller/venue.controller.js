/**
 * Venue Controller
 */
import { asyncHandler, HTTP_STATUS } from '@/core/http/index.js';

class VenueController {
  constructor(venueService, logger) {
    this.venueService = venueService;
    this.logger = logger.child({ context: 'VenueController' });
  }

  listVenues() {
    return asyncHandler(async (req, res) => {
      const { page, limit } = req.query;
      const venues = await this.venueService.listVenues(page, limit);
      res.status(HTTP_STATUS.OK).json(venues);
    });
  }

  searchVenues() {
    return asyncHandler(async (req, res) => {
      const { q, city, sport } = req.query;
      const filters = {};
      if (city) filters.city = city;
      if (sport) filters.sportsSupported = sport;
      const venues = await this.venueService.searchVenues(q || '', filters);
      res.status(HTTP_STATUS.OK).json(venues);
    });
  }

  findNearby() {
    return asyncHandler(async (req, res) => {
      const { lat, lng, radius, sport } = req.query;
      const venues = await this.venueService.findNearby(
        parseFloat(lat),
        parseFloat(lng),
        parseFloat(radius || 10),
        sport
      );
      res.status(HTTP_STATUS.OK).json(venues);
    });
  }

  getById() {
    return asyncHandler(async (req, res) => {
      const venue = await this.venueService.getVenueById(req.params.venueId);
      res.status(HTTP_STATUS.OK).json(venue);
    });
  }

  checkAvailability() {
    return asyncHandler(async (req, res) => {
      const { venueId } = req.params;
      const { date } = req.query;
      const availability = await this.venueService.checkAvailability(venueId, date);
      res.status(HTTP_STATUS.OK).json(availability);
    });
  }

  bookVenue() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      const { venueId } = req.params;
      const booking = await this.venueService.bookVenue(venueId, userId, req.body);
      res.status(HTTP_STATUS.CREATED).json(booking);
    });
  }

  getMyVenues() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      const venues = await this.venueService.venueRepository.find({ ownerId: userId });
      res.status(HTTP_STATUS.OK).json(venues);
    });
  }

  createVenue() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      const venue = await this.venueService.createVenue(req.body, userId);
      res.status(HTTP_STATUS.CREATED).json(venue);
    });
  }

  updateVenue() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      const venue = await this.venueService.updateVenue(req.params.venueId, req.body, userId);
      res.status(HTTP_STATUS.OK).json(venue);
    });
  }

  deleteVenue() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      await this.venueService.deleteVenue(req.params.venueId, userId);
      res.status(HTTP_STATUS.NO_CONTENT).send();
    });
  }

  getVenueBookings() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      const { venueId } = req.params;
      const { date } = req.query;
      const bookings = await this.venueService.getVenueBookings(venueId, userId, date);
      res.status(HTTP_STATUS.OK).json(bookings);
    });
  }

  approveBooking() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      const booking = await this.venueService.approveBooking(req.params.bookingId, userId);
      res.status(HTTP_STATUS.OK).json(booking);
    });
  }

  rejectBooking() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      const { reason } = req.body;
      const booking = await this.venueService.rejectBooking(req.params.bookingId, userId, reason);
      res.status(HTTP_STATUS.OK).json(booking);
    });
  }
}

export default VenueController;
