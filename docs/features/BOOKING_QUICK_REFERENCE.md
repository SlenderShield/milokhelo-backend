# Venue Booking - Quick Reference Guide

## Basic Usage

### Creating a Booking

```javascript
import { venueService } from './modules/venue';

// Create a booking
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
      notes: 'Team practice'
    }
  );
  
  console.log('Booking created:', booking._id);
} catch (error) {
  if (error instanceof BookingConflictError) {
    console.log('Time slot already booked:', error.conflictingBookings);
  } else {
    console.error('Booking failed:', error.message);
  }
}
```

### Checking Availability

```javascript
// Check availability for a specific date
const availability = await venueService.checkAvailability(
  venueId,
  new Date('2025-11-15')
);

console.log('Booked slots:', availability.bookedSlots);
console.log('Available slots:', availability.availableSlots);
console.log('Has availability:', availability.hasAvailability);
```

### Updating a Booking

```javascript
// Update booking with conflict check
try {
  const updated = await venueRepository.updateBookingAtomic(
    bookingId,
    {
      startTime: '14:00',
      endTime: '15:00'
    }
  );
  
  console.log('Booking updated:', updated._id);
} catch (error) {
  if (error instanceof BookingConflictError) {
    console.log('New time conflicts with existing booking');
  } else if (error.message.includes('modified by another request')) {
    console.log('Booking was changed, please refresh and try again');
  }
}
```

### Cancelling a Booking

```javascript
// Cancel a booking
const cancelled = await venueRepository.cancelBooking(
  bookingId,
  'Customer requested cancellation'
);

console.log('Booking cancelled:', cancelled._id);
```

## API Endpoints

### User Endpoints

```http
# List all venues
GET /api/v1/venues?page=1&limit=20

# Search venues
GET /api/v1/venues/search?q=football&city=Nairobi&sport=football

# Find nearby venues
GET /api/v1/venues/nearby?lat=-1.2921&lng=36.8219&radius=10&sport=football

# Get venue details
GET /api/v1/venues/:venueId

# Check availability
GET /api/v1/venues/:venueId/availability?date=2025-11-15

# Create booking
POST /api/v1/venues/:venueId/book
Content-Type: application/json

{
  "date": "2025-11-15",
  "startTime": "10:00",
  "endTime": "11:00",
  "sport": "football",
  "totalPrice": 50,
  "notes": "Team practice"
}
```

### Venue Owner Endpoints

```http
# Get my venues
GET /api/v1/venue-management/venues

# Create venue
POST /api/v1/venue-management/venues
Content-Type: application/json

{
  "name": "City Sports Center",
  "description": "Modern sports facility",
  "address": "123 Sports Ave",
  "city": "Nairobi",
  "location": {
    "type": "Point",
    "coordinates": [36.8219, -1.2921]
  },
  "sportsSupported": ["football", "basketball"],
  "amenities": ["parking", "showers", "cafeteria"]
}

# Get venue bookings
GET /api/v1/venue-management/venues/:venueId/bookings?date=2025-11-15

# Approve booking
POST /api/v1/venue-management/bookings/:bookingId/approve

# Reject booking
POST /api/v1/venue-management/bookings/:bookingId/reject
Content-Type: application/json

{
  "reason": "Venue maintenance scheduled"
}
```

## Response Formats

### Successful Booking (201 Created)

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "venueId": "507f191e810c19729de860ea",
  "userId": "507f191e810c19729de860eb",
  "date": "2025-11-15T00:00:00.000Z",
  "startTime": "10:00",
  "endTime": "11:00",
  "sport": "football",
  "totalPrice": 50,
  "status": "pending",
  "__v": 0,
  "createdAt": "2025-10-29T10:00:00.000Z",
  "updatedAt": "2025-10-29T10:00:00.000Z"
}
```

### Booking Conflict (409 Conflict)

```json
{
  "success": false,
  "error": {
    "code": "BOOKING_CONFLICT",
    "message": "This time slot is already booked",
    "conflictingBookings": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "date": "2025-11-15T00:00:00.000Z",
        "startTime": "09:30",
        "endTime": "11:00",
        "status": "confirmed"
      }
    ]
  }
}
```

### Validation Error (400 Bad Request)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid time format. Use HH:MM format (e.g., 09:00, 14:30)"
  }
}
```

## Time Format Rules

### Valid Time Formats
- ✅ `09:00` - Morning slot
- ✅ `14:30` - Afternoon slot
- ✅ `23:45` - Late evening slot

### Invalid Time Formats
- ❌ `9:00` - Missing leading zero
- ❌ `25:00` - Invalid hour
- ❌ `14:60` - Invalid minute
- ❌ `2:30 PM` - Not 24-hour format

## Duration Rules

- **Minimum:** 30 minutes
- **Maximum:** 8 hours
- **End time** must be after start time

### Examples

```javascript
// ✅ Valid durations
{ startTime: '10:00', endTime: '10:30' }  // 30 min (minimum)
{ startTime: '10:00', endTime: '11:00' }  // 1 hour
{ startTime: '09:00', endTime: '17:00' }  // 8 hours (maximum)

// ❌ Invalid durations
{ startTime: '10:00', endTime: '10:15' }  // Too short (15 min)
{ startTime: '08:00', endTime: '17:00' }  // Too long (9 hours)
{ startTime: '14:00', endTime: '13:00' }  // End before start
```

