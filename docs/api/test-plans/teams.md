# Teams Module - API Test Plan

## Overview

Team lifecycle management including creation, updates, member management (join/leave), and team discovery.

---

## POST /teams

**Description:** Create a new team  
**Authentication:** Required (cookie)  
**Request Body:**

```json
{
  "name": "Thunder FC",
  "sport": "football",
  "description": "Competitive football team looking for matches",
  "avatar": "https://example.com/team-avatar.jpg",
  "isPrivate": false,
  "maxMembers": 15,
  "location": {
    "city": "Johannesburg",
    "country": "South Africa"
  }
}
```

**Expected Response:** `201 Created`

```json
{
  "id": "507f1f77bcf86cd799439020",
  "name": "Thunder FC",
  "sport": "football",
  "description": "Competitive football team looking for matches",
  "captain": {
    "id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "name": "John Doe"
  },
  "members": [
    {
      "id": "507f1f77bcf86cd799439011",
      "username": "johndoe",
      "name": "John Doe"
    }
  ],
  "memberCount": 1,
  "maxMembers": 15,
  "isPrivate": false,
  "createdAt": "2025-10-30T10:00:00.000Z"
}
```

**Test Cases:**

- ✅ **Valid team creation** → Returns 201 with team details, creator is captain
- ✅ **Creator automatically added as member** → Validates member initialization
- ❌ **Not authenticated** → Returns 401 "Not authenticated"
- ❌ **Missing required field (name)** → Returns 400 with validation error
- ❌ **Missing required field (sport)** → Returns 400 with validation error
- ❌ **Invalid sport type** → Returns 400 with validation error
- ❌ **Team name already exists** → Returns 400 "Team name already taken"
- ❌ **Description exceeds max length** → Returns 400 with validation error
- ❌ **Invalid maxMembers (< 2 or > 50)** → Returns 400 with validation error

---

## GET /teams

**Description:** List teams with optional filters  
**Authentication:** Optional  
**Parameters:**

- `sport` (query, optional): Filter by sport
- `q` (query, optional): Search by team name
- `limit` (query, optional): Results per page (default: 20)
- `skip` (query, optional): Pagination offset (default: 0)

**Expected Response:** `200 OK`

