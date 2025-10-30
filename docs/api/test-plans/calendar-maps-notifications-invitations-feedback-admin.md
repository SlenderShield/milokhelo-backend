# Calendar, Maps, Notifications, Invitations, Feedback, and Admin Modules - API Test Plan

## Calendar Module

### Overview

Backend calendar events for device sync and Google Calendar OAuth2 integration with bidirectional sync.

---

### GET /calendar/events

**Description:** Fetch backend events for user (device sync)  
**Authentication:** Required (cookie)  
**Parameters:**

- `startDate` (query, optional): Filter events after date
- `endDate` (query, optional): Filter events before date

**Expected Response:** `200 OK`

```json
{
  "events": [
    {
      "id": "507f1f77bcf86cd799439090",
      "title": "Match at City Complex",
      "date": "2025-11-01T18:00:00.000Z",
      "type": "match",
      "relatedTo": {
        "type": "match",
        "id": "507f1f77bcf86cd799439030"
      },
      "synced": true,
      "createdAt": "2025-10-30T10:00:00.000Z"
    }
  ]
}
```

**Test Cases:**

- ✅ **Valid request** → Returns 200 with user's events
- ✅ **Filter by date range** → Returns filtered events
- ❌ **Not authenticated** → Returns 401

---

### POST /calendar/events

**Description:** Create or update event from device  
**Authentication:** Required (cookie)  
**Request Body:**

```json
{
  "title": "Training Session",
  "date": "2025-11-05T17:00:00.000Z",
  "description": "Weekly training",
  "type": "custom",
  "deviceId": "device123"
}
```

**Expected Response:** `201 Created`

**Test Cases:**

- ✅ **Valid event creation** → Returns 201
- ❌ **Not authenticated** → Returns 401
- ❌ **Invalid date** → Returns 400

---

### POST /calendar/sync

**Description:** Sync device events with backend  
**Authentication:** Required (cookie)  
**Request Body:**

```json
{
  "events": [
    {
      "title": "Event 1",
      "date": "2025-11-01T18:00:00.000Z"
    }
  ],
  "deviceId": "device123"
}
```

**Expected Response:** `200 OK`

**Test Cases:**

- ✅ **Valid sync** → Merges device events with backend
- ❌ **Not authenticated** → Returns 401

---

### GET /calendar/google/auth

**Description:** Get Google Calendar OAuth URL  
**Authentication:** Required (cookie)  
**Expected Response:** `200 OK`

