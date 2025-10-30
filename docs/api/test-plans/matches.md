# Matches Module - API Test Plan

## Overview

Match lifecycle management including creation, participant management (join/leave), scoring, status transitions, and automatic stats updates via event-driven architecture.

---

## POST /matches

**Description:** Create a new match  
**Authentication:** Required (cookie)  
**Request Body:**

```json
{
  "title": "Friday Evening Football",
  "sport": "football",
  "type": "friendly",
  "skillLevel": "intermediate",
  "startAt": "2025-11-01T18:00:00.000Z",
  "duration": 90,
  "location": {
    "venue": "City Sports Complex",
    "address": "123 Main Street, Johannesburg",
    "city": "Johannesburg",
    "coordinates": [-26.2041, 28.0473]
  },
  "maxParticipants": 22,
  "description": "Looking for players for a friendly match",
  "isPrivate": false
}
```

**Expected Response:** `201 Created`

```json
{
  "id": "507f1f77bcf86cd799439030",
  "title": "Friday Evening Football",
  "sport": "football",
  "type": "friendly",
  "skillLevel": "intermediate",
  "status": "scheduled",
  "organizer": {
    "id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "name": "John Doe"
  },
  "participants": [
    {
      "id": "507f1f77bcf86cd799439011",
      "username": "johndoe"
    }
  ],
  "participantCount": 1,
  "maxParticipants": 22,
  "startAt": "2025-11-01T18:00:00.000Z",
  "createdAt": "2025-10-30T10:00:00.000Z"
}
```

**Test Cases:**

- ✅ **Valid match creation** → Returns 201, organizer auto-added as participant
- ✅ **Organizer automatically added** → Validates participant initialization
- ❌ **Not authenticated** → Returns 401 "Not authenticated"
- ❌ **Missing title** → Returns 400 with validation error
- ❌ **Missing sport** → Returns 400 with validation error
- ❌ **Missing startAt** → Returns 400 with validation error
- ❌ **Missing location** → Returns 400 with validation error
- ❌ **Invalid sport type** → Returns 400 with validation error
- ❌ **Start date in the past** → Returns 400 "Match cannot start in the past"
- ❌ **Invalid coordinates** → Returns 400 with validation error
- ❌ **Invalid skillLevel** → Returns 400 with validation error
- ❌ **maxParticipants < 2** → Returns 400 with validation error

---

## GET /matches

**Description:** List matches with filters  
**Authentication:** Optional  
**Parameters:**

- `sport` (query, optional): Filter by sport
- `city` (query, optional): Filter by city
- `startAt` (query, optional): Filter by start date/time
- `status` (query, optional): Filter by status (scheduled, live, finished)
- `skillLevel` (query, optional): Filter by skill level
- `limit` (query, optional): Results per page
- `skip` (query, optional): Pagination offset

**Expected Response:** `200 OK`

```json
{
  "matches": [
    {
      "id": "507f1f77bcf86cd799439030",
      "title": "Friday Evening Football",
      "sport": "football",
      "status": "scheduled",
      "startAt": "2025-11-01T18:00:00.000Z",
      "location": {
        "city": "Johannesburg"
      },
      "participantCount": 15,
      "maxParticipants": 22
    }
  ],
  "total": 1
}
```

**Test Cases:**

- ✅ **List all matches** → Returns 200 with matches
- ✅ **Filter by sport** → Returns filtered results
- ✅ **Filter by city** → Returns filtered results
- ✅ **Filter by status** → Returns filtered results
- ✅ **Filter by startAt date** → Returns matches starting after date
- ✅ **Multiple filters** → Combines filters correctly
- ✅ **Empty results** → Returns 200 with empty array
- ❌ **Invalid sport** → Returns 400 with validation error
- ❌ **Invalid date format** → Returns 400 with validation error

---

## GET /matches/{id}

**Description:** Get detailed match information  
**Authentication:** Optional  
**Parameters:**

- `id` (path, required): Match ID (MongoDB ObjectId)

**Expected Response:** `200 OK`

```json
{
  "id": "507f1f77bcf86cd799439030",
  "title": "Friday Evening Football",
  "sport": "football",
  "type": "competitive",
  "skillLevel": "intermediate",
  "status": "scheduled",
  "organizer": {
    "id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "name": "John Doe",
    "avatar": "https://example.com/avatar.jpg"
  },
  "participants": [
    {
      "id": "507f1f77bcf86cd799439011",
      "username": "johndoe",
      "name": "John Doe"
    }
  ],
  "participantCount": 15,
  "maxParticipants": 22,
  "startAt": "2025-11-01T18:00:00.000Z",
  "duration": 90,
  "location": {
    "venue": "City Sports Complex",
    "address": "123 Main Street, Johannesburg",
    "city": "Johannesburg",
    "coordinates": [-26.2041, 28.0473]
  },
  "scores": {
    "teamA": 2,
    "teamB": 1
  },
  "description": "Looking for players for a friendly match",
  "createdAt": "2025-10-30T10:00:00.000Z",
  "updatedAt": "2025-10-30T15:00:00.000Z"
}
```