## Conflict Scenarios

### What Causes Conflicts?

1. **Same venue** + **Same date** + **Overlapping time**

### Examples

```javascript
// Existing booking
{ date: '2025-11-15', startTime: '10:00', endTime: '12:00' }

// ❌ Conflicts - Exact overlap
{ date: '2025-11-15', startTime: '10:00', endTime: '12:00' }

// ❌ Conflicts - Starts during
{ date: '2025-11-15', startTime: '11:00', endTime: '13:00' }

// ❌ Conflicts - Ends during
{ date: '2025-11-15', startTime: '09:00', endTime: '11:00' }

// ❌ Conflicts - Contains existing
{ date: '2025-11-15', startTime: '09:00', endTime: '13:00' }

// ✅ No conflict - Adjacent
{ date: '2025-11-15', startTime: '12:00', endTime: '13:00' }

// ✅ No conflict - Different date
{ date: '2025-11-16', startTime: '10:00', endTime: '12:00' }

// ✅ No conflict - Existing is cancelled
// (Cancelled bookings don't block)
```

## Common Patterns

### Handle Conflicts Gracefully

```javascript
async function bookWithRetry(venueId, userId, bookingData, maxRetries = 3) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await venueService.bookVenue(venueId, userId, bookingData);
    } catch (error) {
      lastError = error;
      
      if (error instanceof BookingConflictError) {
        // Suggest alternative time slots
        const alternatives = await findAlternativeSlots(
          venueId,
          bookingData,
          error.conflictingBookings
        );
        
        if (alternatives.length > 0) {
          console.log('Suggested alternatives:', alternatives);
          // Could auto-book first alternative or prompt user
        }
        
        break; // Don't retry conflicts
      }
      
      // Retry on transient errors
      await sleep(1000 * Math.pow(2, i)); // Exponential backoff
    }
  }
  
  throw lastError;
}
```

### Suggest Alternative Times

```javascript
async function findAlternativeSlots(venueId, preferredBooking, conflicts) {
  const availability = await venueService.checkAvailability(
    venueId,
    preferredBooking.date
  );
  
  const duration = calculateDuration(
    preferredBooking.startTime,
    preferredBooking.endTime
  );
  
  // Find available slots with same duration
  return availability.availableSlots.filter(slot => {
    const slotDuration = calculateDuration(slot.startTime, slot.endTime);
    return slotDuration >= duration;
  });
}
```

### Validate Before Booking

```javascript
async function validateAndBook(venueId, userId, bookingData) {
  // 1. Check availability first
  const availability = await venueService.checkAvailability(
    venueId,
    bookingData.date
  );
  
  if (!availability.hasAvailability) {
    throw new Error('Venue is fully booked for this date');
  }
  
  // 2. Check if requested slot is available
  const isSlotAvailable = availability.availableSlots.some(slot =>
    slot.startTime === bookingData.startTime &&
    slot.endTime === bookingData.endTime
  );
  
  if (!isSlotAvailable) {
    throw new BookingConflictError('Requested time slot is not available');
  }
  
  // 3. Create booking
  return await venueService.bookVenue(venueId, userId, bookingData);
}
```

## Testing

### Unit Test Example

```javascript
import { VenueService } from './modules/venue';
import { BookingConflictError } from './errors/BookingConflictError';

describe('Venue Booking', () => {
  it('should prevent overlapping bookings', async () => {
    // First booking
    await venueService.bookVenue(venueId, userId, {
      date: new Date('2025-11-15'),
      startTime: '10:00',
      endTime: '11:00',
    });
    
    // Conflicting booking
    await expect(
      venueService.bookVenue(venueId, userId, {
        date: new Date('2025-11-15'),
        startTime: '10:30',
        endTime: '11:30',
      })
    ).rejects.toThrow(BookingConflictError);
  });
});
```

## Troubleshooting

### Issue: "Transaction timed out"

**Cause:** Long-running transaction or database connectivity issue

**Solution:**
```javascript
// Increase transaction timeout (MongoDB config)
// Or check for blocking queries
```

### Issue: "Booking was modified by another request"

**Cause:** Concurrent update detected by optimistic locking

**Solution:**
```javascript
// Fetch latest booking and retry
const latestBooking = await venueRepository.findById(bookingId);
// Try update again with fresh data
```

### Issue: High conflict rate

**Cause:** Many users booking same time slots

**Solution:**
```javascript
// 1. Show availability before booking form
// 2. Implement booking queue/waitlist
// 3. Add time slot reservations (hold for 5 minutes)
```

## Performance Tips

1. **Check availability first** - Reduces failed booking attempts
2. **Use proper indexes** - Already configured automatically
3. **Cache availability data** - For popular venues (5-minute cache)
4. **Implement rate limiting** - Prevent abuse/spam bookings

## Need Help?

- **Full Documentation:** `docs/BOOKING_CONFLICT_PREVENTION.md`
- **Implementation Summary:** `docs/BOOKING_CONFLICT_IMPLEMENTATION_SUMMARY.md`
- **Tests:** `test/integration/venueBookingConflict.test.js`
- **Code:** `src/api/v1/modules/venue/index.js`
