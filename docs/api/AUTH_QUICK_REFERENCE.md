# Authentication Quick Reference

## Quick Test Commands

### 1. Register a New User
```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

Save the `accessToken` and `refreshToken` from the response.

### 3. Verify Email
```bash
# Check console output for the verification token, then:
curl -X POST http://localhost:4000/api/v1/auth/verify-email/YOUR_TOKEN_HERE
```

### 4. Resend Verification Email
```bash
curl -X POST http://localhost:4000/api/v1/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com"
  }'
```

### 5. Forgot Password
```bash
curl -X POST http://localhost:4000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com"
  }'
```

### 6. Validate Reset Token
```bash
# Check console output for the reset token, then:
curl -X GET http://localhost:4000/api/v1/auth/validate-reset-token/YOUR_TOKEN_HERE
```

### 7. Reset Password
```bash
curl -X POST http://localhost:4000/api/v1/auth/reset-password/YOUR_TOKEN_HERE \
  -H "Content-Type: application/json" \
  -d '{
    "password": "NewSecurePass456!",
    "confirmPassword": "NewSecurePass456!"
  }'
```

### 8. Refresh Access Token
```bash
curl -X POST http://localhost:4000/api/v1/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN_HERE"
  }'
```

### 9. Change Password (Authenticated)
```bash
curl -X PUT http://localhost:4000/api/v1/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -b cookies.txt \
  -d '{
    "currentPassword": "NewSecurePass456!",
    "newPassword": "AnotherSecure789!",
    "confirmPassword": "AnotherSecure789!"
  }'
```

### 10. Deactivate Account (Authenticated)
```bash
curl -X DELETE http://localhost:4000/api/v1/auth/deactivate \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -b cookies.txt
```

## Common Response Status Codes

- `200` - Success
- `201` - Created (registration)
- `204` - No Content (logout)
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid credentials or token)
- `404` - Not Found
- `500` - Server Error

## Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

Example valid passwords:
- `SecurePass123!`
- `MyPassword1`
- `Test1234Pass`

## Token Lifetimes

| Token Type | Lifetime |
|------------|----------|
| Access Token (JWT) | 7 days |
| Refresh Token | 30 days |
| Email Verification | 24 hours |
| Password Reset | 1 hour |

## Using with Session-Based Auth

If you're using session-based authentication (cookies), use the `-c` and `-b` flags with curl:

```bash
# Login and save session
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'

# Make authenticated requests
curl http://localhost:4000/api/v1/auth/session -b cookies.txt
```

## Using with JWT Authentication

If you're using JWT tokens, include the `Authorization` header:

```bash
# Get the token from login/register response
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Make authenticated requests
curl http://localhost:4000/api/v1/users/me \
  -H "Authorization: Bearer $TOKEN"
```

## Environment Variables

Add these to your `.env` file:

```env
# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRATION=7d
REFRESH_TOKEN_EXPIRATION=2592000000

# Session
SESSION_SECRET=your-session-secret
SESSION_MAX_AGE=604800000

# Email
EMAIL_FROM=noreply@milokhelo.com
EMAIL_PROVIDER=console

# Frontend
FRONTEND_URL=http://localhost:3000
```

## Development Tips

### Viewing Email Content in Development

In development mode, emails are logged to the console. Look for output like:

```
=== EMAIL ===
To: john@example.com
Subject: Verify your email - Milokhelo
Content:
Hi John Doe,

Please verify your email by clicking the link below:
http://localhost:3000/verify-email/abc123...

This link will expire in 24 hours.
=============
```

### Testing Email Verification Flow

1. Register a user
2. Check console for verification link
3. Extract the token from the URL
4. Call the verify endpoint with the token

### Testing Password Reset Flow

1. Call forgot-password endpoint
2. Check console for reset link
3. Extract the token from the URL
4. Optionally validate the token
5. Call reset-password with the token and new password

## Error Handling

All endpoints return JSON error responses:

```json
{
  "error": "Error message describing what went wrong"
}
```

Validation errors include field details:

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

## Integration with Other Modules

The auth system publishes events that other modules can subscribe to:

```javascript
// In another module's initialization
eventBus.subscribe('user.registered', async (data) => {
  console.log('New user registered:', data.userId);
  // Send welcome notification, create user profile, etc.
});

eventBus.subscribe('user.email_verified', async (data) => {
  console.log('User verified email:', data.userId);
  // Grant access to features, update analytics, etc.
});

eventBus.subscribe('user.password_changed', async (data) => {
  console.log('User changed password:', data.userId);
  // Log security event, notify user on other devices, etc.
});
```

## Troubleshooting

### "Invalid credentials" on login
- Check that the email and password are correct
- Verify the user exists in the database
- Check that the password was hashed correctly

### "Invalid or expired verification token"
- Check that the token hasn't already been used
- Verify the token hasn't expired (24 hours)
- Try requesting a new verification email

### "Invalid refresh token"
- Check that the token hasn't been revoked
- Verify the token hasn't expired (30 days)
- Check that the user account is still active

### Email not received
- In development, check the console output
- In production, check email service logs
- Verify email configuration is correct

## Security Best Practices

1. **Always use HTTPS in production**
2. **Store tokens securely** - Use httpOnly cookies or secure storage
3. **Never log sensitive data** - Tokens, passwords, etc.
4. **Implement rate limiting** - Prevent brute force attacks
5. **Validate all inputs** - Use the provided validation middleware
6. **Monitor authentication events** - Track failed login attempts
7. **Rotate secrets regularly** - JWT_SECRET, SESSION_SECRET
8. **Use strong passwords** - Enforce password policies

## Next Steps

- Review the full API documentation: `docs/api/AUTH_ENDPOINTS.md`
- Check the implementation summary: `docs/api/AUTH_IMPLEMENTATION_SUMMARY.md`
- Add additional security features as needed
- Integrate with your frontend application
- Set up production email service (SendGrid, AWS SES)
