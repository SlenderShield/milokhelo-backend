# Venues Module - API Test Plan

## Overview

Public venue discovery endpoints for users to search, browse, and book sports venues. Includes geospatial search with MongoDB 2dsphere indexes.

---

## GET /venues

**Description:** List approved/public venues with pagination  
**Authentication:** Optional  
**Parameters:**

- `page` (query, optional): Page number (default: 1)
- `limit` (query, optional): Results per page (default: 20)

**Expected Response:** `200 OK`

```json
{
  "venues": [
    {
      "id": "507f1f77bcf86cd799439070",
      "name": "City Sports Complex",
      "address": "123 Main Street, Johannesburg",
      "city": "Johannesburg",
      "sportsSupported": ["football", "basketball", "tennis"],
      "location": {
        "type": "Point",
        "coordinates": [28.0473, -26.2041]
      },
      "amenities": ["parking", "changing rooms", "lighting"],
      "rating": 4.5,
      "isAvailable": true,
      "images": ["https://example.com/venue1.jpg"],
      "priceRange": {
        "min": 200,
        "max": 500
      }
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

**Test Cases:**

- ✅ **Valid request** → Returns 200 with venues
- ✅ **Pagination works** → Returns correct page
- ✅ **Only approved venues shown** → Validates approval filter
- ✅ **Empty results** → Returns 200 with empty array
- ❌ **Invalid page number** → Returns 400 with validation error
- ❌ **Invalid limit** → Returns 400 with validation error

---

## GET /venues/search

**Description:** Search venues by name, sport, or city  
**Authentication:** Optional  
**Parameters:**

- `q` (query, optional): Search query (name)
- `city` (query, optional): Filter by city
- `sport` (query, optional): Filter by supported sport
- `limit` (query, optional): Results per page
- `skip` (query, optional): Pagination offset

**Expected Response:** `200 OK`

```json
{
  "venues": [
    {
      "id": "507f1f77bcf86cd799439070",
      "name": "City Sports Complex",
      "city": "Johannesburg",
      "sportsSupported": ["football"]
    }
  ],
  "total": 1
}
```

**Test Cases:**

- ✅ **Search by name** → Returns matching venues
- ✅ **Filter by city** → Returns venues in specified city
- ✅ **Filter by sport** → Returns venues supporting sport
- ✅ **Multiple filters** → Combines filters correctly
- ✅ **Empty results** → Returns 200 with empty array
- ❌ **Invalid sport** → Returns 400 with validation error

---

## GET /venues/nearby

**Description:** Find nearby venues using geospatial search  
**Authentication:** Optional  
**Parameters:**

- `lat` (query, required): Latitude (-90 to 90)
- `lng` (query, required): Longitude (-180 to 180)
- `radius` (query, optional): Search radius in meters (default: 5000)
- `sport` (query, optional): Filter by sport
- `available` (query, optional): Filter by availability

**Expected Response:** `200 OK`

```json
{
  "venues": [
    {
      "id": "507f1f77bcf86cd799439070",
      "name": "City Sports Complex",
      "location": {
        "coordinates": [28.0473, -26.2041]
      },
      "distance": 1234.56,
      "sportsSupported": ["football"],
      "isAvailable": true
    }
  ],
  "center": {
    "lat": -26.2041,
    "lng": 28.0473
  },
  "radius": 5000,
  "total": 1
}
```

**Test Cases:**

- ✅ **Valid geospatial search** → Returns nearby venues sorted by distance
- ✅ **Distance calculated** → Includes distance in meters
- ✅ **Filter by sport** → Returns venues supporting sport
- ✅ **Filter by availability** → Returns only available venues
- ✅ **Custom radius** → Respects radius parameter
- ✅ **Empty results** → Returns 200 with empty array
- ❌ **Missing lat** → Returns 400 with validation error
- ❌ **Missing lng** → Returns 400 with validation error
- ❌ **Invalid lat (> 90)** → Returns 400 with validation error
- ❌ **Invalid lng (> 180)** → Returns 400 with validation error
- ❌ **Invalid radius** → Returns 400 with validation error

---

## GET /venues/{venueId}

**Description:** Get detailed venue information  
**Authentication:** Optional  
**Parameters:**

- `venueId` (path, required): Venue ID (MongoDB ObjectId)

**Expected Response:** `200 OK`

```json
{
  "id": "507f1f77bcf86cd799439070",
  "name": "City Sports Complex",
  "description": "Premier sports facility with multiple courts and fields",
  "address": "123 Main Street, Johannesburg",
  "city": "Johannesburg",
  "country": "South Africa",
  "location": {
    "type": "Point",
    "coordinates": [28.0473, -26.2041]
  },
  "sportsSupported": ["football", "basketball", "tennis"],
  "amenities": ["parking", "changing rooms", "showers", "lighting", "seating"],
  "capacity": 200,
  "images": ["https://example.com/venue1.jpg", "https://example.com/venue2.jpg"],
  "rating": 4.5,
  "reviewsCount": 42,
  "priceRange": {
    "min": 200,
    "max": 500,
    "currency": "ZAR"
  },
  "openingHours": {
    "monday": "06:00-22:00",
    "tuesday": "06:00-22:00"
  },
  "contactInfo": {
    "phone": "+27123456789",
    "email": "info@citysports.com",
    "website": "https://citysports.com"
  },
  "owner": {
    "id": "507f1f77bcf86cd799439011",
    "username": "venue_owner",
    "name": "John Owner"
  },
  "status": "approved",
  "isAvailable": true,
  "createdAt": "2025-01-15T10:00:00.000Z"
}
```

**Test Cases:**

- ✅ **Valid venue ID** → Returns 200 with full details
- ✅ **Includes all venue data** → Validates complete information
- ❌ **Invalid venue ID** → Returns 400 "Invalid venue ID"
- ❌ **Venue not found** → Returns 404 "Venue not found"
- ❌ **Unapproved venue** → Returns 404 (hidden from public)

---

## GET /venues/{venueId}/availability

**Description:** Check venue availability for a specific date  
**Authentication:** Optional  
**Parameters:**

- `venueId` (path, required): Venue ID
- `date` (query, required): Date to check (YYYY-MM-DD format)

**Expected Response:** `200 OK`

```json
{
  "venueId": "507f1f77bcf86cd799439070",
  "date": "2025-11-01",
  "slots": [
    {
      "id": "slot_001",
      "startTime": "08:00",
      "endTime": "10:00",
      "sport": "football",
      "available": true,
      "price": 300,
      "capacity": 22
    },
    {
      "id": "slot_002",
      "startTime": "10:00",
      "endTime": "12:00",
      "sport": "football",
      "available": false,
      "price": 300,
      "bookedBy": "Thunder FC"
    }
  ]
}
```

**Test Cases:**

- ✅ **Valid availability check** → Returns 200 with time slots
- ✅ **Shows available slots** → Indicates which slots are free
- ✅ **Shows booked slots** → Indicates which slots are taken
- ❌ **Invalid venue ID** → Returns 400 "Invalid venue ID"
- ❌ **Venue not found** → Returns 404 "Venue not found"
- ❌ **Missing date** → Returns 400 with validation error
- ❌ **Invalid date format** → Returns 400 with validation error
- ❌ **Date in past** → Returns 400 "Cannot check availability for past dates"

---

## POST /venues/{venueId}/book

**Description:** Book a time slot at a venue  
**Authentication:** Required (cookie)  
**Parameters:**

- `venueId` (path, required): Venue ID

**Request Body:**

```json
{
  "date": "2025-11-01",
  "startTime": "18:00",
  "endTime": "20:00",
  "sport": "football",
  "notes": "Team practice session",
  "relatedTo": {
    "type": "match",
    "id": "507f1f77bcf86cd799439030"
  }
}
```

**Expected Response:** `201 Created`

```json
{
  "id": "507f1f77bcf86cd799439080",
  "venue": {
    "id": "507f1f77bcf86cd799439070",
    "name": "City Sports Complex"
  },
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "johndoe"
  },
  "date": "2025-11-01",
  "startTime": "18:00",
  "endTime": "20:00",
  "sport": "football",
  "status": "pending",
  "price": 400,
  "notes": "Team practice session",
  "createdAt": "2025-10-30T10:00:00.000Z"
}
```

**Test Cases:**

- ✅ **Valid booking** → Returns 201 with booking details
- ✅ **Atomic transaction** → Prevents double booking
- ✅ **Status set to pending** → Requires venue owner approval
- ✅ **Link to entity** → Can link to match/tournament
- ❌ **Not authenticated** → Returns 401 "Not authenticated"
- ❌ **Invalid venue ID** → Returns 400 "Invalid venue ID"
- ❌ **Venue not found** → Returns 404 "Venue not found"
- ❌ **Missing required fields** → Returns 400 with validation errors
- ❌ **Invalid date format** → Returns 400 with validation error
- ❌ **Date in past** → Returns 400 "Cannot book past dates"
- ❌ **End time before start time** → Returns 400 with validation error
- ❌ **Slot not available** → Returns 409 "Slot already booked"
- ❌ **Conflict with existing booking** → Returns 409 "Booking conflict"
- ❌ **Sport not supported** → Returns 400 "Venue does not support this sport"

---

## Summary

### Total Endpoints: 6

### Status Code Distribution

- **200 OK**: 4 endpoints (list, search, nearby, details, availability)
- **201 Created**: 1 endpoint (book slot)
- **400 Bad Request**: Validation errors
- **401 Unauthorized**: Authentication required (booking only)
- **404 Not Found**: Venue not found
- **409 Conflict**: Booking conflict

### Key Features

- **Geospatial Search**: MongoDB 2dsphere indexes for nearby search
- **Venue Discovery**: Search by name, sport, city, location
- **Availability Checking**: Real-time slot availability
- **Atomic Bookings**: Transaction-based conflict prevention
- **Multi-Sport Support**: Venues support multiple sports
- **Approval System**: Venue owner approves bookings

### Validation Rules

- **Coordinates**: Latitude (-90 to 90), Longitude (-180 to 180)
- **Date Format**: YYYY-MM-DD
- **Time Format**: HH:MM (24-hour)
- **Booking Date**: Cannot be in the past
- **Time Range**: End time must be after start time
- **Sport**: Must be supported by venue

### Booking Process

1. Check availability with GET /venues/{venueId}/availability
2. Create booking with POST /venues/{venueId}/book
3. Booking status set to 'pending'
4. Venue owner approves/rejects via Venue Management endpoints
5. User notified of booking status change
