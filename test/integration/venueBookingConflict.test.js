/**
 * Integration Tests for Venue Booking Conflict Prevention
 * Tests atomic operations and concurrent booking scenarios
 */
import { describe, it, beforeAll, afterAll, beforeEach, expect } from '@jest/globals';
import mongoose from 'mongoose';
import { VenueRepository, VenueService } from '@/modules/venue/index.js';
import { VenueModel, BookingModel } from '@/modules/venue/infrastructure/persistence/VenueModel.js';
import { BookingConflictError } from '@/core/http/errors/BookingConflictError.js';

// Mock logger
const mockLogger = {
  child: () => mockLogger,
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock event bus
const mockEventBus = {
  publish: jest.fn().mockResolvedValue(undefined),
};

describe('Venue Booking Conflict Prevention', () => {
  let venueRepository;
  let venueService;
  let testVenueId;
  let testUserId;

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/milokhelo-test';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    venueRepository = new VenueRepository(mockLogger);
    venueService = new VenueService(venueRepository, mockEventBus, mockLogger);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clean up test data
    await BookingModel.deleteMany({});
    await VenueModel.deleteMany({});

    // Create test venue
    testUserId = new mongoose.Types.ObjectId();
    const venue = await venueRepository.create({
      name: 'Test Sports Center',
      description: 'A test venue for booking tests',
      ownerId: testUserId,
      address: '123 Test Street',
      city: 'Test City',
      location: {
        type: 'Point',
        coordinates: [-73.935242, 40.730610],
      },
      sportsSupported: ['football', 'basketball'],
      status: 'active',
      verified: true,
    });

    testVenueId = venue._id;
  });

  describe('Atomic Booking Creation', () => {
    it('should successfully create a booking when no conflicts exist', async () => {
      const bookingData = {
        date: new Date('2025-11-15'),
        startTime: '10:00',
        endTime: '11:00',
        sport: 'football',
        totalPrice: 50,
      };

      const booking = await venueService.bookVenue(
        testVenueId,
        testUserId,
        bookingData
      );

      expect(booking).toBeDefined();
      expect(booking._id).toBeDefined();
      expect(booking.venueId).toEqual(testVenueId);
      expect(booking.status).toBe('pending');
    });

    it('should prevent booking with exact time overlap', async () => {
      // Create first booking
      await venueService.bookVenue(testVenueId, testUserId, {
        date: new Date('2025-11-15'),
        startTime: '10:00',
        endTime: '11:00',
        sport: 'football',
      });

      // Try to create conflicting booking
      await expect(
        venueService.bookVenue(testVenueId, testUserId, {
          date: new Date('2025-11-15'),
          startTime: '10:00',
          endTime: '11:00',
          sport: 'basketball',
        })
      ).rejects.toThrow(BookingConflictError);
    });

    it('should prevent booking that starts during existing booking', async () => {
      await venueService.bookVenue(testVenueId, testUserId, {
        date: new Date('2025-11-15'),
        startTime: '10:00',
        endTime: '12:00',
      });

      await expect(
        venueService.bookVenue(testVenueId, testUserId, {
          date: new Date('2025-11-15'),
          startTime: '11:00',
          endTime: '13:00',
        })
      ).rejects.toThrow(BookingConflictError);
    });

    it('should prevent booking that ends during existing booking', async () => {
      await venueService.bookVenue(testVenueId, testUserId, {
        date: new Date('2025-11-15'),
        startTime: '12:00',
        endTime: '14:00',
      });

      await expect(
        venueService.bookVenue(testVenueId, testUserId, {
          date: new Date('2025-11-15'),
          startTime: '11:00',
          endTime: '13:00',
        })
      ).rejects.toThrow(BookingConflictError);
    });

    it('should prevent booking that completely contains existing booking', async () => {
      await venueService.bookVenue(testVenueId, testUserId, {
        date: new Date('2025-11-15'),
        startTime: '11:00',
        endTime: '12:00',
      });

      await expect(
        venueService.bookVenue(testVenueId, testUserId, {
          date: new Date('2025-11-15'),
          startTime: '10:00',
          endTime: '13:00',
        })
      ).rejects.toThrow(BookingConflictError);
    });

    it('should allow adjacent bookings without overlap', async () => {
      await venueService.bookVenue(testVenueId, testUserId, {
        date: new Date('2025-11-15'),
        startTime: '10:00',
        endTime: '11:00',
      });

      const secondBooking = await venueService.bookVenue(testVenueId, testUserId, {
        date: new Date('2025-11-15'),
        startTime: '11:00',
        endTime: '12:00',
      });

      expect(secondBooking).toBeDefined();
      expect(secondBooking._id).toBeDefined();
    });

    it('should allow same time slot on different dates', async () => {
      await venueService.bookVenue(testVenueId, testUserId, {
        date: new Date('2025-11-15'),
        startTime: '10:00',
        endTime: '11:00',
      });

      const secondBooking = await venueService.bookVenue(testVenueId, testUserId, {
        date: new Date('2025-11-16'),
        startTime: '10:00',
        endTime: '11:00',
      });

      expect(secondBooking).toBeDefined();
      expect(secondBooking._id).toBeDefined();
    });

    it('should not consider cancelled bookings as conflicts', async () => {
      const firstBooking = await venueService.bookVenue(testVenueId, testUserId, {
        date: new Date('2025-11-15'),
        startTime: '10:00',
        endTime: '11:00',
      });

      // Cancel the first booking
      await venueRepository.cancelBooking(firstBooking._id);

      // Should be able to book the same slot
      const secondBooking = await venueService.bookVenue(testVenueId, testUserId, {
        date: new Date('2025-11-15'),
        startTime: '10:00',
        endTime: '11:00',
      });

      expect(secondBooking).toBeDefined();
      expect(secondBooking._id).not.toEqual(firstBooking._id);
    });
  });

  describe('Concurrent Booking Attempts', () => {
    it('should handle concurrent booking attempts with race condition', async () => {
      const bookingData = {
        date: new Date('2025-11-15'),
        startTime: '10:00',
        endTime: '11:00',
      };

      // Simulate concurrent booking attempts
      const promises = [
        venueService.bookVenue(testVenueId, testUserId, bookingData),
        venueService.bookVenue(testVenueId, new mongoose.Types.ObjectId(), bookingData),
        venueService.bookVenue(testVenueId, new mongoose.Types.ObjectId(), bookingData),
      ];

      const results = await Promise.allSettled(promises);

      // Only one should succeed
      const successful = results.filter(r => r.status === 'fulfilled');
      const failed = results.filter(r => r.status === 'rejected');

      expect(successful.length).toBe(1);
      expect(failed.length).toBe(2);
      
      // Failed attempts should be due to conflict
      failed.forEach(result => {
        expect(result.reason).toBeInstanceOf(BookingConflictError);
      });
    });
  });

  describe('Booking Validation', () => {
    it('should reject booking with invalid time format', async () => {
      await expect(
        venueService.bookVenue(testVenueId, testUserId, {
          date: new Date('2025-11-15'),
          startTime: '25:00', // Invalid
          endTime: '11:00',
        })
      ).rejects.toThrow('Invalid time format');
    });

    it('should reject booking with end time before start time', async () => {
      await expect(
        venueService.bookVenue(testVenueId, testUserId, {
          date: new Date('2025-11-15'),
          startTime: '14:00',
          endTime: '13:00',
        })
      ).rejects.toThrow('End time must be after start time');
    });

    it('should reject booking with duration less than 30 minutes', async () => {
      await expect(
        venueService.bookVenue(testVenueId, testUserId, {
          date: new Date('2025-11-15'),
          startTime: '10:00',
          endTime: '10:15',
        })
      ).rejects.toThrow('Minimum booking duration is 30 minutes');
    });

    it('should reject booking with duration more than 8 hours', async () => {
      await expect(
        venueService.bookVenue(testVenueId, testUserId, {
          date: new Date('2025-11-15'),
          startTime: '08:00',
          endTime: '17:00',
        })
      ).rejects.toThrow('Maximum booking duration is 8 hours');
    });

    it('should reject booking in the past', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      await expect(
        venueService.bookVenue(testVenueId, testUserId, {
          date: pastDate,
          startTime: '10:00',
          endTime: '11:00',
        })
      ).rejects.toThrow('Cannot book a date in the past');
    });
  });

  describe('Booking Update with Conflict Prevention', () => {
    it('should successfully update booking time when no conflicts', async () => {
      const booking = await venueService.bookVenue(testVenueId, testUserId, {
        date: new Date('2025-11-15'),
        startTime: '10:00',
        endTime: '11:00',
      });

      const updated = await venueRepository.updateBookingAtomic(booking._id, {
        startTime: '12:00',
        endTime: '13:00',
      });

      expect(updated.startTime).toBe('12:00');
      expect(updated.endTime).toBe('13:00');
      expect(updated.__v).toBe(booking.__v + 1);
    });

    it('should prevent updating booking time to conflicting slot', async () => {
      // Create two bookings
      const booking1 = await venueService.bookVenue(testVenueId, testUserId, {
        date: new Date('2025-11-15'),
        startTime: '10:00',
        endTime: '11:00',
      });

      await venueService.bookVenue(testVenueId, testUserId, {
        date: new Date('2025-11-15'),
        startTime: '12:00',
        endTime: '13:00',
      });

      // Try to update first booking to conflict with second
      await expect(
        venueRepository.updateBookingAtomic(booking1._id, {
          startTime: '11:30',
          endTime: '12:30',
        })
      ).rejects.toThrow(BookingConflictError);
    });

    it('should handle optimistic locking on concurrent updates', async () => {
      const booking = await venueService.bookVenue(testVenueId, testUserId, {
        date: new Date('2025-11-15'),
        startTime: '10:00',
        endTime: '11:00',
      });

      // Simulate first update
      await venueRepository.updateBookingAtomic(booking._id, {
        notes: 'Updated note 1',
      });

      // Simulate second update with old version (should fail)
      await expect(
        BookingModel.findOneAndUpdate(
          { _id: booking._id, __v: booking.__v },
          { notes: 'Updated note 2', $inc: { __v: 1 } },
          { new: true }
        )
      ).resolves.toBeNull();
    });
  });

  describe('Availability Check', () => {
    it('should return correct availability information', async () => {
      await venueService.bookVenue(testVenueId, testUserId, {
        date: new Date('2025-11-15'),
        startTime: '10:00',
        endTime: '11:00',
      });

      await venueService.bookVenue(testVenueId, testUserId, {
        date: new Date('2025-11-15'),
        startTime: '14:00',
        endTime: '15:00',
      });

      const availability = await venueService.checkAvailability(
        testVenueId,
        new Date('2025-11-15')
      );

      expect(availability.bookedSlots).toHaveLength(2);
      expect(availability.availableSlots.length).toBeGreaterThan(0);
      expect(availability.hasAvailability).toBe(true);
      expect(availability.totalBooked).toBe(2);
    });
  });
});
