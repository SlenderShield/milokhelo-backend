# Venue Booking Conflict Prevention

## Overview

This document describes the atomic booking conflict prevention system implemented for the venue module in the Milokhelo backend. The system ensures that venue bookings do not overlap in time, preventing double-booking scenarios even under high concurrency.

## Architecture

### Key Components

1. **Atomic Operations with MongoDB Transactions**
   - All booking creation and updates use MongoDB transactions
   - Ensures ACID properties for booking operations
   - Prevents race conditions in concurrent scenarios

2. **Optimistic Locking**
   - Uses Mongoose's built-in version keys (`__v`)
   - Prevents lost updates when multiple clients update the same booking
   - Automatically increments version on each update

3. **Conflict Detection**
   - Comprehensive time overlap checking
   - Handles all edge cases (starts during, ends during, contains)
   - Only considers active bookings (pending/confirmed status)

4. **Custom Error Handling**
   - `BookingConflictError` for clear error messaging
   - Includes details about conflicting bookings
   - Proper HTTP status code (409 Conflict)

## Database Schema Enhancements

### Booking Model

```javascript
{
  venueId: ObjectId,
  userId: ObjectId,
  date: Date,
  startTime: String,    // Format: "HH:MM"
  endTime: String,      // Format: "HH:MM"
  status: String,       // 'pending', 'confirmed', 'cancelled'
  __v: Number          // Version field for optimistic locking
}
```

### Indexes

```javascript
// Compound index for efficient conflict checking
{ venueId: 1, date: 1, status: 1 }

// Index for time range queries
{ venueId: 1, date: 1, startTime: 1, endTime: 1 }
```

## API Endpoints

### Create Booking (with Conflict Prevention)

```http
POST /api/v1/venues/:venueId/book
```

**Request Body:**
```json
{
  "date": "2025-11-15",
  "startTime": "10:00",
  "endTime": "11:00",
  "sport": "football",
  "totalPrice": 50,
  "notes": "Team practice session"
}
```

**Success Response (201):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "venueId": "507f191e810c19729de860ea",
  "userId": "507f191e810c19729de860eb",
  "date": "2025-11-15T00:00:00.000Z",
  "startTime": "10:00",
  "endTime": "11:00",
  "status": "pending",
  "__v": 0,
  "createdAt": "2025-10-29T10:00:00.000Z"
}
```

**Conflict Response (409):**
```json
{
  "success": false,
  "error": {
    "code": "BOOKING_CONFLICT",
    "message": "This time slot is already booked",
    "conflictingBookings": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "startTime": "09:30",
        "endTime": "11:00",
        "status": "confirmed"
      }
    ]
  }
}
```

### Check Availability

```http
GET /api/v1/venues/:venueId/availability?date=2025-11-15
```

**Response (200):**
```json
{
  "date": "2025-11-15",
  "venueId": "507f191e810c19729de860ea",
  "bookedSlots": [
    {
      "bookingId": "507f1f77bcf86cd799439011",
      "startTime": "10:00",
      "endTime": "11:00",
      "status": "confirmed",
      "available": false
    }
  ],
  "availableSlots": [
    {
      "startTime": "08:00",
      "endTime": "09:00",
      "available": true
    },
    {
      "startTime": "11:00",
      "endTime": "12:00",
      "available": true
    }
  ],
  "totalBooked": 1,
  "hasAvailability": true
}
```

## Conflict Detection Logic

### Time Overlap Scenarios

The system detects conflicts in the following scenarios:

1. **Exact Overlap**
   ```
   Existing: [10:00 - 11:00]
   New:      [10:00 - 11:00]  ❌ CONFLICT
   ```

2. **New Booking Starts During Existing**
   ```
   Existing: [10:00 - 12:00]
   New:      [11:00 - 13:00]  ❌ CONFLICT
   ```

3. **New Booking Ends During Existing**
   ```
   Existing: [12:00 - 14:00]
   New:      [11:00 - 13:00]  ❌ CONFLICT
   ```

4. **New Booking Contains Existing**
   ```
   Existing: [11:00 - 12:00]
   New:      [10:00 - 13:00]  ❌ CONFLICT
   ```

5. **Adjacent Bookings (No Overlap)**
   ```
   Existing: [10:00 - 11:00]
   New:      [11:00 - 12:00]  ✅ ALLOWED
   ```

### MongoDB Query

```javascript
{
  venueId: venueId,
  date: { $gte: startOfDay, $lt: endOfDay },
  status: { $in: ['pending', 'confirmed'] },
  $or: [
    { startTime: { $lte: startTime }, endTime: { $gt: startTime } },
    { startTime: { $lt: endTime }, endTime: { $gte: endTime } },
    { startTime: { $gte: startTime }, endTime: { $lte: endTime } }
  ]
}
```

## Transaction Flow

### Booking Creation

```
1. Start MongoDB session
2. Begin transaction
3. Check for conflicts within transaction
   └─ If conflicts found:
      ├─ Abort transaction
      └─ Throw BookingConflictError