**Test Cases:**

- ✅ **Valid match ID** → Returns 200 with full details
- ✅ **Participants populated** → Validates user data population
- ❌ **Invalid match ID format** → Returns 400 "Invalid match ID"
- ❌ **Non-existent match** → Returns 404 "Match not found"

---

## PATCH /matches/{id}

**Description:** Update match details (organizer only)  
**Authentication:** Required (cookie)  
**Parameters:**

- `id` (path, required): Match ID

**Request Body:**

```json
{
  "title": "Updated Match Title",
  "description": "Updated description",
  "startAt": "2025-11-02T18:00:00.000Z",
  "maxParticipants": 20
}
```

**Expected Response:** `200 OK`

**Test Cases:**

- ✅ **Valid update by organizer** → Returns 200 with updated match
- ✅ **Partial update** → Only updates provided fields
- ❌ **Not authenticated** → Returns 401 "Not authenticated"
- ❌ **Not organizer** → Returns 403 "Only organizer can update"
- ❌ **Invalid match ID** → Returns 400 "Invalid match ID"
- ❌ **Match not found** → Returns 404 "Match not found"
- ❌ **Update finished match** → Returns 400 "Cannot update finished match"
- ❌ **New startAt in past** → Returns 400 with validation error

---

## DELETE /matches/{id}

**Description:** Cancel match (organizer only)  
**Authentication:** Required (cookie)  
**Parameters:**

- `id` (path, required): Match ID

**Expected Response:** `204 No Content`

**Test Cases:**

- ✅ **Valid cancellation by organizer** → Returns 204, match cancelled
- ❌ **Not authenticated** → Returns 401 "Not authenticated"
- ❌ **Not organizer** → Returns 403 "Only organizer can cancel"
- ❌ **Invalid match ID** → Returns 400 "Invalid match ID"
- ❌ **Match not found** → Returns 404 "Match not found"
- ❌ **Already finished** → Returns 400 "Cannot cancel finished match"
- 🔔 **Participants notified** → Notification sent to all participants

---

## POST /matches/{id}/join

**Description:** Join a match as participant  
**Authentication:** Required (cookie)  
**Parameters:**

- `id` (path, required): Match ID

**Expected Response:** `200 OK`

```json
{
  "message": "Successfully joined match",
  "match": {
    "id": "507f1f77bcf86cd799439030",
    "title": "Friday Evening Football",
    "participantCount": 16
  }
}
```

**Test Cases:**

- ✅ **Valid join** → Returns 200, user added to participants
- ❌ **Not authenticated** → Returns 401 "Not authenticated"
- ❌ **Invalid match ID** → Returns 400 "Invalid match ID"
- ❌ **Match not found** → Returns 404 "Match not found"
- ❌ **Already joined** → Returns 400 "Already a participant"
- ❌ **Match full** → Returns 400 "Match is full"
- ❌ **Match not scheduled** → Returns 400 "Can only join scheduled matches"
- ❌ **Match already started** → Returns 400 "Cannot join live or finished match"

---

## POST /matches/{id}/leave

**Description:** Leave a match as participant  
**Authentication:** Required (cookie)  
**Parameters:**

- `id` (path, required): Match ID

**Expected Response:** `200 OK`

```json
{
  "message": "Successfully left match"
}
```

**Test Cases:**

- ✅ **Valid leave** → Returns 200, user removed from participants
- ❌ **Not authenticated** → Returns 401 "Not authenticated"
- ❌ **Invalid match ID** → Returns 400 "Invalid match ID"
- ❌ **Match not found** → Returns 404 "Match not found"
- ❌ **Not a participant** → Returns 400 "Not a participant"
- ❌ **Organizer trying to leave** → Returns 400 "Organizer cannot leave (must cancel instead)"
- ❌ **Match already started** → Returns 400 "Cannot leave live or finished match"

---

## PUT /matches/{id}/score

**Description:** Update match score (organizer or participants)  
**Authentication:** Required (cookie)  
**Parameters:**

- `id` (path, required): Match ID

**Request Body:**

```json
{
  "scores": {
    "teamA": 3,
    "teamB": 2
  },
  "performance": {
    "507f1f77bcf86cd799439011": {
      "goals": 2,
      "assists": 1,
      "yellowCards": 0,
      "redCards": 0
    }
  }
}
```

**Expected Response:** `200 OK`

```json
{
  "message": "Score updated successfully",
  "match": {
    "id": "507f1f77bcf86cd799439030",
    "scores": {
      "teamA": 3,
      "teamB": 2
    }
  }
}
```

**Test Cases:**

- ✅ **Valid score update by organizer** → Returns 200
- ✅ **Valid score update by participant** → Returns 200
- ✅ **Include performance data** → Updates detailed stats
- ❌ **Not authenticated** → Returns 401 "Not authenticated"
- ❌ **Not organizer or participant** → Returns 403 "Not authorized"
- ❌ **Invalid match ID** → Returns 400 "Invalid match ID"
- ❌ **Match not found** → Returns 404 "Match not found"
- ❌ **Match not live or finished** → Returns 400 "Can only update scores for live or finished matches"
- ❌ **Invalid scores (negative)** → Returns 400 with validation error
- ❌ **Missing scores** → Returns 400 with validation error

