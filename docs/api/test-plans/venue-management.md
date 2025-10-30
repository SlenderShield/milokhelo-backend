# Venue Management Module - API Test Plan

## Overview

Venue owner/manager endpoints for CRUD operations, slot management, and booking approval. Requires `venue_owner` role or higher.

---

## GET /venue-management/venues

**Description:** List venues owned/managed by current user  
**Authentication:** Required (cookie) + venue_owner role  
**Parameters:** None  
**Expected Response:** `200 OK`

```json
{
  "venues": [
    {
      "id": "507f1f77bcf86cd799439070",
      "name": "City Sports Complex",
      "status": "approved",
      "sportsSupported": ["football", "basketball"],
      "bookingsCount": 15,
      "revenue": 12500,
      "rating": 4.5
    }
  ],
  "total": 1
}
```

**Test Cases:**

- ✅ **Valid request by venue owner** → Returns 200 with owned venues
- ✅ **Includes management metrics** → Bookings count, revenue
- ❌ **Not authenticated** → Returns 401 "Not authenticated"
- ❌ **Not venue owner role** → Returns 403 "Requires venue_owner role"

---

## POST /venue-management/venues

**Description:** Create a new venue (venue owner)  
**Authentication:** Required (cookie) + venue_owner role  
**Request Body:**

```json
{
  "name": "New Sports Arena",
  "description": "State-of-the-art sports facility",
  "address": "456 Stadium Road, Johannesburg",
  "city": "Johannesburg",
  "country": "South Africa",
  "location": {
    "type": "Point",
    "coordinates": [28.0473, -26.2041]
  },
  "sportsSupported": ["football", "rugby"],
  "amenities": ["parking", "changing rooms", "lighting"],
  "capacity": 150,
  "priceRange": {
    "min": 300,
    "max": 600
  },
  "openingHours": {
    "monday": "06:00-22:00"
  },
  "contactInfo": {
    "phone": "+27123456789",
    "email": "info@newsports.com"
  }
}
```

**Expected Response:** `201 Created`

```json
{
  "id": "507f1f77bcf86cd799439071",
  "name": "New Sports Arena",
  "status": "pending",
  "owner": {
    "id": "507f1f77bcf86cd799439011",
    "username": "johndoe"
  },
  "createdAt": "2025-10-30T10:00:00.000Z"
}
```

**Test Cases:**

- ✅ **Valid venue creation** → Returns 201, status set to 'pending'
- ✅ **Owner automatically set** → Current user becomes owner
- ❌ **Not authenticated** → Returns 401 "Not authenticated"
- ❌ **Not venue owner role** → Returns 403 "Requires venue_owner role"
- ❌ **Missing required fields** → Returns 400 with validation errors
- ❌ **Invalid coordinates** → Returns 400 with validation error
- ❌ **Invalid sport type** → Returns 400 with validation error

---

## GET /venue-management/venues/{venueId}

**Description:** Get venue details (owner view)  
**Authentication:** Required (cookie) + venue_owner role  
**Parameters:**

- `venueId` (path, required): Venue ID

**Expected Response:** `200 OK`

```json
{
  "id": "507f1f77bcf86cd799439070",
  "name": "City Sports Complex",
  "status": "approved",
  "bookingsCount": 25,
  "revenue": 18500,
  "pendingBookings": 3,
  "analytics": {
    "lastMonth": {
      "bookings": 42,
      "revenue": 24000
    }
  }
}
```

**Test Cases:**

- ✅ **Valid request by owner** → Returns 200 with management data
- ✅ **Includes analytics** → Revenue, bookings statistics
- ❌ **Not authenticated** → Returns 401 "Not authenticated"
- ❌ **Not venue owner** → Returns 403 "Not your venue"
- ❌ **Invalid venue ID** → Returns 400 "Invalid venue ID"
- ❌ **Venue not found** → Returns 404 "Venue not found"

---

## PATCH /venue-management/venues/{venueId}

**Description:** Update venue details (owner)  
**Authentication:** Required (cookie) + venue_owner role  
**Parameters:**

- `venueId` (path, required): Venue ID

**Request Body:**

