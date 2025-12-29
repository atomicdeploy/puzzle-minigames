# Backend API Integration

This document describes the backend API integration for the Infernal puzzle game welcome/onboarding system.

## Overview

The welcome page now uses backend API calls instead of localStorage for user authentication and registration. LocalStorage is used only as a cache after successful backend operations.

## API Configuration

### Environment Variables

Create a `.env` file in the root directory (see `.env.example`):

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

For production:
```env
VITE_API_BASE_URL=https://api.yourproduction.com/api
```

### API Endpoints

The following endpoints need to be implemented in your backend:

#### 1. Send OTP
```
POST /auth/send-otp
Content-Type: application/json

Request:
{
  "phone": "09123456789"
}

Response:
{
  "success": true,
  "session": "unique-session-id",
  "message": "OTP sent successfully"
}
```

#### 2. Verify OTP
```
POST /auth/verify-otp
Content-Type: application/json

Request:
{
  "phone": "09123456789",
  "otp": "123456"
}

Response:
{
  "success": true,
  "message": "OTP verified successfully"
}
```

#### 3. Register User
```
POST /auth/register
Content-Type: application/json

Request:
{
  "name": "علی احمدی",
  "birthday": "1370-3-15",
  "gender": "male",
  "educationLevel": "bachelor",
  "fieldOfStudy": "مهندسی کامپیوتر",
  "phone": "09123456789",
  "color": "#6c5ce7",
  "profilePicture": "data:image/jpeg;base64,...", // optional
  "otp": "123456",
  "session": "unique-session-id"
}

Response:
{
  "success": true,
  "user": {
    "name": "علی احمدی",
    "birthday": "1370-3-15",
    "gender": "male",
    "educationLevel": "bachelor",
    "fieldOfStudy": "مهندسی کامپیوتر",
    "phone": "09123456789",
    "color": "#6c5ce7",
    "playerId": "INF-GENERATED-ID",
    "profilePicture": "data:image/jpeg;base64,...",
    "createdAt": "2024-12-29T12:00:00.000Z"
  },
  "token": "jwt-auth-token"
}
```

#### 4. Login (Sign In)
```
POST /auth/login
Content-Type: application/json

Note: Login uses the same flow as registration:
1. Call /auth/send-otp with phone number
2. Call /auth/verify-otp with phone and OTP
3. On successful verification, backend returns existing user data
```

#### 5. Get User Profile
```
GET /user/profile
Authorization: Bearer {token}

Response:
{
  "success": true,
  "user": {
    "name": "علی احمدی",
    "birthday": "1370-3-15",
    ...
  }
}
```

#### 6. Update User Profile
```
PUT /user/profile
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "name": "علی احمدی",
  "fieldOfStudy": "مهندسی نرم افزار",
  ...
}

Response:
{
  "success": true,
  "user": { ... }
}
```

## Authentication Flow

### Registration Flow
1. User fills registration form
2. Frontend validates form data
3. Frontend calls `POST /auth/send-otp` with phone number
4. Backend sends OTP via SMS and returns session ID
5. User enters OTP
6. Frontend calls `POST /auth/register` with all user data + OTP + session
7. Backend verifies OTP, creates user, generates player ID, returns user data + auth token
8. Frontend stores token and user data (as cache)
9. User is redirected to game

### Sign In Flow
1. User enters phone number
2. Frontend calls `POST /auth/send-otp` with phone number
3. Backend sends OTP via SMS and returns session ID
4. User enters OTP
5. Frontend calls `POST /auth/verify-otp` with phone + OTP
6. Backend verifies OTP, retrieves existing user data, returns user data + auth token
7. Frontend stores token and user data (as cache)
8. User is redirected to game

### Session Verification
When user revisits the welcome page:
1. Frontend checks if auth token exists in localStorage
2. If token exists, frontend calls `GET /user/profile` to verify and get fresh data
3. If verification succeeds, user is redirected to game
4. If verification fails, token is cleared and user must login again

## Error Handling

All API calls include comprehensive error handling:
- Network errors are caught and displayed to user
- Invalid responses are handled gracefully
- Corrupted localStorage data is cleared automatically
- Users see appropriate Persian error messages

## Security Considerations

1. **HTTPS**: All production API calls must use HTTPS
2. **Token Storage**: Auth tokens are stored in localStorage (consider httpOnly cookies for production)
3. **Token Expiration**: Backend should implement token expiration and refresh mechanism
4. **Rate Limiting**: Backend should implement rate limiting for OTP endpoints
5. **OTP Validity**: OTPs should expire after 5-10 minutes
6. **CORS**: Backend must configure CORS to allow requests from your frontend domain

## Data Flow

```
User Input → Frontend Validation → API Request → Backend Processing → API Response → Frontend Update → LocalStorage Cache → UI Update
```

## LocalStorage Usage

LocalStorage is now used only for:
1. **Caching**: Store user data after successful backend operations
2. **Auth Token**: Store JWT token for subsequent requests
3. **Offline Support**: Fallback to cached data if backend is unavailable (with warning)

## Backend Implementation Notes

### Player ID Generation
The backend should generate unique player IDs using a format like:
```
INF-{timestamp}-{random}
```

Example: `INF-MJQOYXUM-IFH6`

### OTP Generation
- Use cryptographically secure random number generation
- 6-digit numeric code
- Valid for 5-10 minutes
- Store OTP hash (not plaintext) in backend

### Session Management
- Each OTP request creates a temporary session
- Session includes: phone number, OTP hash, expiry time
- Session is invalidated after successful verification or expiry

## Testing

### Development Mode
For development without a backend:
1. The API calls will fail gracefully
2. Error messages will be displayed
3. You can mock the API responses by modifying `src/api.js`

### Mock API
For testing, you can use a mock server like `json-server` or `msw`:

```javascript
// Example mock in src/api.js
if (import.meta.env.DEV) {
  // Return mock data for development
  return {
    success: true,
    user: { /* mock user data */ },
    token: 'mock-token'
  };
}
```

## Migration from LocalStorage

The old localStorage-only implementation has been replaced with API calls. The migration is seamless:
- Old cached data remains accessible
- New registrations use the backend
- Users with cached data are prompted to verify with backend

## Support

For issues or questions about the API integration, please refer to:
- `src/api.js` - API configuration and helper functions
- `src/welcome.js` - Frontend implementation
- Backend API documentation (to be provided by backend team)
