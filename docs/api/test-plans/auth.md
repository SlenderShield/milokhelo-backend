# Auth Module - API Test Plan

## Overview

Authentication & session management module supporting OAuth 2.0 (Google & Facebook), email/password authentication, session management, and account operations.

---

## GET /auth/providers

**Description:** List supported OAuth providers  
**Authentication:** Not required  
**Parameters:** None  
**Expected Response:** `200 OK`

```json
{
  "providers": [
    {
      "name": "google",
      "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
    },
    {
      "name": "facebook",
      "authUrl": "https://www.facebook.com/v12.0/dialog/oauth?..."
    }
  ]
}
```

**Test Cases:**

- ✅ **Valid request** → Returns 200 with list of providers
- ✅ **Unauthenticated request** → Returns 200 (public endpoint)
- ✅ **Response includes Google and Facebook** → Validates provider availability

---

## GET /auth/oauth/google

**Description:** Initiate Google OAuth flow  
**Authentication:** Not required  
**Parameters:** None  
**Expected Response:** `302 Found` (Redirect to Google)

**Test Cases:**

- ✅ **Valid request** → Returns 302 redirect to Google OAuth consent screen
- ✅ **Redirect URL includes state parameter** → CSRF protection validation
- ✅ **Redirect URL includes correct scopes** → Validates requested permissions
- ❌ **Invalid callback URL configuration** → Server error

---

## GET /auth/oauth/facebook

**Description:** Initiate Facebook OAuth flow  
**Authentication:** Not required  
**Parameters:** None  
**Expected Response:** `302 Found` (Redirect to Facebook)

**Test Cases:**

- ✅ **Valid request** → Returns 302 redirect to Facebook OAuth consent screen
- ✅ **Redirect URL includes state parameter** → CSRF protection validation
- ✅ **Redirect URL includes correct scopes** → Validates requested permissions
- ❌ **Invalid callback URL configuration** → Server error

---

## GET /auth/oauth/callback/google

**Description:** Google OAuth callback - exchanges authorization code for tokens  
**Authentication:** Not required (handled by OAuth flow)  
**Parameters:**

- `code` (query, required): Authorization code from Google
- `state` (query, required): CSRF protection state parameter

**Expected Response:** `302 Found` (Redirect to frontend with session cookie)

**Test Cases:**

- ✅ **Valid authorization code** → Returns 302 with Set-Cookie header, creates/updates user
- ✅ **New user OAuth** → Creates new user account with OAuth profile data
- ✅ **Existing user OAuth** → Updates existing user and establishes session
- ❌ **Invalid authorization code** → Returns redirect to frontend with error
- ❌ **Missing state parameter** → Returns 400 Bad Request (CSRF protection)
- ❌ **Invalid state parameter** → Returns 400 Bad Request
- ❌ **Expired authorization code** → Returns redirect with error
- 🔒 **Session cookie is HTTP-only** → Security validation
- 🔒 **Session cookie has secure flag** → Production security validation

---

## GET /auth/oauth/callback/facebook

**Description:** Facebook OAuth callback - exchanges authorization code for tokens  
**Authentication:** Not required (handled by OAuth flow)  
**Parameters:**

- `code` (query, required): Authorization code from Facebook
- `state` (query, required): CSRF protection state parameter

**Expected Response:** `302 Found` (Redirect to frontend with session cookie)

**Test Cases:**

- ✅ **Valid authorization code** → Returns 302 with Set-Cookie header, creates/updates user
- ✅ **New user OAuth** → Creates new user account with OAuth profile data
- ✅ **Existing user OAuth** → Updates existing user and establishes session
- ❌ **Invalid authorization code** → Returns redirect to frontend with error
- ❌ **Missing state parameter** → Returns 400 Bad Request (CSRF protection)
- ❌ **Invalid state parameter** → Returns 400 Bad Request
- ❌ **Expired authorization code** → Returns redirect with error
- 🔒 **Session cookie is HTTP-only** → Security validation
- 🔒 **Session cookie has secure flag** → Production security validation

---

## POST /auth/register

**Description:** Register using email/password  
**Authentication:** Not required  
**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Expected Response:** `201 Created`

```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": "2025-10-30T10:00:00.000Z"
}
```

**Test Cases:**

- ✅ **Valid registration** → Returns 201 with user profile and session cookie
- ❌ **Missing name** → Returns 400 with validation error
- ❌ **Missing email** → Returns 400 with validation error
- ❌ **Invalid email format** → Returns 400 with validation error
- ❌ **Missing password** → Returns 400 with validation error
- ❌ **Weak password (< 8 chars)** → Returns 400 with validation error
- ❌ **Password without uppercase** → Returns 400 with validation error
- ❌ **Password without lowercase** → Returns 400 with validation error
- ❌ **Password without number** → Returns 400 with validation error
- ❌ **Duplicate email** → Returns 400 "User already exists"
- 🔒 **Password is hashed in database** → Security validation
- 🔒 **Password not returned in response** → Security validation

