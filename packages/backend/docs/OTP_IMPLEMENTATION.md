# OTP Implementation with Mellipayamak

## Overview

This document describes the OTP (One-Time Password) authentication system implemented using the Mellipayamak SMS provider.

## Configuration

### Environment Variables

The following environment variables must be configured in `.env`:

```env
# Mellipayamak SMS Configuration (for OTP)
MELLIPAYAMAK_ENDPOINT=rest.payamak-panel.com
MELLIPAYAMAK_USERNAME=your-username-here
MELLIPAYAMAK_PASSWORD=your-api-key-here
MELLIPAYAMAK_PATTERN_CODE=413580
```

### Database Setup

Run the following SQL scripts to set up the required tables:

1. `database/schema.sql` - Creates the base database and tables
2. `database/auth_schema.sql` - Creates authentication tables (users and otp_sessions)

```bash
mysql -u root < packages/backend/database/schema.sql
mysql -u root < packages/backend/database/auth_schema.sql
```

## API Endpoints

### 1. Send OTP

Sends an OTP code to the specified phone number via SMS.

**Endpoint:** `POST /api/auth/send-otp`

**Request Body:**
```json
{
  "phone": "09901212697"
}
```

**Response (Success):**
```json
{
  "success": true,
  "session": "uuid-session-id",
  "message": "کد تایید با موفقیت ارسال شد"
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "خطا در ارسال پیامک. لطفاً دوباره تلاش کنید"
}
```

### 2. Verify OTP

Verifies the OTP code and returns user information if the user exists.

**Endpoint:** `POST /api/auth/verify-otp`

**Request Body:**
```json
{
  "phone": "09901212697",
  "otp": "123456"
}
```

**Response (Existing User - Sign In):**
```json
{
  "success": true,
  "token": "auth-token",
  "user": {
    "id": 1,
    "phone": "09901212697",
    "name": "Test User",
    "birthday": "1990-01-01",
    "gender": "male",
    "educationLevel": "bachelor",
    "fieldOfStudy": "Computer Science",
    "color": "#6c5ce7",
    "playerId": "INF-MJS9N0TS-B929",
    "profilePicture": null
  },
  "message": "ورود با موفقیت انجام شد"
}
```

**Response (New User):**
```json
{
  "success": true,
  "message": "کد تایید با موفقیت تایید شد",
  "newUser": true
}
```

**Response (Invalid OTP):**
```json
{
  "success": false,
  "message": "کد تایید نامعتبر یا منقضی شده است"
}
```

### 3. Register User

Registers a new user in the system.

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "phone": "09901212697",
  "name": "Test User",
  "birthday": "1990-01-01",
  "gender": "male",
  "educationLevel": "bachelor",
  "fieldOfStudy": "Computer Science",
  "color": "#6c5ce7",
  "profilePicture": "data:image/jpeg;base64,..." // optional
}
```

**Response (Success):**
```json
{
  "success": true,
  "token": "auth-token",
  "user": {
    "phone": "09901212697",
    "name": "Test User",
    "birthday": "1990-01-01",
    "gender": "male",
    "educationLevel": "bachelor",
    "fieldOfStudy": "Computer Science",
    "color": "#6c5ce7",
    "playerId": "INF-MJS9N0TS-B929",
    "profilePicture": null
  },
  "message": "ثبت نام با موفقیت انجام شد"
}
```

## Authentication Flows

### Registration Flow

1. User fills out registration form
2. Frontend calls `POST /api/auth/send-otp` with phone number
3. Backend generates 6-digit OTP and sends via Mellipayamak
4. OTP session is stored in database with 10-minute expiry
5. User enters OTP code
6. Frontend calls `POST /api/auth/verify-otp` with phone and OTP
7. Backend verifies OTP and marks it as verified
8. Frontend calls `POST /api/auth/register` with user details
9. Backend creates user account and returns auth token
10. User is authenticated and redirected to game

### Sign In Flow

1. User enters phone number
2. Frontend calls `POST /api/auth/send-otp` with phone number
3. Backend generates 6-digit OTP and sends via Mellipayamak
4. OTP session is stored in database with 10-minute expiry
5. User enters OTP code
6. Frontend calls `POST /api/auth/verify-otp` with phone and OTP
7. Backend verifies OTP and retrieves existing user data
8. Backend returns user data and auth token
9. User is authenticated and redirected to game

## Mellipayamak Integration

### Service Implementation

The Mellipayamak service is implemented in `src/services/mellipayamak.js` and uses the REST API endpoint:

- **Endpoint:** `https://rest.payamak-panel.com/api/SendSMS/BaseServiceNumber`
- **Method:** POST
- **Authentication:** Username and password in request body
- **Pattern Code:** 413580 (configured for OTP messages)