```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

**Test Cases:**

- ✅ **Valid request** → Returns authorization URL
- ❌ **Not authenticated** → Returns 401

---

### GET /calendar/google/callback

**Description:** Google Calendar OAuth callback  
**Authentication:** Required (cookie)  
**Parameters:**

- `code` (query, required): Authorization code

**Expected Response:** `200 OK`

**Test Cases:**

- ✅ **Valid code** → Exchanges for tokens, saves to user
- ❌ **Invalid code** → Returns 400
- ❌ **Not authenticated** → Returns 401

---

### POST /calendar/google/sync

**Description:** Import events from Google Calendar  
**Authentication:** Required (cookie)  
**Expected Response:** `200 OK`

```json
{
  "imported": 5,
  "message": "Events synced successfully"
}
```

**Test Cases:**

- ✅ **Valid sync** → Imports Google Calendar events
- ❌ **Google Calendar not connected** → Returns 400
- ❌ **Not authenticated** → Returns 401

---

### DELETE /calendar/google/disconnect

**Description:** Disconnect Google Calendar  
**Authentication:** Required (cookie)  
**Expected Response:** `200 OK`

**Test Cases:**

- ✅ **Valid disconnect** → Removes tokens
- ❌ **Not authenticated** → Returns 401

---

## Maps Module

### Overview of maps

Mobile-submitted map locations and map-based venue pins for geospatial display.

---

### GET /maps/nearby

**Description:** Fetch nearby venue pins for maps  
**Authentication:** Optional  
**Parameters:**

- `lat` (query, required): Latitude
- `lng` (query, required): Longitude
- `radius` (query, optional): Search radius in meters

**Expected Response:** `200 OK`

```json
{
  "pins": [
    {
      "id": "507f1f77bcf86cd799439070",
      "type": "venue",
      "name": "City Sports Complex",
      "lat": -26.2041,
      "lng": 28.0473,
      "sport": "football"
    }
  ]
}
```

**Test Cases:**

- ✅ **Valid geospatial query** → Returns nearby pins
- ❌ **Missing coordinates** → Returns 400
- ❌ **Invalid coordinates** → Returns 400

---

### POST /maps/submit

**Description:** Submit location for entity (match/tournament)  
**Authentication:** Required (cookie)  
**Request Body:**

```json
{
  "entityType": "match",
  "entityId": "507f1f77bcf86cd799439030",
  "name": "Match Location",
  "lat": -26.2041,
  "lng": 28.0473,
  "address": "123 Main St"
}
```

**Expected Response:** `201 Created`

**Test Cases:**

- ✅ **Valid submission** → Returns 201
- ❌ **Not authenticated** → Returns 401
- ❌ **Invalid entity** → Returns 400

---

### GET /maps/{entityType}/{entityId}

**Description:** Get stored location for entity  
**Authentication:** Optional  
**Parameters:**

- `entityType` (path, required): 'match' or 'tournament'
- `entityId` (path, required): Entity ID

**Expected Response:** `200 OK`

**Test Cases:**

- ✅ **Valid request** → Returns location data
- ❌ **Entity not found** → Returns 404

---

## Notifications Module

### Overview of notifications

Notification management with FCM/APNS push notification support and multi-device tracking.

---

### GET /notifications

**Description:** List user's notifications  
**Authentication:** Required (cookie)  
**Parameters:**

- `limit` (query, optional): Results per page
- `skip` (query, optional): Pagination offset

**Expected Response:** `200 OK`

```json
{
  "notifications": [
    {
      "id": "507f1f77bcf86cd799439100",
      "title": "Match Starting Soon",
      "message": "Your match starts in 30 minutes",
      "type": "match_reminder",
      "isRead": false,
      "data": {
        "matchId": "507f1f77bcf86cd799439030"
      },
      "createdAt": "2025-10-30T17:30:00.000Z"
    }
  ],
  "total": 1,
  "unreadCount": 1
}
```

**Test Cases:**

- ✅ **Valid request** → Returns user's notifications
- ✅ **Includes unread count** → Validates tracking
- ❌ **Not authenticated** → Returns 401

---

### GET /notifications/{id}

**Description:** Get notification by ID  
**Authentication:** Required (cookie)  
**Expected Response:** `200 OK`

**Test Cases:**

- ✅ **Valid notification** → Returns 200
- ❌ **Not user's notification** → Returns 403
- ❌ **Not found** → Returns 404

---

### DELETE /notifications/{id}

**Description:** Delete notification  
**Authentication:** Required (cookie)  
**Expected Response:** `204 No Content`

**Test Cases:**

- ✅ **Valid deletion** → Returns 204
- ❌ **Not user's notification** → Returns 403

---

### PUT /notifications/{id}/read

**Description:** Mark notification as read  
**Authentication:** Required (cookie)  
**Expected Response:** `200 OK`

**Test Cases:**

- ✅ **Valid mark as read** → Returns 200
- ❌ **Not user's notification** → Returns 403

---

### GET /notifications/unread/count

**Description:** Get unread count  
**Authentication:** Required (cookie)  
**Expected Response:** `200 OK`

```json
{
  "count": 3
}
```

**Test Cases:**

- ✅ **Valid request** → Returns unread count
- ❌ **Not authenticated** → Returns 401

---

### PATCH /notifications/read-all

**Description:** Mark all as read  
**Authentication:** Required (cookie)  
**Expected Response:** `200 OK`

**Test Cases:**

- ✅ **Valid request** → Marks all unread as read
- ❌ **Not authenticated** → Returns 401

---

### POST /notifications/push-token

**Description:** Register device push token  
**Authentication:** Required (cookie)  
**Request Body:**

```json
{
  "token": "fcm_token_here",
  "platform": "android",
  "deviceId": "device123"
}
```

**Expected Response:** `201 Created`

**Test Cases:**

- ✅ **Valid registration** → Returns 201
- ✅ **Multiple devices supported** → Can register multiple tokens
- ❌ **Not authenticated** → Returns 401
- ❌ **Invalid platform** → Returns 400 (must be ios/android/web)
- ❌ **Token too short** → Returns 400 (10-500 chars)

---

### DELETE /notifications/push-token

**Description:** Unregister device push token  
**Authentication:** Required (cookie)  
**Request Body:**

```json
{
  "token": "fcm_token_here"
}
```

**Expected Response:** `200 OK`

**Test Cases:**

- ✅ **Valid unregistration** → Returns 200
- ❌ **Not authenticated** → Returns 401

---

## Invitations Module

### Overview of invitations

Match/tournament/team invitations with accept/decline workflow.

---

### POST /invitations

**Description:** Send invitation  
**Authentication:** Required (cookie)  
**Request Body:**

```json
{
  "recipientId": "507f1f77bcf86cd799439012",
  "type": "match",
  "entityId": "507f1f77bcf86cd799439030",
  "message": "Join our match this weekend!"
}
```

**Expected Response:** `201 Created`

**Test Cases:**

- ✅ **Valid invitation** → Returns 201, notifies recipient
- ❌ **Not authenticated** → Returns 401
- ❌ **Invalid recipient** → Returns 404
- ❌ **Invalid entity** → Returns 404

---

### GET /invitations

**Description:** List user's invitations  
**Authentication:** Required (cookie)  
**Parameters:**

- `status` (query, optional): Filter by status

**Expected Response:** `200 OK`

```json
{
  "invitations": [
    {
      "id": "507f1f77bcf86cd799439110",
      "sender": {
        "id": "507f1f77bcf86cd799439011",
        "username": "johndoe"
      },
      "type": "match",
      "entityId": "507f1f77bcf86cd799439030",
      "status": "pending",
      "message": "Join our match!",
      "createdAt": "2025-10-30T10:00:00.000Z"
    }
  ]
}
```

**Test Cases:**

- ✅ **Valid request** → Returns user's invitations
- ✅ **Filter by status** → Returns filtered invitations
- ❌ **Not authenticated** → Returns 401

---

### POST /invitations/{id}/respond

**Description:** Accept or decline invitation  
**Authentication:** Required (cookie)  
**Parameters:**

- `id` (path, required): Invitation ID

**Request Body:**

```json
{
  "response": "accept"
}
```

**Expected Response:** `200 OK`

**Test Cases:**

- ✅ **Accept invitation** → Returns 200, adds user to entity
- ✅ **Decline invitation** → Returns 200, marks as declined
- ❌ **Not authenticated** → Returns 401
- ❌ **Not recipient** → Returns 403
- ❌ **Already responded** → Returns 400

---

## Feedback Module

### Overview of feedback

User feedback submission and admin review.

---

### POST /feedback

**Description:** Submit feedback or report  
**Authentication:** Required (cookie)  
**Request Body:**

```json
{
  "type": "bug",
  "message": "Found a bug in match scoring",
  "category": "matches",
  "attachments": ["https://example.com/screenshot.jpg"]
}
```

**Expected Response:** `201 Created`

**Test Cases:**

- ✅ **Valid submission** → Returns 201
- ❌ **Not authenticated** → Returns 401
- ❌ **Invalid type** → Returns 400

---

### GET /feedback

**Description:** List feedback (admin only)  
**Authentication:** Required (cookie) + admin role  
**Expected Response:** `200 OK`

**Test Cases:**

- ✅ **Valid request by admin** → Returns all feedback
- ❌ **Not admin** → Returns 403

---

## Admin Module

### Overview of admin

Admin-only endpoints for system reports and moderation.

---

### GET /admin/reports

**Description:** List system reports and moderation items  
**Authentication:** Required (cookie) + admin role  
**Parameters:**

- `type` (query, optional): Filter by report type
- `status` (query, optional): Filter by status

**Expected Response:** `200 OK`

```json
{
  "reports": [
    {
      "id": "507f1f77bcf86cd799439120",
      "type": "user_report",
      "reportedBy": {
        "id": "507f1f77bcf86cd799439011",
        "username": "johndoe"
      },
      "reportedUser": {
        "id": "507f1f77bcf86cd799439012",
        "username": "janedoe"
      },
      "reason": "Inappropriate behavior",
      "status": "pending",
      "createdAt": "2025-10-30T10:00:00.000Z"
    }
  ]
}
```

**Test Cases:**

- ✅ **Valid request by admin** → Returns reports
- ❌ **Not authenticated** → Returns 401
- ❌ **Not admin** → Returns 403

---

## Summary

### Module Endpoints Count

- **Calendar**: 7 endpoints
- **Maps**: 3 endpoints
- **Notifications**: 8 endpoints
- **Invitations**: 3 endpoints
- **Feedback**: 2 endpoints
- **Admin**: 1+ endpoints

### Key Features

- **Calendar**: Device sync + Google Calendar OAuth2 integration
- **Maps**: Geospatial venue discovery and entity location tracking
- **Notifications**: FCM/APNS push with multi-device support
- **Invitations**: Entity-based invitation system
- **Feedback**: User-submitted feedback and bug reports
- **Admin**: Moderation and system management

### Authentication Requirements

- All modules require authentication except Maps nearby search
- Admin module requires admin role (level 4+)
- Calendar Google integration requires OAuth tokens
- Notifications support multi-device registration
