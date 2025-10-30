# Tournaments Module - API Test Plan

## Overview

Tournament lifecycle management including creation, registration, bracket generation (knockout/league), match result updates, and team/participant management.

---

## POST /tournaments

**Description:** Create a new tournament  
**Authentication:** Required (cookie)  
**Request Body:**

```json
{
  "title": "Summer Football Championship 2025",
  "sport": "football",
  "type": "knockout",
  "description": "Annual summer tournament for local teams",
  "registrationWindow": {
    "start": "2025-11-01T00:00:00.000Z",
    "end": "2025-11-10T23:59:59.000Z"
  },
  "startDate": "2025-11-15T00:00:00.000Z",
  "endDate": "2025-11-30T23:59:59.000Z",
  "location": {
    "venue": "City Sports Complex",
    "city": "Johannesburg",
    "coordinates": [-26.2041, 28.0473]
  },
  "maxTeams": 16,
  "minTeams": 4,
  "teamSize": 11,
  "rules": "Standard FIFA rules apply",
  "prizes": "1st: R10000, 2nd: R5000, 3rd: R2500",
  "isPrivate": false
}
```

**Expected Response:** `201 Created`

```json
{
  "id": "507f1f77bcf86cd799439040",
  "title": "Summer Football Championship 2025",
  "sport": "football",
  "type": "knockout",
  "status": "registration",
  "organizer": {
    "id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "name": "John Doe"
  },
  "registeredTeams": [],
  "maxTeams": 16,
  "minTeams": 4,
  "createdAt": "2025-10-30T10:00:00.000Z"
}
```

**Test Cases:**

- ✅ **Valid tournament creation** → Returns 201 with tournament details
- ✅ **Status defaults to 'registration'** → Validates initial status
- ❌ **Not authenticated** → Returns 401 "Not authenticated"
- ❌ **Missing required fields** → Returns 400 with validation errors
- ❌ **Invalid sport type** → Returns 400 with validation error
- ❌ **Invalid tournament type** → Returns 400 (must be knockout or league)
- ❌ **Registration end before start** → Returns 400 with validation error
- ❌ **Start date before registration end** → Returns 400 with validation error
- ❌ **End date before start date** → Returns 400 with validation error
- ❌ **maxTeams < minTeams** → Returns 400 with validation error
- ❌ **minTeams < 2** → Returns 400 with validation error

---

## GET /tournaments

**Description:** List tournaments with filters  
**Authentication:** Optional  
**Parameters:**

- `sport` (query, optional): Filter by sport
- `type` (query, optional): Filter by type (knockout/league)
- `status` (query, optional): Filter by status
- `limit` (query, optional): Results per page
- `skip` (query, optional): Pagination offset

**Expected Response:** `200 OK`

```json
{
  "tournaments": [
    {
      "id": "507f1f77bcf86cd799439040",
      "title": "Summer Football Championship 2025",
      "sport": "football",
      "type": "knockout",
      "status": "registration",
      "registeredTeamsCount": 8,
      "maxTeams": 16,
      "startDate": "2025-11-15T00:00:00.000Z",
      "location": {
        "city": "Johannesburg"
      }
    }
  ],
  "total": 1
}
```

**Test Cases:**

- ✅ **List all tournaments** → Returns 200 with tournaments
- ✅ **Filter by sport** → Returns filtered results
- ✅ **Filter by type** → Returns knockout or league tournaments
- ✅ **Filter by status** → Returns tournaments in specific status
- ✅ **Empty results** → Returns 200 with empty array
- ❌ **Invalid sport** → Returns 400 with validation error
- ❌ **Invalid type** → Returns 400 with validation error

---

## GET /tournaments/{id}

**Description:** Get detailed tournament information  
**Authentication:** Optional  
**Parameters:**

- `id` (path, required): Tournament ID (MongoDB ObjectId)

**Expected Response:** `200 OK`