```json
{
  "name": "Updated Venue Name",
  "description": "Updated description",
  "priceRange": {
    "min": 350,
    "max": 700
  },
  "amenities": ["parking", "changing rooms", "showers", "lighting"],
  "isAvailable": true
}
```

**Expected Response:** `200 OK`

**Test Cases:**

- ✅ **Valid update by owner** → Returns 200
- ✅ **Partial update** → Only updates provided fields
- ❌ **Not authenticated** → Returns 401 "Not authenticated"
- ❌ **Not venue owner** → Returns 403 "Not your venue"
- ❌ **Venue not found** → Returns 404 "Venue not found"
- ❌ **Invalid data** → Returns 400 with validation errors

---

## DELETE /venue-management/venues/{venueId}

**Description:** Delete or deactivate venue (owner)  
**Authentication:** Required (cookie) + venue_owner role  
**Parameters:**

- `venueId` (path, required): Venue ID

**Expected Response:** `204 No Content`

**Test Cases:**

- ✅ **Valid deletion by owner** → Returns 204, venue deactivated
- ❌ **Not authenticated** → Returns 401 "Not authenticated"
- ❌ **Not venue owner** → Returns 403 "Not your venue"
- ❌ **Venue not found** → Returns 404 "Venue not found"
- ❌ **Has active bookings** → Returns 400 "Cannot delete venue with active bookings"

---

## GET /venue-management/venues/{venueId}/slots

**Description:** Get all time slots for a venue (owner)  
**Authentication:** Required (cookie) + venue_owner role  
**Parameters:**

- `venueId` (path, required): Venue ID

**Expected Response:** `200 OK`

```json
{
  "venueId": "507f1f77bcf86cd799439070",
  "slots": [
    {
      "id": "slot_001",
      "dayOfWeek": "monday",
      "startTime": "08:00",
      "endTime": "10:00",
      "sport": "football",
      "price": 300,
      "capacity": 22,
      "isActive": true
    }
  ],
  "total": 1
}
```

**Test Cases:**

- ✅ **Valid request by owner** → Returns 200 with all slots
- ✅ **Includes inactive slots** → Shows all slot configurations
- ❌ **Not authenticated** → Returns 401 "Not authenticated"
- ❌ **Not venue owner** → Returns 403 "Not your venue"
- ❌ **Venue not found** → Returns 404 "Venue not found"

---

## POST /venue-management/venues/{venueId}/slots

**Description:** Add or update bulk time slots  
**Authentication:** Required (cookie) + venue_owner role  
**Parameters:**

- `venueId` (path, required): Venue ID

**Request Body:**

```json
{
  "slots": [
    {
      "dayOfWeek": "monday",
      "startTime": "08:00",
      "endTime": "10:00",
      "sport": "football",
      "price": 300,
      "capacity": 22
    },
    {
      "dayOfWeek": "monday",
      "startTime": "10:00",
      "endTime": "12:00",
      "sport": "football",
      "price": 300,
      "capacity": 22
    }
  ],
  "replaceExisting": false
}
```

**Expected Response:** `200 OK`

```json
{
  "message": "Slots updated successfully",
  "created": 2,
  "updated": 0
}
```

**Test Cases:**

- ✅ **Valid bulk slot creation** → Returns 200, creates slots
- ✅ **Update existing slots** → Modifies existing slot data
- ✅ **Replace all slots** → With replaceExisting=true
- ❌ **Not authenticated** → Returns 401 "Not authenticated"
- ❌ **Not venue owner** → Returns 403 "Not your venue"
- ❌ **Venue not found** → Returns 404 "Venue not found"
- ❌ **Invalid time range** → Returns 400 with validation error
- ❌ **Overlapping slots** → Returns 400 "Slot times overlap"
- ❌ **Invalid sport** → Returns 400 with validation error

---

## GET /venue-management/venues/{venueId}/bookings

**Description:** List bookings for a venue (owner)  
**Authentication:** Required (cookie) + venue_owner role  
**Parameters:**

- `venueId` (path, required): Venue ID
- `status` (query, optional): Filter by status (pending/approved/rejected/cancelled)
- `date` (query, optional): Filter by date

**Expected Response:** `200 OK`