4. Create booking document
5. Commit transaction
6. Publish event (venue.booked)
7. End session
8. Return booking
```

### Booking Update

```
1. Start MongoDB session
2. Begin transaction
3. Fetch current booking with session
4. If time/date changed:
   └─ Check for conflicts (excluding self)
      └─ If conflicts found:
         ├─ Abort transaction
         └─ Throw BookingConflictError
5. Update with version check (__v)
   └─ If version mismatch:
      ├─ Abort transaction
      └─ Throw error (concurrent modification)
6. Increment version (__v)
7. Commit transaction
8. End session
9. Return updated booking
```

## Validation Rules

### Time Format
- Must be in "HH:MM" format (24-hour)
- Examples: "09:00", "14:30", "23:45"
- Invalid: "9:00", "25:00", "14:60"

### Duration
- **Minimum:** 30 minutes
- **Maximum:** 8 hours
- End time must be after start time

### Date
- Cannot book dates in the past
- Date must be valid ISO 8601 format

### Venue Status
- Venue must exist
- Venue status must be "active"
- Venue must be verified

## Error Handling

### BookingConflictError

```javascript
class BookingConflictError extends Error {
  constructor(message, conflictingBookings) {
    super(message);
    this.name = 'BookingConflictError';
    this.statusCode = 409;
    this.conflictingBookings = conflictingBookings;
  }
}
```

### Error Handler Middleware

The global error handler specifically catches `BookingConflictError` and returns:

```javascript
{
  success: false,
  error: {
    code: 'BOOKING_CONFLICT',
    message: 'This time slot is already booked',
    conflictingBookings: [...] // Details of conflicting bookings
  }
}
```

## Concurrency Handling

### Race Condition Prevention

The atomic transaction approach ensures that even when multiple clients attempt to book the same time slot simultaneously:

1. Only ONE booking will succeed
2. All others will receive `BookingConflictError`
3. No partial states or data corruption

### Example Scenario

```
Client A: POST /venues/123/book {10:00-11:00} at 10:00:00.100
Client B: POST /venues/123/book {10:00-11:00} at 10:00:00.105
Client C: POST /venues/123/book {10:00-11:00} at 10:00:00.110

Result:
- Client A: 201 Created ✅
- Client B: 409 Conflict ❌
- Client C: 409 Conflict ❌
```

## Performance Considerations

### Indexes

The compound indexes ensure efficient query performance:

```javascript
// Primary conflict check index
venueId + date + status: O(log n)

