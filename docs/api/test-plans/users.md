# Users Module - API Test Plan

## Overview

User profile management, statistics tracking, achievements system, and social features (friends). Stats are automatically updated via event-driven architecture when matches finish.

---

## GET /users/me

**Description:** Get authenticated user profile  
**Authentication:** Required (cookie)  
**Parameters:** None  
**Expected Response:** `200 OK`

```json
{
  "id": "507f1f77bcf86cd799439011",
  "username": "johndoe",
  "name": "John Doe",
  "email": "john@example.com",
  "bio": "Passionate football player",
  "avatar": "https://example.com/avatar.jpg",
  "role": "user",
  "sportsPreferences": ["football", "basketball"],
  "location": {
    "city": "Johannesburg",
    "country": "South Africa",
    "coordinates": [-26.2041, 28.0473]
  },
  "privacySettings": {
    "profileVisibility": "public",
    "showEmail": false,
    "showLocation": true
  },
  "createdAt": "2025-01-15T10:00:00.000Z"
}
```

**Test Cases:**

- ✅ **Valid authenticated request** → Returns 200 with full user profile
- ❌ **Not authenticated** → Returns 401 "Not authenticated"
- ❌ **Invalid session** → Returns 401 "Session invalid"
- ❌ **Expired session** → Returns 401 "Session expired"

---

## PUT /users/me

**Description:** Update authenticated user profile  
**Authentication:** Required (cookie)  
**Request Body:**

```json
{
  "username": "johndoe_updated",
  "name": "John Doe Jr",
  "bio": "Updated bio - sports enthusiast",
  "avatar": "https://example.com/new-avatar.jpg",
  "sportsPreferences": ["football", "basketball", "tennis"],
  "location": {
    "city": "Cape Town",
    "country": "South Africa",
    "coordinates": [-33.9249, 18.4241]
  },
  "privacySettings": {
    "profileVisibility": "friends",
    "showEmail": false,
    "showLocation": true
  }
}
```

**Expected Response:** `200 OK`

```json
{
  "id": "507f1f77bcf86cd799439011",
  "username": "johndoe_updated",
  "name": "John Doe Jr",
  "bio": "Updated bio - sports enthusiast",
  "message": "Profile updated successfully"
}
```

**Test Cases:**

- ✅ **Valid profile update** → Returns 200 with updated profile
- ✅ **Partial update** → Updates only provided fields
- ❌ **Not authenticated** → Returns 401 "Not authenticated"
- ❌ **Invalid username format** → Returns 400 (must be 3-30 chars, alphanumeric)
- ❌ **Username already taken** → Returns 400 "Username already exists"
- ❌ **Bio exceeds 500 characters** → Returns 400 with validation error
- ❌ **Invalid email format** → Returns 400 with validation error
- ❌ **Invalid sport type** → Returns 400 with validation error
- ❌ **Invalid coordinates** → Returns 400 (lat: -90 to 90, lng: -180 to 180)
- 🔒 **Cannot update email directly** → Should require verification flow
- 🔒 **Cannot update role** → Security validation

---

## PATCH /users/me

**Description:** Partially update user profile (legacy endpoint)  
**Authentication:** Required (cookie)  
**Request Body:**

```json
{
  "bio": "New bio only"
}
```

**Expected Response:** `200 OK`

**Test Cases:**

- ✅ **Valid partial update** → Returns 200 with updated fields
- ❌ **Not authenticated** → Returns 401 "Not authenticated"
- ⚠️ **Legacy endpoint** → Consider using PUT /users/me instead

---

## GET /users/search

**Description:** Search users by username, name, or email  
**Authentication:** Optional  
**Parameters:**

- `q` or `query` (query, optional): Search term
- `sport` (query, optional): Filter by sport preference
- `limit` (query, optional): Number of results (1-100, default: 20)
- `skip` (query, optional): Pagination offset (default: 0)

**Expected Response:** `200 OK`

```json
{
  "users": [
    {
      "id": "507f1f77bcf86cd799439011",
      "username": "johndoe",
      "name": "John Doe",
      "avatar": "https://example.com/avatar.jpg",
      "sportsPreferences": ["football"],
      "location": {
        "city": "Johannesburg"
      }
    }
  ],
  "total": 1,
  "limit": 20,
  "skip": 0
}
```

**Test Cases:**

- ✅ **Search by username** → Returns matching users
- ✅ **Search by name** → Returns matching users
- ✅ **Search by email** → Returns matching users
- ✅ **Filter by sport** → Returns users with specific sport preference
- ✅ **Pagination with limit and skip** → Returns paginated results
- ✅ **No query parameter** → Returns all users (paginated)
- ✅ **Empty results** → Returns empty array with 200 status
- ❌ **Invalid limit (> 100)** → Returns 400 with validation error
- ❌ **Invalid skip (< 0)** → Returns 400 with validation error
- ❌ **Invalid sport type** → Returns 400 with validation error
- 🔒 **Privacy settings respected** → Only show public profiles or friends

