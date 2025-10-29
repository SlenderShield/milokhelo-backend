/**
 * Booking Conflict Error
 * Thrown when a booking time slot is already occupied
 */

export class BookingConflictError extends Error {
  constructor(message = 'Booking time slot is already occupied', conflictingBookings = []) {
    super(message);
    this.name = 'BookingConflictError';
    this.statusCode = 409;
    this.conflictingBookings = conflictingBookings;
    Error.captureStackTrace(this, this.constructor);
  }
}
