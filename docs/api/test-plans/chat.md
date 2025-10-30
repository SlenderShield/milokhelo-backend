# Chat Module - API Test Plan

## Overview

Real-time chat functionality with WebSocket support. Includes chat room management, message CRUD operations, and message history retrieval.

---

## GET /chat/rooms

**Description:** List user's chat rooms  
**Authentication:** Required (cookie)  
**Parameters:** None  
**Expected Response:** `200 OK`

```json
{
  "rooms": [
    {
      "id": "507f1f77bcf86cd799439050",
      "name": "Thunder FC Team Chat",
      "type": "team",
      "participants": [
        {
          "id": "507f1f77bcf86cd799439011",
          "username": "johndoe",
          "name": "John Doe"
        }
      ],
      "lastMessage": {
        "content": "See you at practice!",
        "sender": {
          "username": "johndoe"
        },
        "createdAt": "2025-10-30T15:00:00.000Z"
      },
      "unreadCount": 3,
      "createdAt": "2025-10-20T10:00:00.000Z",
      "updatedAt": "2025-10-30T15:00:00.000Z"
    }
  ],
  "total": 1
}
```

**Test Cases:**

- ✅ **Valid request** → Returns 200 with user's chat rooms
- ✅ **Includes unread count** → Validates unread message tracking
- ✅ **Sorted by last activity** → Most recent rooms first
- ✅ **Empty rooms list** → Returns 200 with empty array
- ❌ **Not authenticated** → Returns 401 "Not authenticated"

---

## POST /chat/rooms

**Description:** Create a new chat room  
**Authentication:** Required (cookie)  
**Request Body:**

```json
{
  "name": "Weekend Match Planning",
  "type": "group",
  "participants": [
    "507f1f77bcf86cd799439012",
    "507f1f77bcf86cd799439013"
  ],
  "relatedTo": {
    "type": "match",
    "id": "507f1f77bcf86cd799439030"
  }
}
```

**Expected Response:** `201 Created`

```json
{
  "id": "507f1f77bcf86cd799439051",
  "name": "Weekend Match Planning",
  "type": "group",
  "participants": [
    {
      "id": "507f1f77bcf86cd799439011",
      "username": "johndoe"
    },
    {
      "id": "507f1f77bcf86cd799439012",
      "username": "janedoe"
    }
  ],
  "relatedTo": {
    "type": "match",
    "id": "507f1f77bcf86cd799439030"
  },
  "createdAt": "2025-10-30T10:00:00.000Z"
}
```

**Test Cases:**

- ✅ **Valid room creation** → Returns 201, creator auto-added as participant
- ✅ **Direct message room (2 participants)** → Type set to 'direct'
- ✅ **Group chat room (3+ participants)** → Type set to 'group'
- ✅ **Link to entity (match/tournament)** → Validates relatedTo
- ❌ **Not authenticated** → Returns 401 "Not authenticated"
- ❌ **Empty participants list** → Returns 400 with validation error
- ❌ **Invalid participant IDs** → Returns 400 with validation error
- ❌ **Participant not found** → Returns 404 "User not found"
- ❌ **Invalid room type** → Returns 400 with validation error
- ❌ **Duplicate direct message room** → Returns existing room instead

---

## GET /chat/rooms/{roomId}/messages

**Description:** Fetch messages from a chat room  
**Authentication:** Required (cookie)  
**Parameters:**

- `roomId` (path, required): Chat room ID
- `limit` (query, optional): Number of messages (default: 50)
- `before` (query, optional): Fetch messages before this date/time

**Expected Response:** `200 OK`

```json
{
  "messages": [
    {
      "id": "507f1f77bcf86cd799439060",
      "content": "Great game yesterday!",
      "sender": {
        "id": "507f1f77bcf86cd799439011",
        "username": "johndoe",
        "name": "John Doe",
        "avatar": "https://example.com/avatar.jpg"
      },
      "roomId": "507f1f77bcf86cd799439050",
      "readBy": [
        "507f1f77bcf86cd799439011",
        "507f1f77bcf86cd799439012"
      ],
      "replyTo": null,
      "attachments": [],
      "edited": false,
      "deleted": false,
      "createdAt": "2025-10-30T14:00:00.000Z",
      "updatedAt": "2025-10-30T14:00:00.000Z"
    }
  ],
  "hasMore": false,
  "total": 1
}
```

**Test Cases:**

- ✅ **Valid request** → Returns 200 with messages
- ✅ **Pagination with limit** → Returns specified number of messages
- ✅ **Pagination with before** → Returns messages before timestamp
- ✅ **Messages sorted by time** → Newest first or oldest first
- ✅ **Empty message history** → Returns 200 with empty array
- ❌ **Not authenticated** → Returns 401 "Not authenticated"
- ❌ **Invalid room ID** → Returns 400 "Invalid room ID"
- ❌ **Room not found** → Returns 404 "Room not found"
- ❌ **Not a participant** → Returns 403 "Not a member of this room"
- ❌ **Invalid limit** → Returns 400 with validation error
- ❌ **Invalid date format** → Returns 400 with validation error

---