---

## GET /users

**Description:** Search/list users (legacy endpoint)  
**Authentication:** Optional  
**Parameters:**

- `q` (query, optional): Search term
- `sport` (query, optional): Filter by sport

**Expected Response:** `200 OK`

**Test Cases:**

- ✅ **Valid search** → Returns matching users
- ⚠️ **Legacy endpoint** → Use GET /users/search instead

---

## POST /users

**Description:** Create or update a user profile (self or admin)  
**Authentication:** Required (cookie)  
**Request Body:**

```json
{
  "username": "newuser",
  "name": "New User",
  "email": "newuser@example.com",
  "bio": "New user bio",
  "sportsPreferences": ["football"]
}
```

**Expected Response:** `201 Created`

**Test Cases:**

- ✅ **Admin creates user** → Returns 201 with new user profile
- ✅ **User updates own profile** → Returns 200 with updated profile
- ❌ **Not authenticated** → Returns 401 "Not authenticated"
- ❌ **Non-admin creates other user** → Returns 403 "Forbidden"
- ❌ **Invalid data** → Returns 400 with validation errors

---

## GET /users/{id}/stats

**Description:** Get user statistics grouped by sport  
**Authentication:** Optional  
**Parameters:**

- `id` (path, required): User ID (MongoDB ObjectId)

**Expected Response:** `200 OK`

```json
{
  "userId": "507f1f77bcf86cd799439011",
  "stats": [
    {
      "sport": "football",
      "matchesPlayed": 45,
      "wins": 28,
      "losses": 12,
      "draws": 5,
      "winRate": 62.22,
      "eloRating": 1650,
      "currentStreak": {
        "type": "win",
        "count": 3
      },
      "bestStreak": {
        "type": "win",
        "count": 8
      },
      "performance": {
        "goals": 34,
        "assists": 12,
        "yellowCards": 3,
        "redCards": 0
      },
      "lastUpdated": "2025-10-30T10:00:00.000Z"
    },
    {
      "sport": "basketball",
      "matchesPlayed": 20,
      "wins": 12,
      "losses": 8,
      "draws": 0,
      "winRate": 60.0,
      "eloRating": 1580
    }
  ]
}
```

**Test Cases:**

- ✅ **Valid user ID** → Returns 200 with stats by sport
- ✅ **User with no stats** → Returns 200 with empty stats array
- ✅ **Stats include ELO ratings** → Validates automatic ELO calculation
- ✅ **Stats include streaks** → Validates streak tracking
- ✅ **Stats include performance metrics** → Validates detailed stats
- ❌ **Invalid user ID format** → Returns 400 "Invalid user ID"
- ❌ **Non-existent user** → Returns 404 "User not found"
- 📊 **Stats auto-updated on match finish** → Event-driven update validation
- 📊 **ELO calculation accuracy** → ±32 for competitive, ±16 for friendly

---

## GET /users/me/achievements

**Description:** Get current user's earned achievements  
**Authentication:** Required (cookie)  
**Parameters:** None  
**Expected Response:** `200 OK`

```json
{
  "achievements": [
    {
      "id": "first_win",
      "name": "First Victory",
      "description": "Win your first match",
      "category": "milestones",
      "rarity": "common",
      "points": 10,
      "icon": "🏆",
      "criteria": {
        "type": "win_count",
        "value": 1
      },
      "earnedAt": "2025-01-20T15:30:00.000Z"
    },
    {
      "id": "winning_streak_5",
      "name": "On Fire!",
      "description": "Win 5 matches in a row",
      "category": "streaks",
      "rarity": "rare",
      "points": 50,
      "icon": "🔥",
      "criteria": {
        "type": "win_streak",
        "value": 5
      },
      "earnedAt": "2025-02-15T10:00:00.000Z"
    }
  ],
  "totalPoints": 60,
  "totalAchievements": 2
}
```

**Test Cases:**

- ✅ **Valid authenticated request** → Returns 200 with earned achievements
- ✅ **User with no achievements** → Returns 200 with empty array
- ✅ **Achievements sorted by earnedAt** → Validates sorting
- ❌ **Not authenticated** → Returns 401 "Not authenticated"
- 📊 **Achievements auto-awarded** → Event-driven evaluation validation
- 📊 **31 total predefined achievements** → System validation

---

## GET /users/{id}/achievements

**Description:** Get achievements for any user (public endpoint)  
**Authentication:** Optional  
**Parameters:**

- `id` (path, required): User ID (MongoDB ObjectId)

**Expected Response:** `200 OK`

