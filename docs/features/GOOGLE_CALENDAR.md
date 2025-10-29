# Google Calendar Integration

Complete guide to the Google Calendar API integration with OAuth2 authentication and bidirectional event synchronization.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Setup](#setup)
  - [Google Cloud Console Setup](#google-cloud-console-setup)
  - [Environment Configuration](#environment-configuration)
- [OAuth2 Flow](#oauth2-flow)
- [Usage](#usage)
  - [Connecting Google Calendar](#connecting-google-calendar)
  - [Importing Events](#importing-events)
  - [Exporting Events](#exporting-events)
  - [Disconnecting](#disconnecting)
- [API Endpoints](#api-endpoints)
- [Event Synchronization](#event-synchronization)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Production Considerations](#production-considerations)

## Overview

The Milokhelo backend provides full integration with Google Calendar API, allowing users to:

- **Connect** their Google Calendar accounts via OAuth2
- **Import** events from Google Calendar to Milokhelo
- **Export** Milokhelo events to Google Calendar automatically
- **Sync** bidirectionally to keep calendars in sync
- **Disconnect** at any time to revoke access

The integration is built on the official Google Calendar API v3 and uses OAuth2 for secure authentication.

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Calendar Module                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         CalendarService (Application)                 │  │
│  │  • Creates events in backend                          │  │
│  │  • Automatically exports to Google Calendar           │  │
│  │  • Imports events from Google Calendar                │  │
│  │  • Manages OAuth tokens                               │  │
│  └───────────────────┬──────────────────────────────────┘  │
│                      │                                       │
│  ┌───────────────────▼──────────────────────────────────┐  │
│  │      GoogleCalendarService (Infrastructure)           │  │
│  │  • OAuth2 authentication flow                         │  │
│  │  • Google Calendar API v3 integration                 │  │
│  │  • Event format conversion                            │  │
│  │  • Token management and refresh                       │  │
│  └───────────────────┬──────────────────────────────────┘  │
│                      │                                       │
│  ┌───────────────────▼──────────────────────────────────┐  │
│  │      CalendarRepository (Persistence)                 │  │
│  │  • Stores backend events                              │  │
│  │  • Stores Google OAuth tokens per user                │  │
│  │  • Links Google event IDs to backend events           │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │  Google Calendar API  │
                    │        (v3)           │
                    └──────────────────────┘
```

### OAuth2 Flow

```
User clicks "Connect Google Calendar"
    │
    ▼
Backend generates OAuth2 authorization URL
    │
    ▼
User redirected to Google consent screen
    │
    ▼
User grants calendar permissions
    │
    ▼
Google redirects to callback URL with code
    │
    ▼
Backend exchanges code for access + refresh tokens
    │
    ▼
Tokens stored in database for user
    │
    ▼
User's Google Calendar is now connected! ✅
```

### Event Synchronization Flow

```
USER CREATES EVENT IN MILOKHELO
    │
    ▼
CalendarService.create(eventData)
    │
    ├─ Save to backend database
    │
    └─ If user has Google tokens:
        └─ GoogleCalendarService.createEvent()
            └─ Event created in Google Calendar ✅


USER IMPORTS FROM GOOGLE CALENDAR
    │
    ▼
CalendarService.syncWithGoogleCalendar()
    │
    ▼
GoogleCalendarService.listEvents(timeMin, timeMax)
    │
    ▼
For each Google event:
    └─ Convert to backend format
    └─ Save to backend database
    └─ Link Google event ID ✅
```

## Features

### ✅ OAuth2 Authentication
- Secure authorization via Google OAuth2
- Access token and refresh token management
- Automatic token refresh on expiration
- Per-user token storage

### ✅ Event Import
- Import events from Google Calendar to Milokhelo
- Configurable time range for import
- Automatic format conversion
- Deduplication via Google event ID tracking

### ✅ Event Export
- Automatically export Milokhelo events to Google Calendar
- Seamless background sync
- Links backend events to Google Calendar events

### ✅ Bidirectional Sync
- Keep both calendars in sync
- Import on demand or scheduled
- Export happens automatically on event creation

### ✅ Disconnect Capability
- Users can disconnect at any time
- Tokens removed from database
- Access revoked

### ✅ Graceful Degradation
- Works even when Google Calendar is disabled in config
- Clear error messages when not configured
- No impact on core calendar functionality

## Setup

### Google Cloud Console Setup

#### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Note your project ID

#### 2. Enable Google Calendar API

1. In Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for "Google Calendar API"
3. Click on it and press **Enable**

#### 3. Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** user type (or Internal for Google Workspace)
3. Fill in app information:
   - **App name**: Milokhelo
   - **User support email**: Your email
   - **Developer contact**: Your email
4. Add scopes:
   - `.../auth/calendar.readonly` (Read calendar events)
   - `.../auth/calendar.events` (Create/edit calendar events)
5. Add test users if using External type
6. Click **Save and Continue**

#### 4. Create OAuth2 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Choose **Web application**
4. Configure:
   - **Name**: Milokhelo Backend
   - **Authorized redirect URIs**: Add your callback URL
     - Development: `http://localhost:4000/api/v1/calendar/google/callback`
     - Production: `https://api.yourdomain.com/api/v1/calendar/google/callback`
5. Click **Create**
6. Copy the **Client ID** and **Client Secret**

### Environment Configuration

Add these variables to your `.env` file:

```env
# Google Calendar Integration
GOOGLE_CALENDAR_ENABLED=true

# OAuth2 Credentials (from Google Cloud Console)
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here

# Callback URL (must match authorized redirect URI)
GOOGLE_CALENDAR_REDIRECT_URI=http://localhost:4000/api/v1/calendar/google/callback
```

**Production:**
```env
GOOGLE_CALENDAR_ENABLED=true
GOOGLE_CLIENT_ID=prod-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=prod-client-secret
GOOGLE_CALENDAR_REDIRECT_URI=https://api.milokhelo.com/api/v1/calendar/google/callback
```

## OAuth2 Flow

### Step 1: Get Authorization URL

```bash
GET /api/v1/calendar/google/auth
Authorization: Session Cookie

Response:
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?client_id=..."
}
```

### Step 2: Redirect User

Frontend redirects user to the `authUrl`. User sees Google's consent screen and grants permissions.

### Step 3: Handle Callback

Google redirects back to your callback URL with authorization code:

```
http://localhost:4000/api/v1/calendar/google/callback?code=4/0A...&state=userId
```

Backend automatically:
1. Exchanges code for tokens
2. Stores tokens in database
3. Returns success response

### Step 4: User is Connected

User's Google Calendar is now connected and ready for sync!

## Usage

### Connecting Google Calendar

**Frontend Flow:**

```javascript
// 1. Get authorization URL
const response = await fetch('/api/v1/calendar/google/auth', {
  credentials: 'include'
});
const { authUrl } = await response.json();

// 2. Redirect user to Google consent screen
window.location.href = authUrl;

// 3. Google redirects to callback (handled by backend)
// 4. Backend redirects back to frontend with success
```

**Backend handles callback automatically:**

```javascript
// GET /api/v1/calendar/google/callback?code=...
// Backend exchanges code for tokens and stores them
// Returns success response
```

### Importing Events

Import events from Google Calendar to Milokhelo:

```javascript
// Import events (default: next 30 days)
const response = await fetch('/api/v1/calendar/google/sync', {
  method: 'POST',
  credentials: 'include'
});

const data = await response.json();
console.log(`Imported ${data.importedCount} events`);
```

**With custom time range:**

```javascript
const response = await fetch('/api/v1/calendar/google/sync', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    timeMin: '2025-10-30T00:00:00Z',
    timeMax: '2025-12-31T23:59:59Z'
  })
});
```

### Exporting Events

Events are **automatically exported** to Google Calendar when you create them:

```javascript
// Create event in Milokhelo
const response = await fetch('/api/v1/calendar/events', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Football Match',
    date: '2025-11-05T15:00:00Z',
    relatedTo: {
      type: 'match',
      id: 'match123'
    }
  })
});

// Event automatically created in Google Calendar too! ✅
```

### Disconnecting

Disconnect Google Calendar integration:

```javascript
const response = await fetch('/api/v1/calendar/google/disconnect', {
  method: 'DELETE',
  credentials: 'include'
});

const data = await response.json();
console.log(data.message); // "Google Calendar disconnected successfully"
```

## API Endpoints

### GET /calendar/google/auth

Get Google OAuth2 authorization URL.

**Request:**
```http
GET /api/v1/calendar/google/auth
Authorization: Session Cookie
```

**Response:**
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?client_id=..."
}
```

### GET /calendar/google/callback

OAuth2 callback endpoint (called by Google, not directly by client).

**Request:**
```http
GET /api/v1/calendar/google/callback?code=AUTH_CODE&state=USER_ID
```

**Response:**
```json
{
  "success": true,
  "message": "Google Calendar connected successfully"
}
```

### POST /calendar/google/sync

Import events from Google Calendar.

**Request:**
```http
POST /api/v1/calendar/google/sync
Authorization: Session Cookie
Content-Type: application/json

{
  "timeMin": "2025-10-30T00:00:00Z",  // Optional
  "timeMax": "2025-12-31T23:59:59Z"   // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Imported 5 events from Google Calendar",
  "importedCount": 5,
  "events": [
    {
      "id": "event123",
      "title": "Team Meeting",
      "date": "2025-11-01T10:00:00Z",
      "googleEventId": "abc123xyz"
    }
  ]
}
```

### DELETE /calendar/google/disconnect

Disconnect Google Calendar integration.

**Request:**
```http
DELETE /api/v1/calendar/google/disconnect
Authorization: Session Cookie
```

**Response:**
```json
{
  "success": true,
  "message": "Google Calendar disconnected successfully"
}
```

## Event Synchronization

### Event Mapping

**Google Calendar Event → Milokhelo Event:**

```javascript
{
  // Google Calendar fields
  summary: "Team Meeting"           → title: "Team Meeting"
  start.dateTime: "2025-11-01T..."  → date: "2025-11-01T..."
  description: "..."                → (stored in metadata)
  location: "Conference Room"       → (stored in metadata)
  
  // Backend-specific
  googleEventId: "abc123xyz"        // Link to original Google event
  syncedWithGoogle: true
}
```

**Milokhelo Event → Google Calendar Event:**

```javascript
{
  // Milokhelo fields
  title: "Football Match"           → summary: "Football Match"
  date: "2025-11-05T15:00:00Z"     → start.dateTime: "2025-11-05T15:00:00Z"
  relatedTo: { type: "match", ... } → description: "Match ID: ..."
  
  // Google-specific
  googleEventId: "xyz789abc"        // Stored in backend for reference
}
```

### Deduplication

Events are deduplicated using Google event IDs:

```javascript
// Check if event already imported
const existingEvent = await calendarRepository.findByGoogleEventId(googleEventId);

if (existingEvent) {
  // Skip - already imported
  return;
}

// Import new event
await calendarRepository.create({
  ...eventData,
  googleEventId: googleEventId
});
```

### Automatic Export

When creating an event in Milokhelo:

```javascript
async create(userId, data) {
  // 1. Save to backend database
  const event = await this.calendarRepository.create(userId, data);
  
  // 2. Check if user has Google Calendar connected
  const userTokens = await this.calendarRepository.getGoogleTokens(userId);
  
  // 3. Export to Google Calendar if connected
  if (userTokens && this.googleCalendarService.isEnabled()) {
    const googleEvent = await this.googleCalendarService.createEvent(
      userTokens,
      data
    );
    
    // 4. Store Google event ID
    await this.calendarRepository.update(event.id, {
      googleEventId: googleEvent.id
    });
  }
  
  return event;
}
```

## Testing

### Manual Testing

#### 1. Test Authorization Flow

```bash
# Get auth URL
curl -X GET http://localhost:4000/api/v1/calendar/google/auth \
  -H "Cookie: session=your-session-cookie"

# Open authUrl in browser, grant permissions
# Google redirects to callback URL
# Check if tokens are stored in database
```

#### 2. Test Event Import

```bash
# Import events
curl -X POST http://localhost:4000/api/v1/calendar/google/sync \
  -H "Cookie: session=your-session-cookie" \
  -H "Content-Type: application/json"

# Check backend database for imported events
```

#### 3. Test Event Export

```bash
# Create event in Milokhelo
curl -X POST http://localhost:4000/api/v1/calendar/events \
  -H "Cookie: session=your-session-cookie" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Event",
    "date": "2025-11-10T15:00:00Z"
  }'

# Check Google Calendar for exported event
```

#### 4. Test Disconnect

```bash
# Disconnect
curl -X DELETE http://localhost:4000/api/v1/calendar/google/disconnect \
  -H "Cookie: session=your-session-cookie"

# Verify tokens removed from database
```

### Integration Tests

```javascript
describe('Google Calendar Integration', () => {
  it('should connect Google Calendar via OAuth2', async () => {
    const authUrl = await calendarService.getGoogleCalendarAuthUrl(userId);
    expect(authUrl).to.include('accounts.google.com');
  });

  it('should import events from Google Calendar', async () => {
    // Mock Google API responses
    const result = await calendarService.syncWithGoogleCalendar(userId);
    expect(result.importedCount).to.be.greaterThan(0);
  });

  it('should export event to Google Calendar on creation', async () => {
    const event = await calendarService.create(userId, eventData);
    expect(event.googleEventId).to.exist;
  });

  it('should disconnect Google Calendar', async () => {
    await calendarService.disconnectGoogleCalendar(userId);
    const tokens = await calendarRepository.getGoogleTokens(userId);
    expect(tokens).to.be.null;
  });
});
```

## Troubleshooting

### Authorization Issues

**Problem**: "Google Calendar integration is not enabled"

**Solution**:
- Verify `GOOGLE_CALENDAR_ENABLED=true` in `.env`
- Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
- Restart server after changing config

**Problem**: "Redirect URI mismatch"

**Solution**:
- Ensure `GOOGLE_CALENDAR_REDIRECT_URI` in `.env` matches the authorized redirect URI in Google Cloud Console
- Check for trailing slashes (must match exactly)
- Update Google Cloud Console if needed

**Problem**: "Access denied" or "Invalid grant"

**Solution**:
- User may have denied permissions - ask user to try again
- Token may have expired - disconnect and reconnect
- Check OAuth consent screen is published (not in testing mode)

### Sync Issues

**Problem**: "Failed to import events"

**Solution**:
- Check user has granted calendar permissions
- Verify access token is valid
- Check API quota limits in Google Cloud Console
- Enable Google Calendar API if disabled

**Problem**: "Events not exporting to Google Calendar"

**Solution**:
- Verify user has connected Google Calendar
- Check for errors in logs
- Ensure write permissions granted (`.../auth/calendar.events` scope)
- Verify API quota not exceeded

**Problem**: "Duplicate events"

**Solution**:
- Check deduplication logic is working
- Verify Google event IDs are being stored
- May need to clear and re-import

### Token Issues

**Problem**: "Token expired"

**Solution**:
- Refresh tokens should auto-refresh access tokens
- If refresh token invalid, user must reconnect
- Check token storage in database

**Problem**: "Tokens not stored"

**Solution**:
- Check database connection
- Verify calendar model schema includes Google token fields
- Check for errors in callback handler

## Production Considerations

### Security

1. **Credentials Management**
   - Store `GOOGLE_CLIENT_SECRET` securely (environment variables, secrets manager)
   - Never commit credentials to git
   - Rotate credentials periodically

2. **Token Storage**
   - Encrypt tokens at rest in database
   - Use secure connection to database
   - Implement token cleanup for disconnected users

3. **OAuth State Parameter**
   - Use state parameter to prevent CSRF attacks
   - Validate state in callback
   - Include user ID in state

### Performance

1. **Token Refresh**
   - Implement automatic token refresh before expiration
   - Cache valid tokens to reduce API calls
   - Handle refresh failures gracefully

2. **Event Import**
   - Limit time range for imports (e.g., 1 year max)
   - Implement pagination for large event lists
   - Rate limit sync requests per user

3. **Batch Operations**
   - Use batch API endpoints when available
   - Import/export events in batches
   - Implement background jobs for large syncs

### Monitoring

1. **API Quota**
   - Monitor Google Calendar API usage
   - Set up alerts for quota limits
   - Implement retry logic with exponential backoff

2. **Error Tracking**
   - Log all OAuth errors
   - Track sync failures
   - Monitor token expiration rates

3. **User Analytics**
   - Track connection/disconnection rates
   - Monitor sync frequency
   - Measure import/export success rates

### Scalability

1. **Background Processing**
   - Move sync operations to background jobs
   - Use queue for event exports
   - Implement scheduled imports

2. **Caching**
   - Cache Google Calendar events
   - Invalidate cache on sync
   - Use Redis for distributed caching

3. **Database Optimization**
   - Index Google event ID fields
   - Optimize token lookup queries
   - Archive old synced events

### Compliance

1. **User Consent**
   - Clear disclosure of data access
   - Explicit consent before connecting
   - Easy disconnect option

2. **Data Privacy**
   - Only request necessary scopes
   - Don't store unnecessary calendar data
   - Delete data when user disconnects

3. **Terms of Service**
   - Follow Google API Terms of Service
   - Display Google branding as required
   - Implement data retention policies

## Further Reading

- [Google Calendar API Documentation](https://developers.google.com/calendar/api/v3/reference)
- [Google OAuth2 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google API Client Library for Node.js](https://github.com/googleapis/google-api-nodejs-client)
- [OAuth2 Best Practices](https://oauth.net/2/best-practices/)

---

**Next Steps:**
1. Complete Google Cloud Console setup
2. Configure environment variables
3. Test OAuth flow in development
4. Implement frontend integration
5. Monitor usage and performance in production