## POST /chat/rooms/{roomId}/messages

**Description:** Send a message to a chat room  
**Authentication:** Required (cookie)  
**Parameters:**

- `roomId` (path, required): Chat room ID

**Request Body:**

```json
{
  "content": "Looking forward to the match!",
  "replyTo": "507f1f77bcf86cd799439060",
  "attachments": [
    {
      "type": "image",
      "url": "https://example.com/image.jpg"
    }
  ]
}
```

**Expected Response:** `201 Created`

```json
{
  "id": "507f1f77bcf86cd799439061",
  "content": "Looking forward to the match!",
  "sender": {
    "id": "507f1f77bcf86cd799439011",
    "username": "johndoe"
  },
  "roomId": "507f1f77bcf86cd799439050",
  "replyTo": "507f1f77bcf86cd799439060",
  "attachments": [
    {
      "type": "image",
      "url": "https://example.com/image.jpg"
    }
  ],
  "createdAt": "2025-10-30T15:00:00.000Z"
}
```

**Test Cases:**

- ✅ **Valid message** → Returns 201, broadcasts via WebSocket
- ✅ **Message with reply** → Links to original message
- ✅ **Message with attachments** → Includes attachment data
- ✅ **WebSocket broadcast** → All room participants notified
- ❌ **Not authenticated** → Returns 401 "Not authenticated"
- ❌ **Invalid room ID** → Returns 400 "Invalid room ID"
- ❌ **Room not found** → Returns 404 "Room not found"
- ❌ **Not a participant** → Returns 403 "Not a member of this room"
- ❌ **Missing content** → Returns 400 with validation error
- ❌ **Empty content** → Returns 400 with validation error
- ❌ **Content too long** → Returns 400 with validation error
- ❌ **Invalid replyTo ID** → Returns 400 "Referenced message not found"

---

## PATCH /chat/messages/{messageId}

**Description:** Edit a message  
**Authentication:** Required (cookie)  
**Parameters:**

- `messageId` (path, required): Message ID

**Request Body:**

```json
{
  "content": "Updated message content"
}
```

**Expected Response:** `200 OK`

```json
{
  "id": "507f1f77bcf86cd799439061",
  "content": "Updated message content",
  "edited": true,
  "updatedAt": "2025-10-30T15:30:00.000Z"
}
```

**Test Cases:**

- ✅ **Valid edit by sender** → Returns 200, marks as edited
- ✅ **WebSocket broadcast** → All participants notified of edit
- ❌ **Not authenticated** → Returns 401 "Not authenticated"
- ❌ **Invalid message ID** → Returns 400 "Invalid message ID"
- ❌ **Message not found** → Returns 404 "Message not found"
- ❌ **Not message sender** → Returns 403 "Can only edit own messages"
- ❌ **Message already deleted** → Returns 400 "Cannot edit deleted message"
- ❌ **Empty content** → Returns 400 with validation error
- ❌ **Content too long** → Returns 400 with validation error

---

## DELETE /chat/messages/{messageId}

**Description:** Delete a message (soft delete)  
**Authentication:** Required (cookie)  
**Parameters:**

- `messageId` (path, required): Message ID

**Expected Response:** `204 No Content`

**Test Cases:**

- ✅ **Valid deletion by sender** → Returns 204, marks as deleted
- ✅ **Soft delete** → Message marked deleted, not removed from DB
- ✅ **WebSocket broadcast** → All participants notified
- ❌ **Not authenticated** → Returns 401 "Not authenticated"
- ❌ **Invalid message ID** → Returns 400 "Invalid message ID"
- ❌ **Message not found** → Returns 404 "Message not found"
- ❌ **Not message sender** → Returns 403 "Can only delete own messages"
- ❌ **Already deleted** → Returns 204 (idempotent)

---

## Summary

### Total Endpoints: 6

### Status Code Distribution

- **200 OK**: 3 endpoints (list rooms, list messages, edit message)
- **201 Created**: 2 endpoints (create room, send message)
- **204 No Content**: 1 endpoint (delete message)
- **400 Bad Request**: Validation errors
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Not a room participant
- **404 Not Found**: Room/message not found

### Key Features

- **Real-time Messaging**: WebSocket support with Socket.IO
- **Room Types**: Direct (1-on-1), Group, Team-based
- **Message Features**: Reply, attachments, edit, soft delete
- **Read Tracking**: Track message read status per user
- **Entity Linking**: Link rooms to matches/tournaments
- **Unread Counts**: Track unread messages per room

### Validation Rules

- **Message Content**: Required, non-empty, max length limit
- **Participants**: Minimum 2 for direct, 3+ for group
- **Room Type**: 'direct', 'group', 'team'
- **Attachment Types**: 'image', 'video', 'file'

### WebSocket Events

- **message.new**: Broadcast new messages
- **message.edited**: Broadcast message edits
- **message.deleted**: Broadcast message deletions
- **message.read**: Track read receipts

### Authorization Rules

- **Create Room**: Any authenticated user
- **Send Message**: Room participants only
- **Edit Message**: Message sender only
- **Delete Message**: Message sender only
- **View Messages**: Room participants only