---

## POST /auth/login

**Description:** Login using email/password  
**Authentication:** Not required  
**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Expected Response:** `200 OK`

```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user"
}
```

**Test Cases:**

- ✅ **Valid credentials** → Returns 200 with user profile and session cookie
- ❌ **Invalid email** → Returns 401 "Invalid credentials"
- ❌ **Invalid password** → Returns 401 "Invalid credentials"
- ❌ **Missing email** → Returns 400 with validation error
- ❌ **Missing password** → Returns 400 with validation error
- ❌ **Non-existent user** → Returns 401 "Invalid credentials"
- ❌ **Deactivated account** → Returns 401 "Account deactivated"
- 🔒 **Session cookie set correctly** → Cookie validation
- 🔒 **Rate limiting on failed attempts** → Security validation

---

## GET /auth/session

**Description:** Validate/refresh session and get current user profile  
**Authentication:** Required (cookie)  
**Parameters:** None  
**Expected Response:** `200 OK`

```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "username": "johndoe"
}
```

**Test Cases:**

- ✅ **Valid session** → Returns 200 with user profile
- ❌ **No session cookie** → Returns 401 "Not authenticated"
- ❌ **Invalid session cookie** → Returns 401 "Session invalid"
- ❌ **Expired session** → Returns 401 "Session expired"
- ❌ **Session for deleted user** → Returns 401 "User not found"

---

## GET /auth/me

**Description:** Get current authenticated user (JWT-based)  
**Authentication:** Required (Bearer token)  
**Parameters:** None  
**Expected Response:** `200 OK`

```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "username": "johndoe",
  "role": "user"
}
```

**Test Cases:**

- ✅ **Valid JWT token** → Returns 200 with user profile
- ❌ **No token** → Returns 401 "Not authenticated"
- ❌ **Invalid token** → Returns 401 "Invalid token"
- ❌ **Expired token** → Returns 401 "Token expired"
- ❌ **Malformed token** → Returns 401 "Invalid token format"

---

## POST /auth/logout

**Description:** Log out user and clear session cookie  
**Authentication:** Required (cookie)  
**Parameters:** None  
**Expected Response:** `204 No Content`

**Test Cases:**

- ✅ **Valid logout** → Returns 204 and clears session cookie
- ✅ **Session destroyed in Redis** → Backend validation
- ❌ **No session cookie** → Returns 401 or 204 (idempotent)
- ❌ **Already logged out** → Returns 204 (idempotent)

---

## POST /auth/verify-email/{token}

**Description:** Verify email address using token  
**Authentication:** Not required  
**Parameters:**

- `token` (path, required): Email verification token from email

**Expected Response:** `200 OK`

```json
{
  "message": "Email verified successfully"
}
```

**Test Cases:**

- ✅ **Valid token** → Returns 200, marks email as verified
- ❌ **Invalid token** → Returns 400 "Invalid verification token"
- ❌ **Expired token** → Returns 400 "Token expired"
- ❌ **Already verified email** → Returns 400 "Email already verified"
- ❌ **Token for non-existent user** → Returns 400 "Invalid token"

---

## POST /auth/resend-verification

**Description:** Resend verification email  
**Authentication:** Not required  
**Request Body:**

```json
{
  "email": "john@example.com"
}
```

**Expected Response:** `200 OK`

```json
{
  "message": "Verification email sent"
}
```

**Test Cases:**

