/**
 * Venue Module - Comprehensive Stubs with Geo-spatial Search
 */
import { VenueModel, BookingModel } from '../shared/models.js';
import { asyncHandler } from '../../../../common/utils/index.js';
import { HTTP_STATUS } from '../../../../common/constants/index.js';
import express from 'express';

// Repository
export class VenueRepository {
  constructor(logger) {
    this.logger = logger.child({ context: 'VenueRepository' });
  }

  async create(data) {
    const venue = new VenueModel(data);
    await venue.save();
    return venue.toObject();
  }

  async findById(id) {
    return VenueModel.findById(id).lean();
  }

  async find(query = {}) {
    return VenueModel.find(query).lean();
  }

  async search(searchTerm, filters = {}) {
    const query = {
      $or: [{ name: new RegExp(searchTerm, 'i') }, { city: new RegExp(searchTerm, 'i') }],
      ...filters,
    };
    return VenueModel.find(query).lean();
  }

  async findNearby(lng, lat, radiusInKm = 10, filters = {}) {
    return VenueModel.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: radiusInKm * 1000, // Convert km to meters
        },
      },
      ...filters,
    }).lean();
  }

  async update(id, data) {
    return VenueModel.findByIdAndUpdate(id, data, { new: true }).lean();
  }

  async delete(id) {
    return VenueModel.findByIdAndDelete(id);
  }

  async createBooking(data) {
    const booking = new BookingModel(data);
    await booking.save();
    return booking.toObject();
  }

  async findBookings(venueId, date = null) {
    const query = { venueId };
    if (date) {
      query.date = { $gte: new Date(date), $lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1)) };
    }
    return BookingModel.find(query).lean();
  }

  async updateBooking(id, data) {
    return BookingModel.findByIdAndUpdate(id, data, { new: true }).lean();
  }
}

// Service
export class VenueService {
  constructor(venueRepository, eventBus, logger) {
    this.venueRepository = venueRepository;
    this.eventBus = eventBus;
    this.logger = logger.child({ context: 'VenueService' });
  }

  async listVenues(_page = 1, _limit = 20) {
    // TODO: Implement pagination
    return this.venueRepository.find({ status: 'active', verified: true });
  }

  async searchVenues(searchTerm, filters = {}) {
    return this.venueRepository.search(searchTerm, { status: 'active', verified: true, ...filters });
  }

  async findNearby(lat, lng, radius = 10, sport = null) {
    const filters = { status: 'active', verified: true };
    if (sport) filters.sportsSupported = sport;
    return this.venueRepository.findNearby(lng, lat, radius, filters);
  }

  async getVenueById(id) {
    return this.venueRepository.findById(id);
  }

  async checkAvailability(venueId, date) {
    const bookings = await this.venueRepository.findBookings(venueId, date);
    // TODO: Generate slot availability based on bookings
    return bookings.map((b) => ({
      date: b.date,
      startTime: b.startTime,
      endTime: b.endTime,
      available: false,
    }));
  }

  async bookVenue(venueId, userId, bookingData) {
    const booking = await this.venueRepository.createBooking({ venueId, userId, ...bookingData });
    await this.eventBus.publish('venue.booked', { venueId, bookingId: booking._id, userId });
    return booking;
  }

  // Owner/Manager Methods
  async createVenue(data, ownerId) {
    const venue = await this.venueRepository.create({ ...data, ownerId });
    await this.eventBus.publish('venue.created', { venueId: venue._id, ownerId });
    return venue;
  }

  async updateVenue(venueId, data, userId) {
    const venue = await this.venueRepository.findById(venueId);
    if (!venue || venue.ownerId.toString() !== userId) {
      throw new Error('Not authorized');
    }
    return this.venueRepository.update(venueId, data);
  }

  async deleteVenue(venueId, userId) {
    const venue = await this.venueRepository.findById(venueId);
    if (!venue || venue.ownerId.toString() !== userId) {
      throw new Error('Not authorized');
    }
    await this.venueRepository.delete(venueId);
    await this.eventBus.publish('venue.deleted', { venueId });
  }

  async getVenueBookings(venueId, userId, date = null) {
    const venue = await this.venueRepository.findById(venueId);
    if (!venue || venue.ownerId.toString() !== userId) {
      throw new Error('Not authorized');
    }
    return this.venueRepository.findBookings(venueId, date);
  }

  async approveBooking(bookingId, userId) {
    // TODO: Check venue ownership
    const booking = await this.venueRepository.updateBooking(bookingId, { status: 'confirmed' });
    await this.eventBus.publish('booking.approved', { bookingId, userId });
    return booking;
  }

  async rejectBooking(bookingId, userId, reason) {
    // TODO: Check venue ownership
    const booking = await this.venueRepository.updateBooking(bookingId, { status: 'cancelled', notes: reason });
    await this.eventBus.publish('booking.rejected', { bookingId, userId, reason });
    return booking;
  }
}

// Controller
export class VenueController {
  constructor(venueService, logger) {
    this.venueService = venueService;
    this.logger = logger.child({ context: 'VenueController' });
  }

  // User-facing endpoints
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
      const venues = await this.venueService.findNearby(parseFloat(lat), parseFloat(lng), parseFloat(radius || 10), sport);
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

  // Owner/Manager endpoints
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

// Routes
export function createVenueRoutes(controller) {
  const router = express.Router();
  // User endpoints
  router.get('/', controller.listVenues());
  router.get('/search', controller.searchVenues());
  router.get('/nearby', controller.findNearby());
  router.get('/:venueId', controller.getById());
  router.get('/:venueId/availability', controller.checkAvailability());
  router.post('/:venueId/book', controller.bookVenue());
  return router;
}

export function createVenueManagementRoutes(controller) {
  const router = express.Router();
  // Owner endpoints
  router.get('/venues', controller.getMyVenues());
  router.post('/venues', controller.createVenue());
  router.get('/venues/:venueId', controller.getById());
  router.patch('/venues/:venueId', controller.updateVenue());
  router.delete('/venues/:venueId', controller.deleteVenue());
  router.get('/venues/:venueId/bookings', controller.getVenueBookings());
  router.post('/bookings/:bookingId/approve', controller.approveBooking());
  router.post('/bookings/:bookingId/reject', controller.rejectBooking());
  return router;
}

// Module Initializer
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