```json
{
  "bookings": [
    {
      "id": "507f1f77bcf86cd799439080",
      "user": {
        "id": "507f1f77bcf86cd799439011",
        "username": "johndoe",
        "name": "John Doe"
      },
      "date": "2025-11-01",
      "startTime": "18:00",
      "endTime": "20:00",
      "sport": "football",
      "status": "pending",
      "price": 400,
      "notes": "Team practice",
      "createdAt": "2025-10-30T10:00:00.000Z"
    }
  ],
  "total": 1
}
```

**Test Cases:**

- ✅ **Valid request by owner** → Returns 200 with bookings
- ✅ **Filter by status** → Returns filtered bookings
- ✅ **Filter by date** → Returns bookings for specific date
- ❌ **Not authenticated** → Returns 401 "Not authenticated"
- ❌ **Not venue owner** → Returns 403 "Not your venue"
- ❌ **Venue not found** → Returns 404 "Venue not found"

---

## POST /venue-management/bookings/{bookingId}/approve

**Description:** Approve a booking  
**Authentication:** Required (cookie) + venue_owner role  
**Parameters:**

- `bookingId` (path, required): Booking ID

**Expected Response:** `200 OK`

```json
{
  "message": "Booking approved successfully",
  "booking": {
    "id": "507f1f77bcf86cd799439080",
    "status": "approved"
  }
}
```

**Test Cases:**

- ✅ **Valid approval by venue owner** → Returns 200, status changed to approved
- ✅ **User notified** → Booking confirmation sent
- ❌ **Not authenticated** → Returns 401 "Not authenticated"
- ❌ **Not venue owner** → Returns 403 "Not your venue"
- ❌ **Booking not found** → Returns 404 "Booking not found"
- ❌ **Already approved** → Returns 400 "Booking already approved"
- ❌ **Already rejected/cancelled** → Returns 400 "Cannot approve cancelled booking"

---

## POST /venue-management/bookings/{bookingId}/reject

**Description:** Reject a booking with reason  
**Authentication:** Required (cookie) + venue_owner role  
**Parameters:**

- `bookingId` (path, required): Booking ID

**Request Body:**

```json
{
  "reason": "Slot no longer available due to maintenance"
}
```

**Expected Response:** `200 OK`

```json
{
  "message": "Booking rejected",
  "booking": {
    "id": "507f1f77bcf86cd799439080",
    "status": "rejected",
    "rejectionReason": "Slot no longer available due to maintenance"
  }
}
```

**Test Cases:**

- ✅ **Valid rejection by venue owner** → Returns 200, status changed to rejected
- ✅ **User notified** → Rejection notification sent with reason
- ❌ **Not authenticated** → Returns 401 "Not authenticated"
- ❌ **Not venue owner** → Returns 403 "Not your venue"
- ❌ **Booking not found** → Returns 404 "Booking not found"
- ❌ **Missing reason** → Returns 400 "Rejection reason required"
- ❌ **Already approved** → Returns 400 "Cannot reject approved booking"

---

## Summary

### Total Endpoints: 11

### Status Code Distribution

- **200 OK**: 7 endpoints (read, update, approve, reject)
- **201 Created**: 1 endpoint (create venue)
- **204 No Content**: 1 endpoint (delete venue)
- **400 Bad Request**: Validation errors
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Requires venue_owner role or not owner
- **404 Not Found**: Venue/booking not found

### Key Features

- **Venue Management**: Full CRUD for owned venues
- **Slot Management**: Bulk create/update time slots
- **Booking Management**: Approve/reject user bookings
- **Analytics**: Revenue and booking statistics
- **Role-Based**: Requires venue_owner role
- **Ownership Validation**: Users can only manage own venues

### Validation Rules

- **Role**: Must have venue_owner role (level 2+)
- **Ownership**: Can only manage own venues
- **Time Slots**: No overlapping slots allowed
- **Coordinates**: Valid latitude/longitude
- **Booking Status**: Cannot approve rejected bookings

### Booking Workflow

1. User creates booking (status: pending)
2. Owner reviews booking via GET /venue-management/venues/{venueId}/bookings
3. Owner approves with POST /venue-management/bookings/{bookingId}/approve
4. OR owner rejects with POST /venue-management/bookings/{bookingId}/reject
5. User receives notification of approval/rejection