```json
{
  "id": "507f1f77bcf86cd799439040",
  "title": "Summer Football Championship 2025",
  "sport": "football",
  "type": "knockout",
  "status": "ongoing",
  "description": "Annual summer tournament for local teams",
  "organizer": {
    "id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "name": "John Doe"
  },
  "registrationWindow": {
    "start": "2025-11-01T00:00:00.000Z",
    "end": "2025-11-10T23:59:59.000Z"
  },
  "startDate": "2025-11-15T00:00:00.000Z",
  "endDate": "2025-11-30T23:59:59.000Z",
  "location": {
    "venue": "City Sports Complex",
    "city": "Johannesburg",
    "coordinates": [-26.2041, 28.0473]
  },
  "registeredTeams": [
    {
      "id": "507f1f77bcf86cd799439020",
      "name": "Thunder FC",
      "avatar": "https://example.com/team-avatar.jpg"
    }
  ],
  "registeredTeamsCount": 12,
  "maxTeams": 16,
  "minTeams": 4,
  "teamSize": 11,
  "rules": "Standard FIFA rules apply",
  "prizes": "1st: R10000, 2nd: R5000, 3rd: R2500",
  "currentRound": 2,
  "createdAt": "2025-10-30T10:00:00.000Z"
}
```

**Test Cases:**

- ✅ **Valid tournament ID** → Returns 200 with full details
- ✅ **Registered teams populated** → Validates team data
- ✅ **Current round included** → For ongoing tournaments
- ❌ **Invalid tournament ID** → Returns 400 "Invalid tournament ID"
- ❌ **Non-existent tournament** → Returns 404 "Tournament not found"

---

## PUT /tournaments/{id}

**Description:** Update tournament details (organizer or admin only)  
**Authentication:** Required (cookie)  
**Parameters:**

- `id` (path, required): Tournament ID

**Request Body:**

```json
{
  "title": "Updated Tournament Title",
  "description": "Updated description",
  "rules": "Updated rules",
  "prizes": "Updated prize pool"
}
```

**Expected Response:** `200 OK`

**Test Cases:**

- ✅ **Valid update by organizer** → Returns 200
- ✅ **Valid update by admin** → Returns 200
- ✅ **Update before tournament starts** → Allows all field updates
- ❌ **Not authenticated** → Returns 401 "Not authenticated"
- ❌ **Not organizer or admin** → Returns 403 "Only organizer or admin can update"
- ❌ **Tournament not found** → Returns 404 "Tournament not found"
- ❌ **Update structure after start** → Returns 400 "Cannot modify tournament structure after it has started"
- ❌ **Invalid data** → Returns 400 with validation errors

---

## DELETE /tournaments/{id}

**Description:** Cancel tournament (organizer or admin only)  
**Authentication:** Required (cookie)  
**Parameters:**

- `id` (path, required): Tournament ID

**Expected Response:** `204 No Content`

**Test Cases:**

- ✅ **Valid cancellation by organizer** → Returns 204
- ✅ **Valid cancellation by admin** → Returns 204
- ❌ **Not authenticated** → Returns 401 "Not authenticated"
- ❌ **Not organizer or admin** → Returns 403 "Not authorized"
- ❌ **Tournament not found** → Returns 404 "Tournament not found"
- ❌ **Cancel completed tournament** → Returns 400 "Cannot cancel completed tournament"

---

## POST /tournaments/{id}/join

**Description:** Register a team to join tournament  
**Authentication:** Required (cookie)  
**Parameters:**

- `id` (path, required): Tournament ID

**Request Body:**

```json
{
  "teamId": "507f1f77bcf86cd799439020"
}
```

**Expected Response:** `200 OK`

```json
{
  "message": "Successfully joined tournament",
  "tournament": {
    "id": "507f1f77bcf86cd799439040",
    "title": "Summer Football Championship 2025",
    "registeredTeamsCount": 9
  }
}
```

**Test Cases:**

- ✅ **Valid team registration** → Returns 200, team added
- ❌ **Not authenticated** → Returns 401 "Not authenticated"
- ❌ **Invalid tournament ID** → Returns 400 "Invalid tournament ID"
- ❌ **Tournament not found** → Returns 404 "Tournament not found"
- ❌ **Missing teamId** → Returns 400 with validation error
- ❌ **Invalid teamId** → Returns 400 with validation error
- ❌ **Team not found** → Returns 404 "Team not found"
- ❌ **Not registration phase** → Returns 400 "Not in registration phase"
- ❌ **Registration window closed** → Returns 400 "Registration window closed"
- ❌ **Tournament full** → Returns 400 "Tournament is full"
- ❌ **Team already registered** → Returns 400 "Team already registered"
- ❌ **User not team captain** → Returns 403 "Only team captain can register"

