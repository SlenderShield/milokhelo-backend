/**
 * Venue Repository
 */
import { VenueModel, BookingModel } from './VenueModel.js';
import { BookingConflictError } from '../../../../../../core/http/errors/BookingConflictError.js';
import mongoose from 'mongoose';

class VenueRepository {
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

  /**
   * Check for booking conflicts with time overlap
   */
  async findConflictingBookings(venueId, date, startTime, endTime, excludeBookingId = null) {
    const query = {
      venueId,
      date: {
        $gte: new Date(date.setHours(0, 0, 0, 0)),
        $lt: new Date(date.setHours(23, 59, 59, 999)),
      },
      status: { $in: ['pending', 'confirmed'] },
      $or: [
        { startTime: { $lte: startTime }, endTime: { $gt: startTime } },
        { startTime: { $lt: endTime }, endTime: { $gte: endTime } },
        { startTime: { $gte: startTime }, endTime: { $lte: endTime } },
      ],
    };

    if (excludeBookingId) {
      query._id = { $ne: excludeBookingId };
    }

    return BookingModel.find(query).lean();
  }

  /**
   * Create a booking with atomic conflict check using MongoDB transaction
   */
  async createBookingAtomic(data) {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      const conflicts = await this.findConflictingBookings(
        data.venueId,
        new Date(data.date),
        data.startTime,
        data.endTime
      );

      if (conflicts.length > 0) {
        await session.abortTransaction();
        throw new BookingConflictError('This time slot is already booked', conflicts);
      }

      const booking = new BookingModel(data);
      await booking.save({ session });

      await session.commitTransaction();

      this.logger.info('Booking created successfully', {
        bookingId: booking._id,
        venueId: data.venueId,
      });

      return booking.toObject();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Update a booking with atomic conflict check
   */
  async updateBookingAtomic(bookingId, data) {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      const currentBooking = await BookingModel.findById(bookingId).session(session);

      if (!currentBooking) {
        await session.abortTransaction();
        throw new Error('Booking not found');
      }

      const isTimeChanged = data.startTime || data.endTime || data.date;

      if (isTimeChanged) {
        const checkDate = data.date ? new Date(data.date) : currentBooking.date;
        const checkStartTime = data.startTime || currentBooking.startTime;
        const checkEndTime = data.endTime || currentBooking.endTime;

        const conflicts = await this.findConflictingBookings(
          currentBooking.venueId,
          checkDate,
          checkStartTime,
          checkEndTime,
          bookingId
        );

        if (conflicts.length > 0) {
          await session.abortTransaction();
          throw new BookingConflictError(
            'The new time slot conflicts with existing bookings',
            conflicts
          );
        }
      }

      const updatedBooking = await BookingModel.findOneAndUpdate(
        {
          _id: bookingId,
          __v: currentBooking.__v,
        },
        {
          ...data,
          $inc: { __v: 1 },
        },
        {
          new: true,
          session,
        }
      );

      if (!updatedBooking) {
        await session.abortTransaction();
        throw new Error('Booking was modified by another request. Please try again.');
      }

      await session.commitTransaction();
      return updatedBooking.toObject();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async createBooking(data) {
    return this.createBookingAtomic(data);
  }

  async findBookings(venueId, date = null) {
    const query = { venueId };
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      query.date = {
        $gte: startOfDay,
        $lt: endOfDay,
      };
    }
    return BookingModel.find(query).lean();
  }

  async updateBooking(id, data) {
    if (Object.keys(data).length === 1 && data.status) {
      return BookingModel.findByIdAndUpdate(id, data, { new: true }).lean();
    }
    return this.updateBookingAtomic(id, data);
  }

  async cancelBooking(bookingId, reason = null) {
    const updates = {
      status: 'cancelled',
      $inc: { __v: 1 },
    };

    if (reason) {
      updates.notes = reason;
    }

    return BookingModel.findByIdAndUpdate(bookingId, updates, { new: true }).lean();
  }
}

export default VenueRepository;
