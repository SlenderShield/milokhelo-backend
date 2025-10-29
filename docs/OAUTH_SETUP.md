# OAuth Setup Guide

This guide explains how to set up OAuth authentication with Google and Facebook for the Milokhelo backend.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Google OAuth Setup](#google-oauth-setup)
- [Facebook OAuth Setup](#facebook-oauth-setup)
- [Configuration](#configuration)
- [Testing OAuth Flow](#testing-oauth-flow)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The authentication system supports multiple authentication methods:
- **Email/Password**: Traditional username and password authentication
- **Google OAuth 2.0**: Sign in with Google
- **Facebook OAuth 2.0**: Sign in with Facebook

The implementation uses [Passport.js](http://www.passportjs.org/) with strategy-based authentication.

## Architecture

### Components

```
src/api/v1/modules/auth/
├── application/
│   └── AuthService.js              # Business logic for auth
├── domain/
│   └── IAuthRepository.js          # Repository interface
├── infrastructure/
│   ├── http/
│   │   ├── AuthController.js       # HTTP request handlers
│   │   └── AuthRoutes.js           # Route definitions
│   ├── passport/
│   │   ├── PassportConfig.js       # Passport initialization
│   │   └── strategies/
│   │       ├── GoogleStrategy.js   # Google OAuth strategy
│   │       └── FacebookStrategy.js # Facebook OAuth strategy
│   └── persistence/
│       ├── AuthRepository.js       # Database operations
│       └── UserModel.js            # User schema
```

### OAuth Flow

1. **Initiation**: User clicks "Sign in with Google/Facebook"
2. **Redirect**: User is redirected to OAuth provider (Google/Facebook)
3. **Authorization**: User grants permission
4. **Callback**: Provider redirects back to our callback URL
5. **User Creation/Login**: System finds or creates user account
6. **Session**: User session is established
7. **Redirect**: User is redirected to frontend with authentication status

## Google OAuth Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (or Google Identity Platform)

### Step 2: Configure OAuth Consent Screen

1. Navigate to **APIs & Services** → **OAuth consent screen**
2. Choose **External** user type
3. Fill in the required information:
   - **App name**: Milokhelo
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Add scopes:
   - `userinfo.email`
   - `userinfo.profile`
5. Add test users (during development)
6. Save and continue

### Step 3: Create OAuth Credentials

1. Navigate to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Choose **Web application**
4. Configure:
   - **Name**: Milokhelo Backend
   - **Authorized JavaScript origins**:
     - `http://localhost:4000` (development)
     - Your production URL
   - **Authorized redirect URIs**:
     - `http://localhost:4000/api/v1/auth/oauth/callback/google` (development)
     - Your production callback URL
5. Save and copy:
   - **Client ID**
   - **Client Secret**

### Step 4: Update Environment Variables

Add to your `.env` file:

```bash
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
```

## Facebook OAuth Setup

### Step 1: Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **My Apps** → **Create App**
3. Choose **Consumer** as the app type
4. Fill in app details:
   - **App Name**: Milokhelo
   - **App Contact Email**: Your email

### Step 2: Configure Facebook Login

1. In your app dashboard, add **Facebook Login** product
2. Select **Web** as the platform
3. Skip the quickstart

### Step 3: Configure OAuth Settings

1. Navigate to **Facebook Login** → **Settings**
2. Configure **Valid OAuth Redirect URIs**:
   - Development: `http://localhost:4000/api/v1/auth/oauth/callback/facebook`
   - Production: `https://yourdomain.com/api/v1/auth/oauth/callback/facebook`
3. Enable **Client OAuth Login**: Yes
4. Enable **Web OAuth Login**: Yes
5. Save changes

### Step 4: Get App Credentials

1. Navigate to **Settings** → **Basic**
2. Copy:
   - **App ID**
   - **App Secret** (click Show)

### Step 5: Update Environment Variables

Add to your `.env` file:

```bash
FACEBOOK_APP_ID=your-facebook-app-id-here
FACEBOOK_APP_SECRET=your-facebook-app-secret-here
```

## Configuration

### Environment Variables

Complete `.env` configuration for OAuth:

```bash
# Authentication Configuration
JWT_SECRET=your-secure-jwt-secret
JWT_EXPIRATION=7d
SESSION_SECRET=your-secure-session-secret
SESSION_MAX_AGE=604800000

# OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
OAUTH_CALLBACK_URL=http://localhost:4000/api/v1/auth/oauth/callback
FRONTEND_URL=http://localhost:3000
```

### Production Configuration

For production, update the values in `src/config/env/production.js` or use environment variables:

```bash
# Production OAuth Settings
GOOGLE_CLIENT_ID=production-google-client-id
GOOGLE_CLIENT_SECRET=production-google-client-secret
FACEBOOK_APP_ID=production-facebook-app-id
FACEBOOK_APP_SECRET=production-facebook-app-secret
OAUTH_CALLBACK_URL=https://api.yourdomain.com/api/v1/auth/oauth/callback
FRONTEND_URL=https://yourdomain.com
```

## Testing OAuth Flow

### 1. Start the Server

```bash
npm run dev
```

### 2. Test OAuth Endpoints

#### Get Available Providers

```bash
curl http://localhost:4000/api/v1/auth/providers
```

Response:
```json
[
  {
    "name": "google",
    "displayName": "Google",
    "authorizationUrl": "/api/v1/auth/oauth/google"
  },
  {
    "name": "facebook",
    "displayName": "Facebook",
    "authorizationUrl": "/api/v1/auth/oauth/facebook"
  }
]
```

#### Initiate Google OAuth

Visit in browser:
```
http://localhost:4000/api/v1/auth/oauth/google
```

#### Initiate Facebook OAuth

Visit in browser:
```
http://localhost:4000/api/v1/auth/oauth/facebook
```

### 3. Frontend Integration Example

```javascript
// React/Next.js example
function LoginButtons() {
  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:4000/api/v1/auth/oauth/google';
  };

  const handleFacebookLogin = () => {
    window.location.href = 'http://localhost:4000/api/v1/auth/oauth/facebook';
  };

  return (
    <div>
      <button onClick={handleGoogleLogin}>
        Sign in with Google
      </button>
      <button onClick={handleFacebookLogin}>
        Sign in with Facebook
      </button>
    </div>
  );
}
```

### 4. Check User Session

After successful OAuth login:

```bash
curl -b cookies.txt http://localhost:4000/api/v1/auth/session
```

## Security Best Practices

### 1. Environment Variables

- **Never commit** OAuth credentials to version control
- Use different credentials for development and production
- Rotate secrets regularly

### 2. Callback URLs

- Use HTTPS in production
- Whitelist only necessary redirect URIs
- Validate state parameter to prevent CSRF attacks

### 3. Token Storage

- Store refresh tokens encrypted in database
- Never expose tokens in URLs or logs
- Implement token rotation

### 4. Session Security

- Use secure, httpOnly cookies
- Set appropriate session timeouts
- Implement CSRF protection

### 5. User Data

- Only request necessary OAuth scopes
- Respect user privacy preferences
- Allow users to revoke OAuth connections

## Troubleshooting

### Common Issues

#### 1. "OAuth not configured" Error

**Problem**: OAuth credentials not set in environment variables

**Solution**: 
```bash
# Check if credentials are set
echo $GOOGLE_CLIENT_ID
echo $FACEBOOK_APP_ID

# Set them in .env file
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

#### 2. "Redirect URI Mismatch" Error

**Problem**: Callback URL doesn't match configured redirect URI

**Solution**:
- Ensure the callback URL in OAuth provider settings matches exactly
- Check for trailing slashes
- Verify protocol (http vs https)

#### 3. "Invalid Client" Error

**Problem**: Client ID or secret is incorrect

**Solution**:
- Double-check credentials in OAuth provider console
- Ensure no extra spaces in environment variables
- Verify the app is not in development mode restrictions

#### 4. User Profile Missing Email

**Problem**: OAuth provider not returning email

**Solution**:
- Verify email scope is requested
- Check OAuth consent screen configuration
- Ensure user has verified email with provider

#### 5. Session Not Persisting

**Problem**: User session is lost on refresh

**Solution**:
- Verify session middleware is configured before Passport
- Check Redis connection (if using Redis for sessions)
- Verify SESSION_SECRET is set

### Debug Mode

Enable detailed logging:

```bash
LOG_LEVEL=debug npm run dev
```

Check logs for:
- Passport initialization
- OAuth strategy configuration
- Callback processing
- Session serialization/deserialization

## API Reference

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/auth/providers` | List OAuth providers |
| GET | `/api/v1/auth/oauth/google` | Initiate Google OAuth |
| GET | `/api/v1/auth/oauth/facebook` | Initiate Facebook OAuth |
| GET | `/api/v1/auth/oauth/callback/google` | Google callback |
| GET | `/api/v1/auth/oauth/callback/facebook` | Facebook callback |
| GET | `/api/v1/auth/session` | Get current session |
| POST | `/api/v1/auth/logout` | Logout user |
| POST | `/api/v1/auth/register` | Email/password registration |
| POST | `/api/v1/auth/login` | Email/password login |

### User Model

Users authenticated via OAuth are stored with:

```javascript
{
  "id": "user-id",
  "name": "John Doe",
  "email": "john@example.com",
  "avatar": "https://...",
  "verified": true,
  "oauthProviders": {
    "google": {
      "id": "google-user-id",
      "email": "john@gmail.com"
    },
    "facebook": {
      "id": "facebook-user-id",
      "email": "john@facebook.com"
    }
  },
  "lastLogin": "2025-10-29T12:00:00.000Z"
}
```

## Further Reading

- [Passport.js Documentation](http://www.passportjs.org/docs/)
- [Google OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login)
- [OAuth 2.0 RFC](https://tools.ietf.org/html/rfc6749)

## Support

For issues or questions:
- Check the [main documentation](./README.md)
- Review [troubleshooting section](#troubleshooting)
- Check application logs with `LOG_LEVEL=debug`