---

## POST /tournaments/{id}/leave

**Description:** Unregister a team from tournament  
**Authentication:** Required (cookie)  
**Parameters:**

- `id` (path, required): Tournament ID

**Request Body:**

```json
{
  "teamId": "507f1f77bcf86cd799439020"
}
```

**Expected Response:** `200 OK`

```json
{
  "message": "Successfully left tournament"
}
```

**Test Cases:**

- ✅ **Valid unregistration** → Returns 200, team removed
- ❌ **Not authenticated** → Returns 401 "Not authenticated"
- ❌ **Tournament not found** → Returns 404 "Tournament not found"
- ❌ **Team not registered** → Returns 400 "Team not registered"
- ❌ **Tournament already started** → Returns 400 "Cannot leave after tournament started"
- ❌ **User not team captain** → Returns 403 "Only team captain can unregister"

---

## POST /tournaments/{id}/register

**Description:** Register team/user (Legacy - use POST /tournaments/{id}/join)  
**Authentication:** Required (cookie)  
**Test Cases:**

- ⚠️ **Legacy endpoint** → Use POST /tournaments/{id}/join instead

---

## PUT /tournaments/{id}/start

**Description:** Start tournament and generate bracket  
**Authentication:** Required (cookie)  
**Parameters:**

- `id` (path, required): Tournament ID

**Expected Response:** `200 OK`

```json
{
  "message": "Tournament started successfully",
  "tournament": {
    "id": "507f1f77bcf86cd799439040",
    "status": "ongoing",
    "currentRound": 1
  },
  "bracket": {
    "type": "knockout",
    "rounds": [
      {
        "roundNumber": 1,
        "matches": [
          {
            "matchNumber": 1,
            "teamA": {
              "id": "507f1f77bcf86cd799439020",
              "name": "Thunder FC"
            },
            "teamB": {
              "id": "507f1f77bcf86cd799439021",
              "name": "Lightning United"
            }
          }
        ]
      }
    ]
  }
}
```

**Test Cases:**

- ✅ **Valid start with knockout** → Returns 200, generates single-elimination bracket
- ✅ **Valid start with league** → Returns 200, generates round-robin schedule
- ✅ **Bracket seeding randomized** → Validates bracket generation
- ❌ **Not authenticated** → Returns 401 "Not authenticated"
- ❌ **Not organizer** → Returns 403 "Only organizer can start"
- ❌ **Tournament not found** → Returns 404 "Tournament not found"
- ❌ **Not enough teams** → Returns 400 "Not enough teams (min: X)"
- ❌ **Tournament already started** → Returns 400 "Tournament already started"
- ❌ **Registration not closed** → Returns 400 "Registration window not closed"

---

## GET /tournaments/{id}/bracket

**Description:** Get tournament bracket with matches and standings  
**Authentication:** Optional  
**Parameters:**

- `id` (path, required): Tournament ID

**Expected Response:** `200 OK` (Knockout)

```json
{
  "tournamentId": "507f1f77bcf86cd799439040",
  "type": "knockout",
  "rounds": [
    {
      "roundNumber": 1,
      "roundName": "Round of 16",
      "matches": [
        {
          "matchNumber": 1,
          "teamA": {
            "id": "507f1f77bcf86cd799439020",
            "name": "Thunder FC"
          },
          "teamB": {
            "id": "507f1f77bcf86cd799439021",
            "name": "Lightning United"
          },
          "result": {
            "winner": "teamA",
            "scores": {
              "teamA": 3,
              "teamB": 1
            }
          },
          "completed": true
        }
      ]
    },
    {
      "roundNumber": 2,
      "roundName": "Quarterfinals",
      "matches": [
        {
          "matchNumber": 9,
          "teamA": {
            "id": "507f1f77bcf86cd799439020",
            "name": "Thunder FC"
          },
          "teamB": null,
          "completed": false
        }
      ]
    }
  ]
}
```