### Request Format

```json
{
  "username": "your-username",
  "password": "your-api-key",
  "to": "09901212697",
  "bodyId": 413580,
  "text": "123456"
}
```

### Response Format

**Success:**
```json
{
  "Value": "5461268677656004204",
  "RetStatus": 1,
  "StrRetStatus": "Ok"
}
```

- `RetStatus: 1` indicates success
- `Value` is the message ID

## Testing

### Test Phone Numbers

The following phone numbers are configured for testing:
- 09901212697
- 09197103488

### Manual Testing

Use the provided test script:

```bash
cd packages/backend
./test-otp.sh
```

Or test manually with curl:

```bash
# 1. Send OTP
curl -X POST http://localhost:3001/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "09901212697"}'

# 2. Get OTP from database (or SMS)
mysql -u root -p -e "USE puzzle_minigames; SELECT otp_code FROM otp_sessions WHERE phone='09901212697' ORDER BY created_at DESC LIMIT 1;"

# 3. Verify OTP
curl -X POST http://localhost:3001/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "09901212697", "otp": "YOUR_OTP"}'

# 4. Register user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "09901212697",
    "name": "Test User",
    "birthday": "1990-01-01",
    "gender": "male",
    "educationLevel": "bachelor",
    "fieldOfStudy": "Computer Science",
    "color": "#6c5ce7"
  }'
```

## Security Considerations

1. **OTP Expiry:** OTPs expire after 10 minutes
2. **One-Time Use:** Once an OTP is verified, it's marked as used
3. **Phone Validation:** Phone numbers must match Iranian mobile format (09XXXXXXXXX)
4. **Rate Limiting:** Should be implemented to prevent abuse
5. **HTTPS:** All API calls should use HTTPS in production
6. **Token Security:** Auth tokens should use JWT with expiration in production
7. **⚠️ Current Limitation:** Generated auth tokens are not validated. Token validation middleware needs to be implemented for protected routes.
8. **⚠️ Registration Security:** Consider adding OTP verification check before allowing registration to prevent direct endpoint access.

## Database Schema

### users table

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255),
  birthday DATE,
  gender ENUM('male', 'female', 'other'),
  education_level VARCHAR(50),
  field_of_study VARCHAR(255),
  color VARCHAR(20),
  profile_picture LONGTEXT,
  player_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### otp_sessions table

```sql
CREATE TABLE otp_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  otp_code VARCHAR(10) NOT NULL,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Troubleshooting

### OTP Not Sending

1. Check Mellipayamak credentials in `.env`
2. Verify endpoint is set to `rest.payamak-panel.com`
3. Check server logs for detailed error messages
4. Ensure database connection is working
5. Verify phone number format (must start with 09)

### OTP Verification Failing

1. Check if OTP has expired (10-minute limit)
2. Verify OTP hasn't been used already
3. Ensure exact phone number match
4. Check database for OTP session records

### Database Connection Issues

1. Ensure MySQL is running: `sudo service mysql status`
2. Verify database credentials in `.env`
3. Check if database and tables exist
4. Test connection: `mysql -u [username] -p[password] puzzle_minigames`

## Production Deployment

Before deploying to production:

1. ✅ Update `.env` with production credentials
2. ✅ Enable HTTPS for all API endpoints
3. ⚠️ Implement JWT-based authentication tokens
4. ⚠️ Add rate limiting to OTP endpoints
5. ⚠️ Set up monitoring for SMS delivery
6. ⚠️ Configure backup SMS provider
7. ⚠️ Add logging and analytics
8. ⚠️ Implement CORS restrictions
9. ⚠️ Set up database backups
10. ⚠️ Add input validation and sanitization
