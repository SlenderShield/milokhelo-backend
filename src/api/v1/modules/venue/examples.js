/**
 * Example Usage: Venue Booking with Conflict Prevention
 * 
 * This file demonstrates how to use the venue booking system with
 * proper conflict prevention, error handling, and best practices.
 */

import { VenueService, VenueRepository, VenueController, createVenueRoutes } from './modules/venue/index.js';
import { BookingConflictError } from '../core/http/errors/BookingConflictError.js';

// ============================================================
// Example 1: Basic Booking Creation
// ============================================================

async function createBasicBooking(venueService, venueId, userId) {
  console.log('Example 1: Creating a basic booking...');
  
  try {
    const booking = await venueService.bookVenue(
      venueId,
      userId,
      {
        date: new Date('2025-11-15'),
        startTime: '10:00',
        endTime: '11:00',
        sport: 'football',
        totalPrice: 50,
        notes: 'Team practice session',
      }
    );
    
    console.log('✅ Booking created successfully:', booking._id);
    return booking;
  } catch (error) {
    if (error instanceof BookingConflictError) {
      console.error('❌ Conflict detected:', error.message);
      console.error('Conflicting bookings:', error.conflictingBookings);
    } else {
      console.error('❌ Booking failed:', error.message);
    }
    throw error;
  }
}

// ============================================================
// Example 2: Check Availability Before Booking
// ============================================================

async function smartBooking(venueService, venueId, userId, preferredTime) {
  console.log('Example 2: Smart booking with availability check...');
  
  // Step 1: Check availability
  const availability = await venueService.checkAvailability(
    venueId,
    preferredTime.date
  );
  
  console.log(`Total booked slots: ${availability.totalBooked}`);
  console.log(`Has availability: ${availability.hasAvailability}`);
  
  if (!availability.hasAvailability) {
    console.log('❌ Venue is fully booked for this date');
    return null;
  }
  
  // Step 2: Check if preferred time is available
  const isSlotAvailable = availability.availableSlots.some(slot =>
    slot.startTime === preferredTime.startTime &&
    slot.endTime === preferredTime.endTime
  );
  
  if (!isSlotAvailable) {
    console.log('⚠️ Preferred time slot is not available');
    console.log('Available slots:', availability.availableSlots);
    
    // Suggest alternative
    if (availability.availableSlots.length > 0) {
      const alternative = availability.availableSlots[0];
      console.log(`Suggesting alternative: ${alternative.startTime} - ${alternative.endTime}`);
    }
    
    return null;
  }
  
  // Step 3: Book the venue
  try {
    const booking = await venueService.bookVenue(
      venueId,
      userId,
      preferredTime
    );
    
    console.log('✅ Booking created:', booking._id);
    return booking;
  } catch (error) {
    // Even with pre-check, conflicts can occur due to race conditions
    if (error instanceof BookingConflictError) {
      console.log('❌ Slot was booked by another user just now');
    }
    throw error;
  }
}

// ============================================================
// Example 3: Handle Concurrent Booking Attempts
// ============================================================

