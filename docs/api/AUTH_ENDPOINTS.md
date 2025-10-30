# Authentication Endpoints Documentation

This document provides comprehensive documentation for all authentication endpoints in the Milokhelo Backend API.

## Table of Contents

1. [Manual Registration & Login](#manual-registration--login)
2. [Email Verification](#email-verification)
3. [Password Reset](#password-reset)
4. [Token Management](#token-management)
5. [Account Management](#account-management)
6. [OAuth Authentication](#oauth-authentication)

---

## Manual Registration & Login

### POST /auth/register

Register a new user with email and password.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "username": "johndoe", // optional
  "firstName": "John", // optional
  "lastName": "Doe" // optional
}
```

**Validation Rules:**
- **email**: Valid email format, required
- **password**: Minimum 8 characters, must contain uppercase, lowercase, and number
- **username**: 3-30 characters, alphanumeric with underscores/hyphens (optional)
- **firstName**: 1-50 characters (optional)
- **lastName**: 1-50 characters (optional)

**Response (201 Created):**
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "verified": false,
    "roles": ["user"],
    "createdAt": "2025-10-30T12:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "a1b2c3d4e5f6...",
  "message": "Registration successful. Please check your email to verify your account."
}
```

**Note:** A verification email will be sent to the provided email address.

---

### POST /auth/login

Login with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "verified": true,
    "roles": ["user"]
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "a1b2c3d4e5f6..."
}
```

**Error Response (400/401):**
```json
{
  "error": "Invalid credentials"
}
```

---

## Email Verification

### POST /auth/verify-email/:token

Verify user email with the token sent via email.

**Parameters:**
- `token` (path): Email verification token from the verification email

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "verified": true
  }
}
```

**Error Response (400):**
```json
{
  "error": "Invalid or expired verification token"
}
```

---

### POST /auth/resend-verification

Resend verification email to the user.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Verification email sent"
}
```

**Error Responses:**
- **400**: User not found or email already verified

---

## Password Reset

### POST /auth/forgot-password

Request a password reset. Sends a reset link to the user's email.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "If the email exists, a password reset link has been sent"
}
```

**Note:** The response doesn't reveal whether the email exists (security feature).

---

### GET /auth/validate-reset-token/:token

Validate if a password reset token is valid and not expired.

**Parameters:**
- `token` (path): Password reset token from the reset email

**Response (200 OK - Valid):**
```json
{
  "valid": true,
  "email": "john@example.com"
}
```

**Response (200 OK - Invalid):**
```json
{
  "valid": false,
  "message": "Invalid or expired reset token"
}
```

---

### POST /auth/reset-password/:token

Reset password using the token from the reset email.

**Parameters:**
- `token` (path): Password reset token

**Request Body:**
```json
{
  "password": "NewSecurePass123!",
  "confirmPassword": "NewSecurePass123!"
}
```

**Validation Rules:**
- Password must match confirmPassword
- Password must be at least 8 characters with uppercase, lowercase, and number

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "john@example.com"
  }
}
```

**Note:** All existing refresh tokens are revoked for security.

---

## Token Management

### POST /auth/refresh-token

Refresh the access token using a refresh token.

**Request Body:**
```json
{
  "refreshToken": "a1b2c3d4e5f6..."
}
```

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "roles": ["user"]
  }
}
```

**Error Responses:**
- **400**: Invalid or expired refresh token
- **401**: User not found or account deactivated

---

## Account Management

### PUT /auth/change-password

Change password for authenticated user (requires active session or valid JWT).

**Authentication Required:** Yes (session or JWT)

**Request Body:**
```json
{
  "currentPassword": "OldSecurePass123!",
  "newPassword": "NewSecurePass456!",
  "confirmPassword": "NewSecurePass456!"
}
```

**Validation Rules:**
- Current password must be correct
- New password must be different from current password
- New password must match confirmPassword
- New password must meet strength requirements

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Responses:**
- **400**: Current password incorrect
- **400**: Cannot change password for OAuth-only accounts
- **401**: Authentication required

**Note:** All existing refresh tokens are revoked for security.

---

### DELETE /auth/deactivate

Deactivate the user's account (soft delete).

**Authentication Required:** Yes (session or JWT)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Account deactivated successfully"
}
```

**Note:** 
- The account is soft-deleted (marked as inactive)
- All refresh tokens are revoked
- Session is destroyed
- A confirmation email is sent
- Contact support to reactivate the account

---

## OAuth Authentication

### GET /auth/providers

Get list of available OAuth providers.

**Response (200 OK):**
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

---

### GET /auth/oauth/google

Initiate Google OAuth flow. Redirects to Google's authorization page.

---

### GET /auth/oauth/callback/google

Google OAuth callback endpoint (handled by Passport.js).

---

### GET /auth/oauth/facebook

Initiate Facebook OAuth flow. Redirects to Facebook's authorization page.

---

### GET /auth/oauth/callback/facebook

Facebook OAuth callback endpoint (handled by Passport.js).

---

## Session Management

### GET /auth/session

Get current session/user information.

**Response (200 OK):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "verified": true,
  "roles": ["user"]
}
```

**Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "No active session"
}
```

---

### POST /auth/logout

Logout current user and destroy session.

**Response (204 No Content)**

---

## Error Handling

All endpoints return appropriate HTTP status codes:

- **200 OK**: Successful operation
- **201 Created**: Resource created successfully
- **204 No Content**: Successful operation with no content
- **400 Bad Request**: Invalid input or validation error
- **401 Unauthorized**: Authentication required or invalid credentials
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error

Error responses include a descriptive message:
```json
{
  "error": "Description of what went wrong"
}
```

Validation errors include details:
```json
{
  "errors": [
    {
      "field": "email",
      "message": "Must be a valid email address"
    }
  ]
}
```

---

## Token Expiration

- **Access Token (JWT)**: 7 days (configurable via `JWT_EXPIRATION`)
- **Refresh Token**: 30 days (configurable via `REFRESH_TOKEN_EXPIRATION`)
- **Email Verification Token**: 24 hours
- **Password Reset Token**: 1 hour

---

## Security Features

1. **Password Requirements**: Minimum 8 characters with uppercase, lowercase, and number
2. **Rate Limiting**: Applied to authentication endpoints
3. **Token Rotation**: Refresh tokens are stored securely and can be revoked
4. **Secure Password Hashing**: Using bcrypt with 10 salt rounds
5. **Email Verification**: Required for full account access
6. **Password Reset Security**: Tokens expire quickly and can only be used once
7. **Account Deactivation**: Soft delete with token revocation

---

## Events Published

The authentication system publishes the following events:

- `user.registered`: When a new user registers
- `user.logged_in`: When a user logs in
- `user.oauth_logged_in`: When a user logs in via OAuth
- `user.email_verified`: When a user verifies their email
- `user.password_reset_requested`: When a user requests password reset
- `user.password_reset`: When a user successfully resets password
- `user.password_changed`: When a user changes their password
- `user.token_refreshed`: When a user refreshes their access token
- `user.account_deactivated`: When a user deactivates their account
- `user.logged_out`: When a user logs out

These events can be subscribed to by other modules for additional processing.