---

## PUT /matches/{id}/status

**Description:** Update match status (organizer only)  
**Authentication:** Required (cookie)  
**Parameters:**

- `id` (path, required): Match ID

**Request Body:**

```json
{
  "status": "live"
}
```

**Expected Response:** `200 OK`

```json
{
  "message": "Status updated successfully",
  "match": {
    "id": "507f1f77bcf86cd799439030",
    "status": "live"
  }
}
```

**Test Cases:**

- ✅ **Valid status transition (scheduled → live)** → Returns 200
- ✅ **Valid status transition (live → finished)** → Returns 200, triggers stats update
- ✅ **Valid status transition (scheduled → cancelled)** → Returns 200
- ✅ **Valid status transition (live → cancelled)** → Returns 200
- ❌ **Not authenticated** → Returns 401 "Not authenticated"
- ❌ **Not organizer** → Returns 403 "Only organizer can update status"
- ❌ **Invalid match ID** → Returns 400 "Invalid match ID"
- ❌ **Match not found** → Returns 404 "Match not found"
- ❌ **Invalid status value** → Returns 400 with validation error
- ❌ **Invalid transition (finished → anything)** → Returns 400 "Cannot change status of finished match"
- ❌ **Invalid transition (cancelled → anything)** → Returns 400 "Cannot change status of cancelled match"
- 📊 **Status=finished triggers stats** → Event published for stats update

---

## POST /matches/{id}/start

**Description:** Mark match as live (Legacy - use PUT /matches/{id}/status)  
**Authentication:** Required (cookie)  
**Parameters:**

- `id` (path, required): Match ID

**Expected Response:** `200 OK`

**Test Cases:**

- ✅ **Valid start** → Returns 200, status changed to live
- ⚠️ **Legacy endpoint** → Use PUT /matches/{id}/status instead

---

## POST /matches/{id}/finish

**Description:** Finish match with scores and trigger auto stats update (Legacy)  
**Authentication:** Required (cookie)  
**Parameters:**

- `id` (path, required): Match ID

**Request Body:**

```json
{
  "scores": {
    "teamA": 3,
    "teamB": 2
  },
  "winner": "teamA",
  "performance": {
    "507f1f77bcf86cd799439011": {
      "goals": 2,
      "assists": 1,
      "yellowCards": 0,
      "redCards": 0
    }
  }
}
```

**Expected Response:** `200 OK`

```json
{
  "message": "Match finished successfully. Stats updated for all participants.",
  "match": {
    "id": "507f1f77bcf86cd799439030",
    "status": "finished",
    "scores": {
      "teamA": 3,
      "teamB": 2
    },
    "winner": "teamA"
  },
  "statsUpdated": true
}
```

**Test Cases:**

- ✅ **Valid finish with scores** → Returns 200, publishes `match.finished` event
- ✅ **Stats auto-updated** → StatsUpdateHandler processes event
- ✅ **ELO ratings calculated** → ±32 competitive, ±16 friendly
- ✅ **Streaks updated** → Win/loss streaks tracked
- ✅ **Performance metrics saved** → Goals, assists, cards tracked
- ❌ **Not authenticated** → Returns 401 "Not authenticated"
- ❌ **Not organizer** → Returns 403 "Only organizer can finish match"
- ❌ **Match not found** → Returns 404 "Match not found"
- ❌ **Already finished** → Returns 400 "Match already finished"
- ⚠️ **Legacy endpoint** → Use PUT /matches/{id}/status and PUT /matches/{id}/score

---

## Summary

### Total Endpoints: 11

### Status Code Distribution

- **200 OK**: 7 endpoints (read, update, join, leave, score, status)
- **201 Created**: 1 endpoint (create match)
- **204 No Content**: 1 endpoint (delete/cancel)
- **400 Bad Request**: Validation errors
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Authorization errors (organizer only)
- **404 Not Found**: Match not found

### Key Features

- **Match Lifecycle**: Full CRUD with status transitions
- **Participant Management**: Join/leave with validation
- **Scoring System**: Simple scores + detailed performance metrics
- **Status Management**: scheduled → live → finished (or cancelled)
- **Auto Stats Update**: Event-driven stats update on match finish
- **ELO Ratings**: Automatic calculation based on match type
- **Privacy Controls**: Public/private matches

### Validation Rules

- **Start Date**: Cannot be in the past
- **Sport**: Must be valid enum value
- **Coordinates**: Latitude (-90 to 90), Longitude (-180 to 180)
- **Max Participants**: Minimum 2
- **Status Transitions**: Enforced state machine

### Status Transitions

- ✅ scheduled → live
- ✅ scheduled → cancelled
- ✅ live → finished
- ✅ live → cancelled
- ❌ finished → (no transitions)
- ❌ cancelled → (no transitions)

### Event-Driven Features

- **match.finished**: Published when match status changes to finished
- **Stats Update**: Automatic processing via StatsUpdateHandler
- **Notifications**: Participants notified of match events