async function handleConcurrentBookings(venueService, venueId, userIds) {
  console.log('Example 3: Handling concurrent booking attempts...');
  
  const bookingData = {
    date: new Date('2025-11-16'),
    startTime: '14:00',
    endTime: '15:00',
    sport: 'basketball',
  };
  
  // Simulate 3 users trying to book the same slot
  const bookingPromises = userIds.map(userId =>
    venueService.bookVenue(venueId, userId, bookingData)
      .then(booking => ({ success: true, booking, userId }))
      .catch(error => ({ success: false, error, userId }))
  );
  
  const results = await Promise.all(bookingPromises);
  
  // Analyze results
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful bookings: ${successful.length}`);
  console.log(`❌ Failed bookings: ${failed.length}`);
  
  successful.forEach(result => {
    console.log(`  User ${result.userId}: Booking created ${result.booking._id}`);
  });
  
  failed.forEach(result => {
    if (result.error instanceof BookingConflictError) {
      console.log(`  User ${result.userId}: Conflict detected`);
    }
  });
  
  return results;
}

// ============================================================
// Example 4: Update Booking with Conflict Check
// ============================================================

async function updateBookingTime(venueRepository, bookingId, newTime) {
  console.log('Example 4: Updating booking time...');
  
  try {
    const updated = await venueRepository.updateBookingAtomic(
      bookingId,
      {
        startTime: newTime.startTime,
        endTime: newTime.endTime,
      }
    );
    
    console.log('✅ Booking updated successfully');
    console.log(`New time: ${updated.startTime} - ${updated.endTime}`);
    console.log(`Version: ${updated.__v}`);
    
    return updated;
  } catch (error) {
    if (error instanceof BookingConflictError) {
      console.error('❌ New time conflicts with existing booking');
      console.error('Conflicts:', error.conflictingBookings);
    } else if (error.message.includes('modified by another request')) {
      console.error('❌ Booking was modified concurrently, please retry');
    } else {
      console.error('❌ Update failed:', error.message);
    }
    throw error;
  }
}

// ============================================================
// Example 5: Booking with Retry Logic
// ============================================================

async function bookWithRetry(venueService, venueId, userId, bookingData, maxRetries = 3) {
  console.log('Example 5: Booking with retry logic...');
  
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries}...`);
      
      const booking = await venueService.bookVenue(
        venueId,
        userId,
        bookingData
      );
      
      console.log('✅ Booking successful on attempt', attempt);
      return booking;
      
    } catch (error) {
      lastError = error;
      
      // Don't retry on conflicts (permanent failure)
      if (error instanceof BookingConflictError) {
        console.log('❌ Conflict detected - not retrying');
        break;
      }
      
      // Don't retry on validation errors
      if (error.message.includes('Invalid time format') || 
          error.message.includes('duration')) {
        console.log('❌ Validation error - not retrying');
        break;
      }
      
      // Retry on transient errors with exponential backoff
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
        console.log(`⏳ Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }
  
  console.error('❌ All retry attempts failed');
  throw lastError;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
// Example 6: Batch Availability Check
// ============================================================

async function checkMultipleDates(venueService, venueId, dates) {
  console.log('Example 6: Checking availability for multiple dates...');
  
  const availabilityPromises = dates.map(date =>
    venueService.checkAvailability(venueId, date)
      .then(availability => ({ date, availability }))
  );
  
  const results = await Promise.all(availabilityPromises);
  
  results.forEach(({ date, availability }) => {
    const dateStr = date.toISOString().split('T')[0];
    console.log(`\n📅 ${dateStr}:`);
    console.log(`  Booked: ${availability.totalBooked} slots`);
    console.log(`  Available: ${availability.availableSlots.length} slots`);
    
    if (availability.hasAvailability) {
      console.log('  ✅ Has availability');
    } else {
      console.log('  ❌ Fully booked');
    }
  });
  
  return results;
}

// ============================================================
// Example 7: Find Alternative Time Slots
// ============================================================

async function findAlternatives(venueService, venueId, preferredBooking, requiredDuration) {
  console.log('Example 7: Finding alternative time slots...');
  
  const availability = await venueService.checkAvailability(
    venueId,
    preferredBooking.date
  );
  
  // Parse preferred time
  const [preferredHour, preferredMin] = preferredBooking.startTime.split(':').map(Number);
  const preferredTimeMinutes = preferredHour * 60 + preferredMin;
  
  // Find slots with required duration, sorted by proximity to preferred time
  const alternatives = availability.availableSlots
    .filter(slot => {
      // Calculate slot duration
      const [startHour, startMin] = slot.startTime.split(':').map(Number);
      const [endHour, endMin] = slot.endTime.split(':').map(Number);
      const duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);
      return duration >= requiredDuration;
    })
    .map(slot => {
      // Calculate time difference from preferred
      const [startHour, startMin] = slot.startTime.split(':').map(Number);
      const slotTimeMinutes = startHour * 60 + startMin;
      const timeDiff = Math.abs(slotTimeMinutes - preferredTimeMinutes);
      return { ...slot, timeDiff };
    })
    .sort((a, b) => a.timeDiff - b.timeDiff)
    .slice(0, 3); // Top 3 alternatives
  
  console.log(`Found ${alternatives.length} alternative slots:`);
  alternatives.forEach((alt, i) => {
    console.log(`  ${i + 1}. ${alt.startTime} - ${alt.endTime} (${alt.timeDiff} min difference)`);
  });
  
  return alternatives;
}

// ============================================================
// Example 8: Venue Owner - Manage Bookings
// ============================================================

async function manageVenueBookings(venueService, venueRepository, venueId, ownerId) {
  console.log('Example 8: Managing venue bookings (owner view)...');
  
  // Get all bookings for today
  const today = new Date();
  const bookings = await venueService.getVenueBookings(venueId, ownerId, today);
  
  console.log(`📋 Total bookings today: ${bookings.length}`);
  
  // Group by status
  const pending = bookings.filter(b => b.status === 'pending');
  const confirmed = bookings.filter(b => b.status === 'confirmed');
  const cancelled = bookings.filter(b => b.status === 'cancelled');
  
  console.log(`  Pending: ${pending.length}`);
  console.log(`  Confirmed: ${confirmed.length}`);
  console.log(`  Cancelled: ${cancelled.length}`);
  
  // Approve first pending booking
  if (pending.length > 0) {
    const booking = pending[0];
    console.log(`\n✅ Approving booking ${booking._id}...`);
    
    await venueService.approveBooking(booking._id, ownerId);
    console.log('Booking approved');
  }
  
  return { bookings, pending, confirmed, cancelled };
}

// ============================================================
// Example 9: Handle Validation Errors
// ============================================================

async function demonstrateValidation(venueService, venueId, userId) {
  console.log('Example 9: Demonstrating validation...');
  
  const testCases = [
    {
      name: 'Invalid time format',
      data: { date: new Date(), startTime: '25:00', endTime: '11:00' },
      expectedError: 'Invalid time format',
    },
    {
      name: 'End before start',
      data: { date: new Date(), startTime: '14:00', endTime: '13:00' },
      expectedError: 'End time must be after start time',
    },
    {
      name: 'Too short duration',
      data: { date: new Date(), startTime: '10:00', endTime: '10:15' },
      expectedError: 'Minimum booking duration',
    },
    {
      name: 'Too long duration',
      data: { date: new Date(), startTime: '08:00', endTime: '17:00' },
      expectedError: 'Maximum booking duration',
    },
    {
      name: 'Past date',
      data: { 
        date: new Date(Date.now() - 86400000), // Yesterday
        startTime: '10:00', 
        endTime: '11:00' 
      },
      expectedError: 'Cannot book a date in the past',
    },
  ];
  
  for (const testCase of testCases) {
    try {
      await venueService.bookVenue(venueId, userId, testCase.data);
      console.log(`❌ ${testCase.name}: Should have failed`);
    } catch (error) {
      if (error.message.includes(testCase.expectedError)) {
        console.log(`✅ ${testCase.name}: Correctly validated`);
      } else {
        console.log(`⚠️ ${testCase.name}: Unexpected error - ${error.message}`);
      }
    }
  }
}

// ============================================================
// Example 10: Complete Booking Flow (Best Practice)
// ============================================================

async function completeBookingFlow(venueService, venueId, userId) {
  console.log('Example 10: Complete booking flow (best practice)...');
  
  const bookingData = {
    date: new Date('2025-11-20'),
    startTime: '15:00',
    endTime: '16:00',
    sport: 'tennis',
    totalPrice: 75,
    notes: 'Singles match',
  };
  
  try {
    // Step 1: Validate venue
    console.log('1️⃣ Validating venue...');
    const venue = await venueService.getVenueById(venueId);
    
    if (!venue) {
      throw new Error('Venue not found');
    }
    
    if (venue.status !== 'active') {
      throw new Error('Venue is not available for booking');
    }
    
    console.log(`   ✅ Venue: ${venue.name}`);
    
    // Step 2: Check availability
    console.log('2️⃣ Checking availability...');
    const availability = await venueService.checkAvailability(
      venueId,
      bookingData.date
    );
    
    const isAvailable = availability.availableSlots.some(slot =>
      slot.startTime === bookingData.startTime &&
      slot.endTime === bookingData.endTime
    );
    
    if (!isAvailable) {
      console.log('   ❌ Time slot not available');
      
      // Find alternatives
      const alternatives = await findAlternatives(
        venueService,
        venueId,
        bookingData,
        60 // 60 minutes required
      );
      
      if (alternatives.length > 0) {
        console.log('   💡 Consider these alternatives:');
        alternatives.forEach(alt => {
          console.log(`      - ${alt.startTime} to ${alt.endTime}`);
        });
      }
      
      return null;
    }
    
    console.log('   ✅ Time slot is available');
    
    // Step 3: Create booking
    console.log('3️⃣ Creating booking...');
    const booking = await venueService.bookVenue(
      venueId,
      userId,
      bookingData
    );
    
    console.log('   ✅ Booking created successfully');
    console.log(`   📝 Booking ID: ${booking._id}`);
    console.log(`   📅 Date: ${booking.date.toISOString().split('T')[0]}`);
    console.log(`   ⏰ Time: ${booking.startTime} - ${booking.endTime}`);
    console.log(`   💰 Price: $${booking.totalPrice}`);
    console.log(`   📊 Status: ${booking.status}`);
    
    // Step 4: Send confirmation (simulated)
    console.log('4️⃣ Sending confirmation...');
    console.log('   ✅ Confirmation sent to user');
    
    return booking;
    
  } catch (error) {
    console.error('\n❌ Booking flow failed:');
    
    if (error instanceof BookingConflictError) {
      console.error('   Reason: Time slot conflict');
      console.error('   Conflicting bookings:', error.conflictingBookings.length);
    } else {
      console.error(`   Reason: ${error.message}`);
    }
    
    throw error;
  }
}

// ============================================================
// Main Demo Function
// ============================================================

export async function runBookingExamples(container) {
  console.log('='.repeat(60));
  console.log('VENUE BOOKING CONFLICT PREVENTION - EXAMPLES');
  console.log('='.repeat(60));
  
  // Get dependencies from container
  const venueService = container.resolve('venueService');
  const venueRepository = container.resolve('venueRepository');
  
  // Mock IDs for demo
  const venueId = 'mock-venue-id-123';
  const userId1 = 'mock-user-id-1';
  const userId2 = 'mock-user-id-2';
  const userId3 = 'mock-user-id-3';
  
  try {
    // Run examples (comment out as needed)
    
    // await createBasicBooking(venueService, venueId, userId1);
    // console.log('\n' + '-'.repeat(60) + '\n');
    
    // await smartBooking(venueService, venueId, userId1, {
    //   date: new Date('2025-11-15'),
    //   startTime: '10:00',
    //   endTime: '11:00',
    // });
    // console.log('\n' + '-'.repeat(60) + '\n');
    
    // await handleConcurrentBookings(venueService, venueId, [userId1, userId2, userId3]);
    // console.log('\n' + '-'.repeat(60) + '\n');
    
    // await demonstrateValidation(venueService, venueId, userId1);
    // console.log('\n' + '-'.repeat(60) + '\n');
    
    await completeBookingFlow(venueService, venueId, userId1);
    console.log('\n' + '-'.repeat(60) + '\n');
    
    console.log('✅ All examples completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Example execution failed:', error.message);
  }
  
  console.log('='.repeat(60));
}

// Export individual examples for testing
export {
  createBasicBooking,
  smartBooking,
  handleConcurrentBookings,
  updateBookingTime,
  bookWithRetry,
  checkMultipleDates,
  findAlternatives,
  manageVenueBookings,
  demonstrateValidation,
  completeBookingFlow,
};