- ✅ **Valid email** → Returns 200, sends new verification email
- ❌ **Missing email** → Returns 400 with validation error
- ❌ **Invalid email format** → Returns 400 with validation error
- ❌ **Non-existent user** → Returns 200 (security: don't reveal user existence)
- ❌ **Email already verified** → Returns 400 "Email already verified"
- 🔒 **Rate limiting** → Max 3 requests per hour per email

---

## POST /auth/forgot-password

**Description:** Request password reset link  
**Authentication:** Not required  
**Request Body:**

```json
{
  "email": "john@example.com"
}
```

**Expected Response:** `200 OK`

```json
{
  "message": "If email exists, reset link sent"
}
```

**Test Cases:**

- ✅ **Valid email** → Returns 200, sends reset email
- ❌ **Missing email** → Returns 400 with validation error
- ❌ **Invalid email format** → Returns 400 with validation error
- ❌ **Non-existent user** → Returns 200 (security: don't reveal user existence)
- 🔒 **Rate limiting** → Max 3 requests per hour per email
- 🔒 **Reset token expires after 1 hour** → Security validation

---

## GET /auth/validate-reset-token/{token}

**Description:** Validate password reset token  
**Authentication:** Not required  
**Parameters:**

- `token` (path, required): Password reset token

**Expected Response:** `200 OK`

```json
{
  "valid": true
}
```

**Test Cases:**

- ✅ **Valid token** → Returns 200 with `valid: true`
- ❌ **Invalid token** → Returns 200 with `valid: false`
- ❌ **Expired token** → Returns 200 with `valid: false`
- ❌ **Used token** → Returns 200 with `valid: false`

---

## POST /auth/reset-password/{token}

**Description:** Reset password using token  
**Authentication:** Not required  
**Parameters:**

- `token` (path, required): Password reset token

**Request Body:**

```json
{
  "password": "NewSecurePass123",
  "confirmPassword": "NewSecurePass123"
}
```

**Expected Response:** `200 OK`

```json
{
  "message": "Password reset successfully"
}
```

**Test Cases:**

- ✅ **Valid token and password** → Returns 200, updates password
- ❌ **Invalid token** → Returns 400 "Invalid or expired token"
- ❌ **Expired token** → Returns 400 "Invalid or expired token"
- ❌ **Passwords don't match** → Returns 400 "Passwords don't match"
- ❌ **Weak password** → Returns 400 with validation error
- ❌ **Missing password** → Returns 400 with validation error
- ❌ **Same as old password** → Optional validation
- 🔒 **Token invalidated after use** → Security validation

---

## POST /auth/refresh-token

**Description:** Refresh access token using refresh token  
**Authentication:** Not required  
**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Expected Response:** `200 OK`

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

**Test Cases:**

- ✅ **Valid refresh token** → Returns 200 with new access token
- ❌ **Invalid refresh token** → Returns 400 "Invalid refresh token"
- ❌ **Expired refresh token** → Returns 400 "Refresh token expired"
- ❌ **Missing refresh token** → Returns 400 with validation error
- ❌ **Malformed token** → Returns 400 "Invalid token format"
- ❌ **User not found** → Returns 401 "User not found"
- ❌ **Account deactivated** → Returns 401 "Account deactivated"
- 🔒 **Old refresh token invalidated** → Token rotation validation

---

## PUT /auth/change-password

**Description:** Change password for authenticated user  
**Authentication:** Required (Bearer or Cookie)  
**Request Body:**

```json
{
  "currentPassword": "OldPass123",
  "newPassword": "NewSecurePass456",
  "confirmPassword": "NewSecurePass456"
}
```

**Expected Response:** `200 OK`

```json
{
  "message": "Password changed successfully"
}
```

**Test Cases:**

- ✅ **Valid password change** → Returns 200, updates password
- ❌ **Not authenticated** → Returns 401 "Not authenticated"
- ❌ **Incorrect current password** → Returns 400 "Current password incorrect"
- ❌ **Passwords don't match** → Returns 400 "Passwords don't match"
- ❌ **Weak new password** → Returns 400 with validation error
- ❌ **New password same as current** → Returns 400 "New password must be different"
- ❌ **Missing required fields** → Returns 400 with validation errors
- 🔒 **All sessions invalidated** → Security validation

---

## DELETE /auth/deactivate

**Description:** Deactivate user account (soft delete)  
**Authentication:** Required (Bearer or Cookie)  
**Parameters:** None  
**Expected Response:** `200 OK`

```json
{
  "message": "Account deactivated successfully"
}
```

**Test Cases:**

- ✅ **Valid deactivation** → Returns 200, marks account as deactivated
- ❌ **Not authenticated** → Returns 401 "Not authenticated"
- ❌ **Already deactivated** → Returns 400 "Account already deactivated"
- 🔒 **User data retained** → Soft delete validation
- 🔒 **Cannot login after deactivation** → Security validation
- 🔒 **Can be restored by admin** → Recovery validation

---

## Summary

### Total Endpoints: 21

### Status Code Distribution

- **200 OK**: 10 endpoints
- **201 Created**: 2 endpoints (register, create operations)
- **204 No Content**: 2 endpoints (logout, deactivate)
- **302 Found**: 4 endpoints (OAuth redirects)
- **400 Bad Request**: Validation errors
- **401 Unauthorized**: Authentication errors
- **409 Conflict**: Duplicate resources

### Authentication Methods

- **Cookie-based sessions**: Primary method with Redis store
- **JWT Bearer tokens**: Alternative for API access
- **OAuth 2.0**: Google and Facebook

### Key Security Features

- HTTP-only cookies
- CSRF protection with state parameters
- Password strength validation (8+ chars, uppercase, lowercase, number)
- Rate limiting on sensitive endpoints
- Token expiration and rotation
- Soft delete for account deactivation