```json
{
  "teams": [
    {
      "id": "507f1f77bcf86cd799439020",
      "name": "Thunder FC",
      "sport": "football",
      "avatar": "https://example.com/team-avatar.jpg",
      "captain": {
        "id": "507f1f77bcf86cd799439011",
        "username": "johndoe"
      },
      "memberCount": 12,
      "maxMembers": 15,
      "isPrivate": false,
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

- ✅ **List all teams** → Returns 200 with paginated team list
- ✅ **Filter by sport** → Returns only teams of specified sport
- ✅ **Search by name** → Returns matching teams
- ✅ **Pagination works** → Returns correct page with limit and skip
- ✅ **Empty results** → Returns 200 with empty array
- ❌ **Invalid sport type** → Returns 400 with validation error
- ❌ **Invalid pagination parameters** → Returns 400 with validation error
- 🔒 **Private teams shown only to members** → Privacy validation

---

## GET /teams/{id}

**Description:** Get detailed team information  
**Authentication:** Optional  
**Parameters:**

- `id` (path, required): Team ID (MongoDB ObjectId)

**Expected Response:** `200 OK`

```json
{
  "id": "507f1f77bcf86cd799439020",
  "name": "Thunder FC",
  "sport": "football",
  "description": "Competitive football team looking for matches",
  "avatar": "https://example.com/team-avatar.jpg",
  "captain": {
    "id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "name": "John Doe",
    "avatar": "https://example.com/avatar.jpg"
  },
  "members": [
    {
      "id": "507f1f77bcf86cd799439011",
      "username": "johndoe",
      "name": "John Doe",
      "avatar": "https://example.com/avatar.jpg"
    },
    {
      "id": "507f1f77bcf86cd799439012",
      "username": "janedoe",
      "name": "Jane Doe",
      "avatar": "https://example.com/jane-avatar.jpg"
    }
  ],
  "memberCount": 2,
  "maxMembers": 15,
  "isPrivate": false,
  "joinCode": null,
  "location": {
    "city": "Johannesburg",
    "country": "South Africa"
  },
  "stats": {
    "matchesPlayed": 10,
    "wins": 6,
    "losses": 3,
    "draws": 1
  },
  "createdAt": "2025-10-30T10:00:00.000Z",
  "updatedAt": "2025-10-30T15:00:00.000Z"
}
```

**Test Cases:**

- ✅ **Valid team ID** → Returns 200 with full team details
- ✅ **Members array populated** → Validates member data
- ✅ **Team stats included** → Validates stats calculation
- ❌ **Invalid team ID format** → Returns 400 "Invalid team ID"
- ❌ **Non-existent team** → Returns 404 "Team not found"
- 🔒 **Private team details only for members** → Returns 403 for non-members

---

## PUT /teams/{id}

**Description:** Update team details (captain or admin only)  
**Authentication:** Required (cookie)  
**Parameters:**

- `id` (path, required): Team ID (MongoDB ObjectId)

**Request Body:**

```json
{
  "name": "Thunder FC Elite",
  "description": "Updated team description",
  "avatar": "https://example.com/new-team-avatar.jpg",
  "captain": "507f1f77bcf86cd799439012",
  "joinCode": "SECRET123",
  "isPrivate": true,
  "maxMembers": 20
}
```

**Expected Response:** `200 OK`

```json
{
  "id": "507f1f77bcf86cd799439020",
  "name": "Thunder FC Elite",
  "description": "Updated team description",
  "captain": {
    "id": "507f1f77bcf86cd799439012",
    "username": "janedoe",
    "name": "Jane Doe"
  },
  "isPrivate": true,
  "message": "Team updated successfully"
}
```

**Test Cases:**

- ✅ **Valid update by captain** → Returns 200 with updated team
- ✅ **Valid update by admin** → Returns 200 (admin override)
- ✅ **Captain transfer** → New captain must be existing member
- ✅ **Privacy settings update** → Can change from public to private
- ✅ **Partial update** → Only updates provided fields
- ❌ **Not authenticated** → Returns 401 "Not authenticated"
- ❌ **Not captain or admin** → Returns 403 "Only captain or admin can update"
- ❌ **Invalid team ID** → Returns 400 "Invalid team ID"
- ❌ **Team not found** → Returns 404 "Team not found"
- ❌ **New captain not a member** → Returns 400 "Captain must be a team member"
- ❌ **Invalid captain ID** → Returns 400 with validation error
- ❌ **Name already taken** → Returns 400 "Team name already exists"

---

## DELETE /teams/{id}

**Description:** Delete a team (captain or admin only)  
**Authentication:** Required (cookie)  
**Parameters:**

- `id` (path, required): Team ID (MongoDB ObjectId)

**Expected Response:** `204 No Content`

**Test Cases:**

- ✅ **Valid deletion by captain** → Returns 204, team deleted
- ✅ **Valid deletion by admin** → Returns 204 (admin override)
- ❌ **Not authenticated** → Returns 401 "Not authenticated"
- ❌ **Not captain or admin** → Returns 403 "Only captain or admin can delete"
- ❌ **Invalid team ID** → Returns 400 "Invalid team ID"
- ❌ **Team not found** → Returns 404 "Team not found"
- 🔄 **Active matches affected** → Should validate or prevent deletion
- 🔄 **Team members notified** → Optional notification feature

---

## POST /teams/{id}/join

**Description:** Join a team as a member  
**Authentication:** Required (cookie)  
**Parameters:**

- `id` (path, required): Team ID (MongoDB ObjectId)

**Request Body (for private teams):**

```json
{
  "joinCode": "SECRET123"
}
```

**Expected Response:** `200 OK`

```json
{
  "message": "Successfully joined team",
  "team": {
    "id": "507f1f77bcf86cd799439020",
    "name": "Thunder FC",
    "memberCount": 13
  }
}
```

**Test Cases:**

- ✅ **Valid join (public team)** → Returns 200, user added to members
- ✅ **Valid join with code (private team)** → Returns 200 with correct join code
- ❌ **Not authenticated** → Returns 401 "Not authenticated"
- ❌ **Invalid team ID** → Returns 400 "Invalid team ID"
- ❌ **Team not found** → Returns 404 "Team not found"
- ❌ **Already a member** → Returns 400 "Already a member of this team"
- ❌ **Team full** → Returns 400 "Team has reached maximum members"
- ❌ **Private team without join code** → Returns 403 "Join code required"
- ❌ **Invalid join code** → Returns 403 "Invalid join code"
- ❌ **Missing join code** → Returns 403 "Join code required for private team"

---

## POST /teams/{id}/leave

**Description:** Leave a team  
**Authentication:** Required (cookie)  
**Parameters:**

- `id` (path, required): Team ID (MongoDB ObjectId)

**Expected Response:** `200 OK`

```json
{
  "message": "Successfully left team"
}
```

**Test Cases:**

- ✅ **Valid leave** → Returns 200, user removed from members
- ❌ **Not authenticated** → Returns 401 "Not authenticated"
- ❌ **Invalid team ID** → Returns 400 "Invalid team ID"
- ❌ **Team not found** → Returns 404 "Team not found"
- ❌ **Not a member** → Returns 400 "Not a member of this team"
- ❌ **Captain trying to leave** → Returns 400 "Captain must transfer captaincy first or delete team"
- 🔄 **Captain transfers before leaving** → Must update captain first

---

## Summary

### Total Endpoints: 7

### Status Code Distribution

- **200 OK**: 4 endpoints (read, update, join, leave)
- **201 Created**: 1 endpoint (create team)
- **204 No Content**: 1 endpoint (delete team)
- **400 Bad Request**: Validation errors
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Authorization errors (captain only)
- **404 Not Found**: Team not found

### Key Features

- **Team Management**: Full CRUD operations for teams
- **Member Management**: Join/leave operations with validation
- **Privacy Controls**: Public/private teams with join codes
- **Role-Based Access**: Captain and admin privileges
- **Team Statistics**: Track wins, losses, draws
- **Capacity Management**: Maximum member limits

### Validation Rules

- **Team Name**: Required, must be unique
- **Sport**: Required, must be valid enum value
- **Max Members**: 2-50 members
- **Join Code**: Required for private teams
- **Captain**: Must be existing team member

### Authorization Rules

- **Create Team**: Any authenticated user (becomes captain)
- **Update Team**: Captain or admin only
- **Delete Team**: Captain or admin only
- **Join Team**: Any authenticated user (with join code if private)
- **Leave Team**: Any member except captain
- **Captain Transfer**: New captain must be existing member