```json
{
  "userId": "507f1f77bcf86cd799439011",
  "achievements": [
    {
      "id": "first_win",
      "name": "First Victory",
      "earnedAt": "2025-01-20T15:30:00.000Z"
    }
  ],
  "totalPoints": 10
}
```

**Test Cases:**

- ✅ **Valid user ID** → Returns 200 with user's achievements
- ✅ **User with no achievements** → Returns 200 with empty array
- ❌ **Invalid user ID format** → Returns 400 "Invalid user ID"
- ❌ **Non-existent user** → Returns 404 "User not found"
- 🔒 **Privacy settings respected** → Only show if profile is public

---

## GET /users/{id}/friends

**Description:** Get user's friends list  
**Authentication:** Optional  
**Parameters:**

- `id` (path, required): User ID (MongoDB ObjectId)

**Expected Response:** `200 OK`

```json
{
  "userId": "507f1f77bcf86cd799439011",
  "friends": [
    {
      "id": "507f1f77bcf86cd799439012",
      "username": "janedoe",
      "name": "Jane Doe",
      "avatar": "https://example.com/jane-avatar.jpg",
      "email": "jane@example.com",
      "bio": "Basketball enthusiast",
      "sportsPreferences": ["basketball"],
      "location": {
        "city": "Pretoria",
        "country": "South Africa"
      }
    }
  ],
  "total": 1
}
```

**Test Cases:**

- ✅ **Valid user ID** → Returns 200 with populated friends list
- ✅ **User with no friends** → Returns 200 with empty array
- ✅ **Friends include full user data** → Validates population
- ❌ **Invalid user ID format** → Returns 400 "Invalid user ID"
- ❌ **Non-existent user** → Returns 404 "User not found"
- 🔒 **Privacy settings respected** → Only show if allowed

---

## POST /users/{friendId}/friend

**Description:** Add a user as friend (bidirectional)  
**Authentication:** Required (cookie)  
**Parameters:**

- `friendId` (path, required): ID of user to add as friend (MongoDB ObjectId)

**Expected Response:** `200 OK`

```json
{
  "message": "Friend added successfully",
  "friend": {
    "id": "507f1f77bcf86cd799439012",
    "username": "janedoe",
    "name": "Jane Doe"
  }
}
```

**Test Cases:**

- ✅ **Valid friend addition** → Returns 200, adds bidirectional friendship
- ✅ **Event published** → Validates `user.friend_added` event
- ❌ **Not authenticated** → Returns 401 "Not authenticated"
- ❌ **Invalid friend ID format** → Returns 400 "Invalid user ID"
- ❌ **Non-existent user** → Returns 404 "User not found"
- ❌ **Cannot add self as friend** → Returns 400 "Cannot add yourself as friend"
- ❌ **Already friends** → Returns 400 "Already friends"
- 🔄 **Bidirectional update** → Both users have each other in friends list

---

## DELETE /users/{friendId}/friend

**Description:** Remove a friend (bidirectional)  
**Authentication:** Required (cookie)  
**Parameters:**

- `friendId` (path, required): ID of friend to remove (MongoDB ObjectId)

**Expected Response:** `200 OK`

```json
{
  "message": "Friend removed successfully"
}
```

**Test Cases:**

- ✅ **Valid friend removal** → Returns 200, removes bidirectional friendship
- ✅ **Event published** → Validates `user.friend_removed` event
- ❌ **Not authenticated** → Returns 401 "Not authenticated"
- ❌ **Invalid friend ID format** → Returns 400 "Invalid user ID"
- ❌ **Not friends** → Returns 400 "Not friends with this user"
- 🔄 **Bidirectional removal** → Both users no longer have each other in friends list

---

## Summary

### Total Endpoints: 11

### Status Code Distribution

- **200 OK**: 9 endpoints (read operations)
- **201 Created**: 1 endpoint (create user)
- **400 Bad Request**: Validation errors
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Authorization errors
- **404 Not Found**: User not found

### Key Features

- **Profile Management**: Full CRUD operations with validation
- **Statistics Tracking**: Automatic updates via event-driven architecture
- **Achievement System**: 31 predefined achievements with auto-evaluation
- **Social Features**: Bidirectional friend system with events
- **Privacy Controls**: Granular privacy settings for profile visibility
- **Search & Discovery**: Flexible search with filters and pagination

### Validation Rules

- **Username**: 3-30 characters, alphanumeric
- **Bio**: Max 500 characters
- **Coordinates**: Latitude (-90 to 90), Longitude (-180 to 180)
- **Pagination**: Limit (1-100), Skip (0+)

### Event-Driven Features

- **Stats Updates**: Triggered by `match.finished` event
- **Achievement Awards**: Triggered by stats updates
- **Friend Actions**: Publish `user.friend_added` and `user.friend_removed` events