**Expected Response:** `200 OK` (League)

```json
{
  "tournamentId": "507f1f77bcf86cd799439040",
  "type": "league",
  "standings": [
    {
      "position": 1,
      "team": {
        "id": "507f1f77bcf86cd799439020",
        "name": "Thunder FC"
      },
      "played": 5,
      "won": 4,
      "drawn": 1,
      "lost": 0,
      "goalsFor": 12,
      "goalsAgainst": 3,
      "goalDifference": 9,
      "points": 13
    }
  ],
  "rounds": [
    {
      "roundNumber": 1,
      "matches": []
    }
  ]
}
```

**Test Cases:**

- ✅ **Valid knockout bracket** → Returns 200 with rounds and matches
- ✅ **Valid league bracket** → Returns 200 with standings and fixtures
- ✅ **Winner advancement tracked** → For knockout tournaments
- ✅ **League standings calculated** → Points, goal difference, etc.
- ❌ **Invalid tournament ID** → Returns 400 "Invalid tournament ID"
- ❌ **Tournament not found** → Returns 404 "Tournament not found"
- ❌ **Bracket not generated** → Returns 404 "Bracket not found"
- ❌ **Tournament not started** → Returns 400 "Tournament not started yet"

---

## POST /tournaments/{id}/match-result

**Description:** Update match result in tournament bracket  
**Authentication:** Required (cookie)  
**Parameters:**

- `id` (path, required): Tournament ID

**Request Body:**

```json
{
  "matchNumber": 1,
  "result": {
    "winner": "teamA",
    "scores": {
      "teamA": 3,
      "teamB": 1
    }
  }
}
```

**Expected Response:** `200 OK`

```json
{
  "message": "Match result updated successfully",
  "bracket": {
    "type": "knockout",
    "rounds": []
  }
}
```

**Test Cases:**

- ✅ **Valid knockout result** → Returns 200, advances winner to next round
- ✅ **Valid league result** → Returns 200, updates standings
- ✅ **League points calculated** → 3 for win, 1 for draw, 0 for loss
- ✅ **Goal difference updated** → For league standings
- ❌ **Not authenticated** → Returns 401 "Not authenticated"
- ❌ **Not organizer** → Returns 403 "Only organizer can update results"
- ❌ **Tournament not found** → Returns 404 "Tournament not found"
- ❌ **Invalid match number** → Returns 400 "Match not found"
- ❌ **Match already completed** → Returns 400 "Match already has result"
- ❌ **Invalid result data** → Returns 400 with validation error
- ❌ **Missing winner** → Returns 400 with validation error
- ❌ **Missing scores** → Returns 400 with validation error

---

## Summary

### Total Endpoints: 11

### Status Code Distribution

- **200 OK**: 7 endpoints (read, update, join, leave, start, bracket, result)
- **201 Created**: 1 endpoint (create tournament)
- **204 No Content**: 1 endpoint (cancel)
- **400 Bad Request**: Validation errors
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Authorization errors
- **404 Not Found**: Tournament not found

### Key Features

- **Tournament Types**: Knockout (single-elimination) and League (round-robin)
- **Bracket Generation**: Automatic bracket/schedule generation
- **Registration Management**: Time-window based registration
- **Match Results**: Update results and auto-advance winners
- **Standings Calculation**: Automatic for league tournaments
- **Team Management**: Captain-based registration

### Validation Rules

- **Min Teams**: At least 2 teams required
- **Max Teams**: Configurable per tournament
- **Registration Window**: Must precede tournament start
- **Date Validation**: Registration → Start → End
- **Team Captain**: Only captain can register team

### Tournament Statuses

- **registration**: Accepting team registrations
- **ongoing**: Tournament in progress
- **completed**: Tournament finished
- **cancelled**: Tournament cancelled

### Bracket Features

- **Knockout**: Single-elimination with round progression
- **League**: Round-robin with points table (3-1-0 system)
- **Seeding**: Random team seeding
- **Advancement**: Automatic winner progression (knockout)
- **Standings**: Automatic calculation (league)