// Time range index
venueId + date + startTime + endTime: O(log n)
```

### Transaction Overhead

- Minimal overhead for single booking operations
- Transactions complete in milliseconds for typical workloads
- Connection pooling mitigates session creation overhead

### Scalability

- Horizontal scaling supported (replica sets)
- Read preference can be set to primary for consistency
- Write concerns can be adjusted based on requirements

## Testing

### Test Coverage

The implementation includes comprehensive tests:

1. **Basic Conflict Detection**
   - Exact overlap
   - Partial overlaps (start/end during)
   - Complete containment
   - Adjacent bookings

2. **Concurrent Operations**
   - Race condition handling
   - Multiple simultaneous booking attempts
   - Transaction isolation

3. **Validation**
   - Time format validation
   - Duration constraints
   - Date validation
   - Venue status checks

4. **Optimistic Locking**
   - Concurrent update handling
   - Version mismatch detection

5. **Edge Cases**
   - Cancelled bookings (not conflicts)
   - Different dates (same time)
   - Booking updates

### Running Tests

```bash
# Run all venue booking tests
npm test -- test/integration/venueBookingConflict.test.js

# Run with coverage
npm test -- --coverage test/integration/venueBookingConflict.test.js
```

## Usage Examples

### Client-Side Integration

```javascript
// JavaScript/TypeScript client example
async function bookVenue(venueId, bookingData) {
  try {
    const response = await fetch(`/api/v1/venues/${venueId}/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    });

    if (response.status === 409) {
      const error = await response.json();
      // Show conflict message to user
      showConflictDialog(error.error.conflictingBookings);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Booking failed:', error);
    throw error;
  }
}

function showConflictDialog(conflicts) {
  const message = `This time slot is already booked:\n${
    conflicts.map(c => `${c.startTime} - ${c.endTime} (${c.status})`).join('\n')
  }`;
  alert(message);
}
```

### Server-Side Usage

```javascript
// Using the service directly
import { VenueService } from './modules/venue';

async function createBooking(venueId, userId, bookingData) {
  try {
    const booking = await venueService.bookVenue(
      venueId,
      userId,
      bookingData
    );
    
    console.log('Booking created:', booking._id);
    return booking;
  } catch (error) {
    if (error instanceof BookingConflictError) {
      console.log('Conflict detected:', error.conflictingBookings);
      // Handle conflict (notify user, suggest alternative times, etc.)
    } else {
      console.error('Booking failed:', error.message);
    }
    throw error;
  }
}
```

## Future Enhancements

### Planned Features

1. **Automatic Retry Logic**
   - Exponential backoff for transient failures
   - Configurable retry attempts

2. **Booking Queue System**
   - Waitlist for popular time slots
   - Automatic booking when slot becomes available

3. **Advanced Availability Algorithm**
   - Consider venue operating hours
   - Support for multiple courts/fields per venue
   - Partial availability (half-court bookings)

4. **Performance Optimizations**
   - Caching layer for availability data
   - Read replicas for availability queries
   - Materialized views for popular queries

5. **Analytics**
   - Conflict rate tracking
   - Peak booking times analysis
   - Booking success rate metrics

## Troubleshooting

### Common Issues

1. **Transaction Timeout**
   - Increase transaction timeout in MongoDB settings
   - Check for long-running queries blocking transactions
   - Monitor connection pool size

2. **High Conflict Rate**
   - Implement booking queue system
   - Add pre-booking availability check
   - Consider increasing time slot granularity

3. **Performance Degradation**
   - Verify indexes are being used (explain plan)
   - Check connection pool configuration
   - Monitor transaction duration

### Monitoring

Key metrics to monitor:

- Transaction success rate
- Average transaction duration
- Conflict error rate
- Concurrent booking attempts
- Database connection pool usage

## References

- [MongoDB Transactions Documentation](https://docs.mongodb.com/manual/core/transactions/)
- [Mongoose Optimistic Concurrency](https://mongoosejs.com/docs/guide.html#optimisticConcurrency)
- [ACID Properties](https://en.wikipedia.org/wiki/ACID)
- [Race Condition Prevention](https://en.wikipedia.org/wiki/Race_condition)
