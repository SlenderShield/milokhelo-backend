/**
 * Venue Service
 */
import { BookingConflictError } from '@/core/http/errors/BookingConflictError.js';

class VenueService {
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

  /**
   * Check venue availability for a specific date
   */
  async checkAvailability(venueId, date) {
    const bookings = await this.venueRepository.findBookings(venueId, date);
    
    const activeBookings = bookings.filter(b => 
      b.status === 'pending' || b.status === 'confirmed'
    );

    const bookedSlots = activeBookings.map((b) => ({
      bookingId: b._id,
      date: b.date,
      startTime: b.startTime,
      endTime: b.endTime,
      status: b.status,
      available: false,
    }));

    const availableSlots = this._generateAvailableSlots(bookedSlots);

    return {
      date,
      venueId,
      bookedSlots,
      availableSlots,
      totalBooked: bookedSlots.length,
      hasAvailability: availableSlots.length > 0,
    };
  }

  _generateAvailableSlots(bookedSlots) {
    const operatingStart = '08:00';
    const operatingEnd = '22:00';
    const slotDuration = 60;

    const slots = [];
    let currentTime = this._parseTime(operatingStart);
    const endTime = this._parseTime(operatingEnd);

    while (currentTime < endTime) {
      const nextTime = currentTime + slotDuration;
      const slotStart = this._formatTime(currentTime);
      const slotEnd = this._formatTime(nextTime);

      const hasConflict = bookedSlots.some(booked => 
        this._timeSlotsOverlap(slotStart, slotEnd, booked.startTime, booked.endTime)
      );

      if (!hasConflict) {
        slots.push({
          startTime: slotStart,
          endTime: slotEnd,
          available: true,
        });
      }

      currentTime = nextTime;
    }

    return slots;
  }

  _parseTime(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  _formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  _timeSlotsOverlap(start1, end1, start2, end2) {
    const s1 = this._parseTime(start1);
    const e1 = this._parseTime(end1);
    const s2 = this._parseTime(start2);
    const e2 = this._parseTime(end2);

    return s1 < e2 && s2 < e1;
  }

  _validateBookingTime(startTime, endTime) {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      throw new Error('Invalid time format. Use HH:MM format (e.g., 09:00, 14:30)');
    }

    const start = this._parseTime(startTime);
    const end = this._parseTime(endTime);

    if (start >= end) {
      throw new Error('End time must be after start time');
    }

    const duration = end - start;
    if (duration < 30) {
      throw new Error('Minimum booking duration is 30 minutes');
    }

    if (duration > 480) {
      throw new Error('Maximum booking duration is 8 hours');
    }

    return true;
  }

  async bookVenue(venueId, userId, bookingData) {
    const venue = await this.venueRepository.findById(venueId);
    if (!venue) {
      throw new Error('Venue not found');
    }

    if (venue.status !== 'active') {
      throw new Error('Venue is not available for booking');
    }

    this._validateBookingTime(bookingData.startTime, bookingData.endTime);

    const bookingDate = new Date(bookingData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (bookingDate < today) {
      throw new Error('Cannot book a date in the past');
    }

    try {
      const booking = await this.venueRepository.createBookingAtomic({ 
        venueId, 
        userId, 
        ...bookingData 
      });

      await this.eventBus.publish('venue.booked', { 
        venueId, 
        bookingId: booking._id, 
        userId,
        date: booking.date,
        timeSlot: `${booking.startTime}-${booking.endTime}`
      });

      this.logger.info('Venue booking created successfully', { 
        bookingId: booking._id,
        venueId,
        userId
      });

      return booking;
    } catch (error) {
      if (error instanceof BookingConflictError) {
        throw error;
      }
      
      this.logger.error('Error creating venue booking', { 
        error: error.message,
        venueId,
        userId
      });
      throw error;
    }
  }

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
    const updated = await this.venueRepository.update(venueId, data);
    await this.eventBus.publish('venue.updated', { venueId, data });
    return updated;
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
    const booking = await this.venueRepository.cancelBooking(bookingId, reason);
    await this.eventBus.publish('booking.rejected', { bookingId, userId, reason });
    return booking;
  }
}

export default VenueService;
