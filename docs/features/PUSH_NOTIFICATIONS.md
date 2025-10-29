# Push Notifications System

Complete guide to the push notifications system with Firebase Cloud Messaging (FCM) and Apple Push Notification Service (APNS).

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Setup](#setup)
  - [Firebase Cloud Messaging (FCM)](#firebase-cloud-messaging-fcm)
  - [Apple Push Notification Service (APNS)](#apple-push-notification-service-apns)
- [Usage](#usage)
  - [Device Registration](#device-registration)
  - [Sending Notifications](#sending-notifications)
  - [Topic Messaging](#topic-messaging)
  - [Batch Notifications](#batch-notifications)
- [API Endpoints](#api-endpoints)
- [Configuration](#configuration)
- [Notification Priorities](#notification-priorities)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Production Considerations](#production-considerations)

## Overview

The Milokhelo backend implements a comprehensive push notification system that supports multiple platforms:

- **iOS devices** - Apple Push Notification Service (APNS)
- **Android devices** - Firebase Cloud Messaging (FCM)
- **Web browsers** - Firebase Cloud Messaging (FCM)

The system automatically sends push notifications when in-app notifications are created, supports multiple devices per user, and gracefully degrades when push services are not configured.

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Notification Module                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         NotificationService (Application)             │  │
│  │  • Creates in-app notifications                       │  │
│  │  • Triggers push notifications automatically          │  │
│  │  • Manages device tokens                              │  │
│  └───────────────────┬──────────────────────────────────┘  │
│                      │                                       │
│  ┌───────────────────▼──────────────────────────────────┐  │
│  │      PushNotificationService (Infrastructure)         │  │
│  │  • Unified interface for all platforms                │  │
│  │  • Routes to FCM or APNS based on platform            │  │
│  │  • Batch notification support                         │  │
│  │  • Priority handling                                   │  │
│  └───────┬─────────────────────────┬────────────────────┘  │
│          │                         │                        │
│  ┌───────▼────────┐       ┌───────▼────────┐              │
│  │   FCMService   │       │   APNSService  │              │
│  │  • Android     │       │  • iOS         │              │
│  │  • Web         │       │  • Production  │              │
│  │  • Topics      │       │  • Sandbox     │              │
│  └────────────────┘       └────────────────┘              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Event Flow

```
User triggers action (e.g., match invitation, message)
    │
    ▼
NotificationService.create() creates in-app notification
    │
    ▼
Automatically triggers PushNotificationService.sendToUser()
    │
    ▼
Retrieves user's registered device tokens from database
    │
    ▼
PushNotificationService routes to appropriate service:
    ├─ iOS device → APNSService.sendToDevice()
    ├─ Android device → FCMService.sendToDevice()
    └─ Web device → FCMService.sendToDevice()
    │
    ▼
Push notification delivered to device
```

## Features

### ✅ Multi-Platform Support
- iOS via APNS
- Android via FCM
- Web via FCM

### ✅ Multi-Device Support
- Users can register multiple devices
- Each device receives notifications independently
- Devices can be unregistered on logout

### ✅ Automatic Push on Notification Creation
- In-app notifications automatically trigger push notifications
- No manual push calls needed in business logic
- Graceful handling when push is disabled

### ✅ Priority Levels
- **Urgent** - Time-sensitive, display immediately
- **High** - Important, display with sound
- **Normal** - Standard notifications
- **Low** - Background updates, no sound

### ✅ Topic Messaging
- Send to groups of users subscribed to topics
- Useful for announcements and broadcasts

### ✅ Batch Notifications
- Send to multiple users efficiently
- Parallel processing for performance

### ✅ Graceful Degradation
- Services work even when push is not configured
- Clear logging when push is disabled
- No errors when services unavailable

## Setup

### Firebase Cloud Messaging (FCM)

FCM is used for Android and Web push notifications.

#### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Add Android and/or Web app to your project

#### 2. Get Service Account Key

1. In Firebase Console, go to **Project Settings** → **Service Accounts**
2. Click **Generate New Private Key**
3. Download the JSON file
4. Save it to your project (e.g., `firebase-service-account.json`)
5. **Keep this file secure and never commit it to git!**

#### 3. Configure Environment Variables

```env
# Enable FCM
FCM_ENABLED=true

# Firebase project ID (from Firebase Console)
FCM_PROJECT_ID=your-firebase-project-id

# Path to service account JSON file
FCM_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

#### 4. Client Setup

**Android (Kotlin/Java):**
```kotlin
// Add Firebase Cloud Messaging to your app
// Get token
FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
    if (task.isSuccessful) {
        val token = task.result
        // Register token with backend
        registerDeviceToken(token, "android")
    }
}
```

**Web (JavaScript):**
```javascript
// Initialize Firebase
const messaging = firebase.messaging();

// Request permission
const permission = await Notification.requestPermission();
if (permission === 'granted') {
  const token = await messaging.getToken({
    vapidKey: 'YOUR_VAPID_KEY'
  });
  // Register token with backend
  registerDeviceToken(token, 'web');
}
```

### Apple Push Notification Service (APNS)

APNS is used for iOS push notifications.

#### 1. Create APNs Authentication Key

1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Go to **Keys** → **All** → **Create a key** (+)
4. Give it a name (e.g., "Milokhelo Push Notifications")
5. Check **Apple Push Notifications service (APNs)**
6. Click **Continue** → **Register**
7. Download the `.p8` file (you can only download it once!)
8. Note the **Key ID** (displayed on the download page)

#### 2. Get Your Team ID

1. In Apple Developer Portal
2. Go to **Membership**
3. Find your **Team ID**

#### 3. Get Your Bundle ID

Your app's Bundle ID from Xcode project settings (e.g., `com.milokhelo.app`)

#### 4. Configure Environment Variables

```env
# Enable APNS
APNS_ENABLED=true

# APNs Key ID (from step 1)
APNS_KEY_ID=ABC1234DEF

# Your Apple Team ID
APNS_TEAM_ID=XYZ9876543

# Your app's Bundle ID
APNS_BUNDLE_ID=com.milokhelo.app

# Path to .p8 key file
APNS_KEY_PATH=./apns-key.p8

# Environment (false for sandbox/development, true for production)
APNS_PRODUCTION=false
```

#### 5. Client Setup (Swift)

```swift
import UserNotifications

// Request permission
UNUserNotificationCenter.current().requestAuthorization(
    options: [.alert, .sound, .badge]
) { granted, error in
    if granted {
        DispatchQueue.main.async {
            UIApplication.shared.registerForRemoteNotifications()
        }
    }
}

// Get device token
func application(_ application: UIApplication, 
                 didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
    // Register token with backend
    registerDeviceToken(token, "ios")
}
```

## Usage

### Device Registration

When a user logs in and grants notification permissions, register their device:

```javascript
// POST /api/v1/notifications/push-token
{
  "token": "fcm-or-apns-device-token-here",
  "platform": "android",  // "ios", "android", or "web"
  "deviceName": "Samsung Galaxy S23"  // Optional, for identification
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Device token registered successfully",
  "deviceId": "device123abc"
}
```

### Device Unregistration

When a user logs out or uninstalls the app:

```javascript
// DELETE /api/v1/notifications/push-token
{
  "token": "fcm-or-apns-device-token-here"
}
```

### Sending Notifications

#### Automatic (Recommended)

Push notifications are **automatically sent** when you create an in-app notification:

```javascript
// In your service/controller
await notificationService.create(userId, {
  type: 'match_invitation',
  category: 'match',
  message: 'You have been invited to a match',
  priority: 'high',
  payload: {
    matchId: '123',
    matchTitle: 'Football Match'
  }
});

// Push notification automatically sent to all user's devices! ✅
```

#### Manual (Advanced)

For custom scenarios, you can send push notifications directly:

```javascript
const pushNotificationService = container.resolve('pushNotificationService');

// Single user, all devices
await pushNotificationService.sendToUser(userId, {
  title: 'Match Starting Soon',
  body: 'Your match starts in 10 minutes',
  data: {
    matchId: '123',
    type: 'match_reminder'
  },
  priority: 'urgent'
});

// Single device (specific token)
await pushNotificationService.sendToDevice(token, platform, {
  title: 'New Message',
  body: 'John sent you a message'
});
```

### Topic Messaging

Send announcements to groups:

```javascript
// Subscribe user to topic
await pushNotificationService.subscribeToTopic(userId, 'football_fans');

// Send to topic
await pushNotificationService.sendToTopic('football_fans', {
  title: 'New Tournament',
  body: 'Regional Football Tournament announced',
  data: {
    tournamentId: '456'
  }
});
```

### Batch Notifications

Send to multiple users efficiently:

```javascript
await pushNotificationService.sendToMultipleUsers(
  [userId1, userId2, userId3],
  {
    title: 'Match Cancelled',
    body: 'The match on Sunday has been cancelled',
    priority: 'high'
  }
);
```

## API Endpoints

### Register Device Token

```
POST /api/v1/notifications/push-token
Authorization: Session Cookie Required

Body:
{
  "token": "string",           // Required: FCM or APNS token
  "platform": "ios|android|web", // Required
  "deviceName": "string"       // Optional
}

Response: 201 Created
{
  "success": true,
  "message": "Device token registered successfully",
  "deviceId": "string"
}
```

### Unregister Device Token

```
DELETE /api/v1/notifications/push-token
Authorization: Session Cookie Required

Body:
{
  "token": "string"  // Required
}

Response: 200 OK
{
  "success": true,
  "message": "Device token unregistered successfully"
}
```

### Get Unread Count

```
GET /api/v1/notifications/unread/count
Authorization: Session Cookie Required

Response: 200 OK
{
  "count": 5
}
```

### Mark All as Read

```
PATCH /api/v1/notifications/read-all
Authorization: Session Cookie Required

Response: 200 OK
{
  "success": true,
  "message": "All notifications marked as read",
  "modifiedCount": 5
}
```

## Configuration

### Environment Variables

```env
# Push Notifications Global Toggle
PUSH_NOTIFICATIONS_ENABLED=true

# Firebase Cloud Messaging (Android + Web)
FCM_ENABLED=true
FCM_PROJECT_ID=your-firebase-project-id
FCM_SERVICE_ACCOUNT_PATH=./firebase-service-account.json

# Apple Push Notification Service (iOS)
APNS_ENABLED=true
APNS_KEY_ID=ABC1234DEF
APNS_TEAM_ID=XYZ9876543
APNS_BUNDLE_ID=com.milokhelo.app
APNS_KEY_PATH=./apns-key.p8
APNS_PRODUCTION=false  # false for development, true for production
```

### Checking Service Availability

```javascript
const pushService = container.resolve('pushNotificationService');

if (pushService.isAvailable()) {
  console.log('Push notifications enabled');
} else {
  console.log('Push notifications disabled or not configured');
}
```

## Notification Priorities

The system supports 4 priority levels:

| Priority | Use Case | Behavior |
|----------|----------|----------|
| `urgent` | Time-sensitive alerts | Display immediately, bypass Do Not Disturb |
| `high` | Important updates | Display with sound, banner |
| `normal` | Standard notifications | Display normally |
| `low` | Background updates | Silent, no banner |

**Examples:**
- **Urgent**: Match starting in 5 minutes, emergency alerts
- **High**: Match invitation, direct message
- **Normal**: New comment, team update
- **Low**: Stats update, achievement earned

## Testing

### Unit Tests

Run the push notification test suite:

```bash
npm test test/unit/pushNotificationService.test.js
```

**Coverage**: 13 tests covering:
- Service initialization
- Availability checks
- Single device notifications
- Batch notifications
- Topic subscriptions
- Error handling

### Manual Testing

#### 1. Test Device Registration

```bash
curl -X POST http://localhost:4000/api/v1/notifications/push-token \
  -H "Cookie: session=your-session-cookie" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "test-fcm-token-123",
    "platform": "android",
    "deviceName": "Test Device"
  }'
```

#### 2. Test Notification Creation (Auto Push)

```bash
curl -X POST http://localhost:4000/api/v1/notifications \
  -H "Cookie: session=your-session-cookie" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "test",
    "message": "Test notification",
    "priority": "high"
  }'

# Push notification should be sent automatically!
```

#### 3. Verify on Device

Check your device to confirm notification was received.

### Integration Testing

Create integration tests for the full flow:

```javascript
describe('Push Notification Integration', () => {
  it('should send push when notification created', async () => {
    // Register device
    await registerDevice(userId, token, platform);
    
    // Create notification
    await notificationService.create(userId, notificationData);
    
    // Verify push was sent
    expect(mockFCM.send).toHaveBeenCalledWith(/* ... */);
  });
});
```

## Troubleshooting

### Push Not Sending

**1. Check if push is enabled:**
```javascript
const pushService = container.resolve('pushNotificationService');
console.log('Push available:', pushService.isAvailable());
```

**2. Check environment variables:**
```bash
# Verify all required variables are set
echo $PUSH_NOTIFICATIONS_ENABLED
echo $FCM_ENABLED
echo $APNS_ENABLED
```

**3. Check logs:**
```bash
# Look for push-related log messages
grep -i "push" logs/app.log
```

### FCM Issues

**Problem**: "Service account file not found"
- **Solution**: Verify `FCM_SERVICE_ACCOUNT_PATH` points to valid JSON file
- Check file permissions (readable by Node.js process)

**Problem**: "Invalid token"
- **Solution**: Token may have expired or device uninstalled app
- Remove invalid tokens from database
- Implement token refresh on client

**Problem**: "Project ID mismatch"
- **Solution**: Ensure `FCM_PROJECT_ID` matches Firebase project
- Check service account belongs to correct project

### APNS Issues

**Problem**: "Invalid credentials"
- **Solution**: Verify `APNS_KEY_ID`, `APNS_TEAM_ID`, and `APNS_KEY_PATH`
- Ensure `.p8` file is valid and not corrupted

**Problem**: "BadDeviceToken"
- **Solution**: Using production certificate with sandbox device or vice versa
- Set `APNS_PRODUCTION=false` for development builds

**Problem**: "Unregistered"
- **Solution**: Token no longer valid (app uninstalled or token expired)
- Remove token from database

### Device Not Receiving

**Checklist:**
- [ ] Device has granted notification permissions
- [ ] Token is registered in database
- [ ] Push services are enabled in config
- [ ] Service account/credentials are valid
- [ ] No network issues between backend and push service
- [ ] Check device logs for client-side errors

## Production Considerations

### Security

1. **Never commit credentials:**
   - Add `firebase-service-account.json` to `.gitignore`
   - Add `apns-key.p8` to `.gitignore`
   - Use environment variables for all sensitive data

2. **Token management:**
   - Implement token rotation/refresh
   - Remove invalid tokens automatically
   - Rate limit token registration endpoints

3. **Validation:**
   - Validate token format before storing
   - Verify platform matches token type
   - Sanitize notification content

### Performance

1. **Batch processing:**
   - Use batch APIs for multiple notifications
   - Process notifications asynchronously
   - Implement queue for large sends

2. **Error handling:**
   - Retry failed sends with exponential backoff
   - Log failures for debugging
   - Don't block user requests on push sends

3. **Caching:**
   - Cache user device tokens
   - Cache topic subscriptions
   - Invalidate cache on token changes

### Monitoring

1. **Track metrics:**
   - Push success/failure rates
   - Delivery times
   - Invalid token rates
   - Topic subscription counts

2. **Alerting:**
   - Alert on high failure rates
   - Monitor service availability
   - Track credential expiration

3. **Logging:**
   - Log all push attempts
   - Log errors with context
   - Track user opt-outs

### Scalability

1. **Use Redis for tokens:**
   - Cache frequently accessed tokens
   - Use Redis pub/sub for real-time updates

2. **Queue-based processing:**
   - Use message queue (Redis, RabbitMQ) for notifications
   - Process notifications in worker processes
   - Implement priority queues

3. **Database optimization:**
   - Index device tokens table
   - Clean up expired tokens regularly
   - Archive old notifications

### Compliance

1. **User consent:**
   - Obtain explicit permission for push
   - Provide opt-out mechanism
   - Respect Do Not Disturb preferences

2. **Data privacy:**
   - Don't send sensitive data in notifications
   - Comply with GDPR/privacy laws
   - Allow users to delete their data

3. **Rate limiting:**
   - Limit notification frequency per user
   - Implement quiet hours
   - Batch similar notifications

## Further Reading

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Apple Push Notification Service Documentation](https://developer.apple.com/documentation/usernotifications)
- [Push Notification Best Practices](https://documentation.onesignal.com/docs/push-notification-guide)
- [Mobile Push Notification Guide](https://www.airship.com/resources/explainer/push-notifications-explained/)

---

**Next Steps:**
1. Set up Firebase and APNS credentials
2. Configure environment variables
3. Test with development devices
4. Implement client-side token registration
5. Monitor push delivery in production
