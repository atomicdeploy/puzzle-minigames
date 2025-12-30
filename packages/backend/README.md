# Backend - AdonisJS API Server 🚀

Complete backend API server for Puzzle Minigames built with AdonisJS 6 (TypeScript), featuring authentication, real-time communication, and comprehensive game progress tracking.

## 🏗️ Technology Stack

- **Framework**: AdonisJS 6 (TypeScript)
- **Database**: MySQL/MariaDB with Lucid ORM
- **Authentication**: Session-based with scrypt password hashing
- **Real-time**: Socket.io with session token authentication
- **SMS Service**: Melipayamak for OTP verification
- **Validation**: VineJS for input validation
- **Testing**: Japa test framework
- **CLI**: Elegant command-line interface with TUI

## Features

- **RESTful API** with 17 endpoints
- **Authentication System** with email/password and phone OTP
- **Real-time communication** with Socket.io
- **Server-side answer validation** (security improvement)
- **Player progress tracking** with leaderboard
- **Session tracking** for authenticated and anonymous users
- **Page visit analytics** with device information
- **Admin verification workflow** for complex answers
- **Comprehensive CLI tools** for administration
- **Complete test suite** with Japa

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- MySQL/MariaDB database
- (Optional) Melipayamak SMS account for OTP

### Setup Steps

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your database credentials

# 3. Generate application key
node ace generate:key

# 4. Create database
mysql -u root -p
CREATE DATABASE puzzle_minigames;

# 5. Run migrations
npm run db:migrate

# 6. Seed initial data (games and answers)
npm run db:seed
```

## 🚀 Running the Server

### Development Mode (with hot reload)
```bash
npm run dev
```
Server starts at http://localhost:3001 with automatic restart on file changes.

### Production Mode
```bash
# Build TypeScript
npm run build

# Start server
npm start
```

### Available Scripts
```bash
npm run dev          # Development with hot reload
npm run build        # Build TypeScript to JavaScript
npm start            # Start production server
npm test             # Run test suite
npm run lint         # Run ESLint
npm run typecheck    # Check TypeScript types
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with initial data
npm run db:rollback  # Rollback last migration
```

## 🛠️ CLI Commands (Elegant Administration)

AdonisJS provides powerful CLI commands for administration:

### User Management
```bash
# Create a new user (interactive prompts)
node ace user:create email@example.com

# Create user with password
node ace user:create email@example.com password123
```

### Statistics & Monitoring
```bash
# Show application statistics (users, progress, submissions, visits)
node ace stats:show
```

### Answer Management
```bash
# List all configured minigame answers
node ace answer:list

# List pending answer submissions
node ace answer:verify --list

# Verify a specific submission (interactive)
node ace answer:verify <submission_id>
```

### SMS Testing
```bash
# Check SMS service credit
node ace sms:test

# Send test SMS
node ace sms:test --phone=09123456789
```

### Database Commands
```bash
# Run migrations
node ace migration:run

# Rollback migrations
node ace migration:rollback

# Fresh migration (drops all tables)
node ace migration:fresh

# Seed database
node ace db:seed

# Create new migration
node ace make:migration create_table_name

# Create new model
node ace make:model ModelName

# Create new controller
node ace make:controller ControllerName
```

### Utility Commands
```bash
# List all routes
node ace list:routes

# List all available commands
node ace list

# Generate encryption key
node ace generate:key

# Start REPL session
node ace repl
```

## 📡 API Endpoints

### Authentication (5 endpoints)
- `POST /api/auth/register` - Register new user with email/password
- `POST /api/auth/login` - Login with credentials
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/otp/send` - Send OTP code via SMS
- `POST /api/auth/otp/verify` - Verify OTP and login

### User Management (3 endpoints)
- `GET /api/users/profile` - Get current user profile (auth required)
- `PUT /api/users/profile` - Update user profile (auth required)
- `GET /api/users/visits` - Get page visit history (auth required)

### Games (2 endpoints)
- `GET /api/games` - Get all available games
- `GET /api/games/:id` - Get specific game details

### Player Progress (3 endpoints)
- `GET /api/players/progress` - Get player's progress (auth required)
- `POST /api/players/progress` - Save player progress (auth required)
- `GET /api/leaderboard` - Get top players leaderboard with pagination

### Minigame Answers (3 endpoints)
- `POST /api/minigames/answers/submit` - Submit answer for validation (auth required)
- `GET /api/minigames/answers/pending` - Get pending submissions for admin review (auth required)
- `GET /api/minigames/answers/history` - Get user's submission history (auth required)

### Session Tracking (2 endpoints)
- `POST /api/sessions/track` - Track page visit and session
- `GET /api/sessions/current` - Get current session information

### Health Check (1 endpoint)
- `GET /health` - Server health check

### API Response Format

All API responses follow this format:
```json
{
  "success": true,
  "data": { },
  "message": "Operation successful"
}
```

Error responses:
```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional details (dev only)"
}
```

## 🔐 Authentication System

### Email/Password Registration
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password",
  "fullName": "User Name",
  "phoneNumber": "09123456789"
}
```

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password"
}
```

### Phone OTP Verification
```bash
# 1. Send OTP
POST /api/auth/otp/send
{
  "phoneNumber": "09123456789"
}

# 2. Verify OTP
POST /api/auth/otp/verify
{
  "phoneNumber": "09123456789",
  "code": "123456"
}
```

### Session Management
- Sessions stored in cookies (httpOnly, sameSite=lax)
- 2-hour expiration by default
- Automatic session refresh on activity
- Both authenticated and anonymous users tracked

## 🎮 Minigame Answer Validation

### Server-Side Answer Storage
Answers are now stored securely on the server (not in client code):

**Mirror Game:**
- Password: "حقیقت در سکوت است" (Truth is in silence)
- Word Order: Zoom, Escape, Infernal

**Weight Game:**
- White ball weight: 4

**Basketball Game:**
- Requires admin verification

### Submit Answer
```bash
POST /api/minigames/answers/submit
Content-Type: application/json
Cookie: adonis-session=...

{
  "minigameName": "mirror",
  "answerKey": "password",
  "answer": "حقیقت در سکوت است"
}
```

**Response (Instant Verification):**
```json
{
  "success": true,
  "message": "Correct answer!",
  "isCorrect": true,
  "status": "instant"
}
```

**Response (Admin Verification Required):**
```json
{
  "success": true,
  "message": "Answer submitted for verification",
  "status": "pending",
  "requiresVerification": true
}
```

## 🔌 Socket.io Integration

### Connection with Authentication
```javascript
import io from 'socket.io-client'

const socket = io('http://localhost:3001', {
  auth: {
    token: 'your-session-token'  // Required for authentication
  }
})
```

### Events

**Client → Server:**
- `player:join` - Player joins the game
- `game:start` - Start a game session
- `game:move` - Send game move
- `game:complete` - Complete a game
- `puzzle:discovered` - Puzzle piece discovered
- `chat:message` - Send chat message

**Server → Client:**
- `player:joined` - Confirmation of join with user ID
- `game:started` - Game started notification
- `game:move` - Broadcast player move
- `game:completed` - Game completion notification
- `puzzle:saved` - Puzzle save confirmation
- `chat:message` - Broadcast chat message
- `player:left` - Player disconnected
- `error` - Error notification

### Authentication
All Socket.io connections require a valid session token passed in the `auth.token` field. Unauthorized connections are rejected.

## 🗄️ Database Schema

### Tables

**users** - User accounts
```sql
- id (INT, PRIMARY KEY)
- full_name (VARCHAR)
- email (VARCHAR, UNIQUE)
- phone_number (VARCHAR, UNIQUE)
- password (VARCHAR, hashed)
- is_phone_verified (BOOLEAN)
- is_email_verified (BOOLEAN)
- device_info (TEXT)
- user_agent (TEXT)
- last_login_at (TIMESTAMP)
- created_at, updated_at (TIMESTAMPS)
```

**user_sessions** - Session tracking
```sql
- id (INT, PRIMARY KEY)
- user_id (INT, NULLABLE, FOREIGN KEY)
- session_token (VARCHAR, UNIQUE)
- ip_address (VARCHAR)
- user_agent (TEXT)
- device_info (TEXT)
- is_active (BOOLEAN)
- expires_at (TIMESTAMP)
- created_at, updated_at (TIMESTAMPS)
```

**player_progresses** - Game progress
```sql
- id (INT, PRIMARY KEY)
- user_id (INT, FOREIGN KEY)
- discovered_puzzles (JSON)
- puzzle_board (JSON)
- score (INT)
- completed_games (INT)
- created_at, updated_at (TIMESTAMPS)
```

**minigame_answers** - Correct answers (server-side)
```sql
- id (INT, PRIMARY KEY)
- minigame_name (VARCHAR)
- answer_key (VARCHAR)
- answer_value (TEXT)
- requires_admin_verification (BOOLEAN)
- is_active (BOOLEAN)
- created_at, updated_at (TIMESTAMPS)
```

**answer_submissions** - Submission history
```sql
- id (INT, PRIMARY KEY)
- user_id (INT, FOREIGN KEY)
- minigame_name (VARCHAR)
- submitted_answer (TEXT)
- is_correct (BOOLEAN)
- verification_status (ENUM: pending, approved, rejected, instant)
- verified_by (INT, NULLABLE)
- verified_at (TIMESTAMP, NULLABLE)
- created_at, updated_at (TIMESTAMPS)
```

**page_visits** - Analytics
```sql
- id (INT, PRIMARY KEY)
- user_id (INT, NULLABLE, FOREIGN KEY)
- session_token (VARCHAR)
- page_path (VARCHAR)
- page_title (VARCHAR)
- referrer (VARCHAR)
- ip_address (VARCHAR)
- user_agent (TEXT)
- device_info (TEXT)
- created_at (TIMESTAMP)
```

**otps** - OTP verification codes
```sql
- id (INT, PRIMARY KEY)
- user_id (INT, NULLABLE, FOREIGN KEY)
- phone_number (VARCHAR)
- code (VARCHAR)
- is_used (BOOLEAN)
- expires_at (TIMESTAMP)
- created_at (TIMESTAMP)
```

**games** - Game information
```sql
- id (INT, PRIMARY KEY)
- name (VARCHAR)
- description (TEXT)
- difficulty (VARCHAR)
- created_at, updated_at (TIMESTAMPS)
```

## 🌐 Environment Variables

See root `.env.example` for all available configuration options.

### Required Configuration

**Application:**
```env
PORT=3001
NODE_ENV=development
HOST=0.0.0.0
LOG_LEVEL=info
APP_KEY=your_32_character_app_key_here
SESSION_DRIVER=cookie
```

**Database:**
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=puzzle_minigames
```

**CORS:**
```env
CORS_ORIGIN=*  # Comma-separated origins for production
```

**SMS (Optional - for OTP):**
```env
MELIPAYAMAK_USERNAME=your_username
MELIPAYAMAK_PASSWORD=your_password
```

### Generate App Key
```bash
node ace generate:key
```

## 📊 Session Tracking

### Tracked Information
- User ID (if authenticated)
- Session token (for anonymous users)
- Page path and title
- Referrer URL
- IP address
- User agent string
- Device information (browser, OS, device type)
- Timestamp

### Track Page Visit
```bash
POST /api/sessions/track
Content-Type: application/json

{
  "pagePath": "/minigames/mirror",
  "pageTitle": "Mirror Game",
  "referrer": "https://example.com",
  "deviceInfo": "Mobile, iOS, Safari"
}
```

## 📱 SMS Integration (Melipayamak)

### Setup
1. Register at https://panel.melipayamak.com
2. Add credentials to `.env`:
```env
MELIPAYAMAK_USERNAME=your_username
MELIPAYAMAK_PASSWORD=your_password
```

### Test SMS Service
```bash
# Check account credit
node ace sms:test

# Send test SMS
node ace sms:test --phone=09123456789
```

### Features
- OTP delivery in Persian
- 5-minute OTP expiration
- Automatic retry logic
- Credit balance checking
- Message tracking

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Specific Test Suite
```bash
node ace test tests/functional/auth.spec.ts
node ace test tests/functional/health.spec.ts
```

### Test Structure
```
tests/
├── functional/      # API endpoint tests
│   ├── auth.spec.ts
│   ├── health.spec.ts
│   └── ...
└── unit/           # Unit tests
    └── ...
```

### Writing Tests
Tests use the Japa framework with API client:
```typescript
test('POST /api/auth/register should create a new user', async ({ client }) => {
  const response = await client.post('/api/auth/register').json({
    email: 'test@example.com',
    password: 'password123'
  })

  response.assertStatus(201)
  response.assertBodyContains({ success: true })
})
```

## 🔒 Security Features

### Implemented Security Measures
- ✅ **Password hashing** with scrypt (cost: 16384)
- ✅ **Session-based authentication** with secure cookies
- ✅ **Server-side answer validation** (removed from client)
- ✅ **SQL injection protection** via Lucid ORM
- ✅ **Input validation** with VineJS on all endpoints
- ✅ **CORS configuration** with environment-based origins
- ✅ **Socket.io authentication** with session tokens
- ✅ **Rate limiting ready** (can be added via middleware)
- ✅ **Secure cookie settings** (httpOnly, sameSite)
- ✅ **XSS protection** via input sanitization

### Best Practices
- Never expose sensitive data in error messages (production)
- Use parameterized queries (Lucid ORM handles this)
- Validate all user input
- Use HTTPS in production
- Rotate session tokens regularly
- Implement rate limiting for sensitive endpoints

## 🐛 Debugging

### Enable Debug Logs
```env
LOG_LEVEL=debug
NODE_ENV=development
```

### View Detailed Logs
Development logs are pretty-printed with colors:
```
🚀 Server running on port 3001
📡 Socket.io server ready with authentication
✅ Database connected successfully
```

Production logs are JSON formatted for log aggregation.

### Common Issues

**Issue**: Cannot connect to database
**Solution**: Check DB credentials in `.env`, ensure MySQL is running

**Issue**: APP_KEY not found
**Solution**: Run `node ace generate:key`

**Issue**: SMS not sending
**Solution**: Configure Melipayamak credentials or test without OTP first

**Issue**: Port 3001 already in use
**Solution**: Change PORT in `.env` or stop other service

**Issue**: Migration errors
**Solution**: Ensure database exists: `CREATE DATABASE puzzle_minigames;`

## 📈 Performance Optimizations

- **Database connection pooling** (10 connections)
- **Indexed queries** on user_id, score, session_token
- **Efficient session management** with cookie-based storage
- **Async/await** throughout for non-blocking I/O
- **Prepared statements** for SQL security and performance
- **JSON field types** for flexible data storage
- **Query optimization** with Lucid ORM

## 🚀 Deployment

### Production Checklist
- [ ] Set `NODE_ENV=production` in `.env`
- [ ] Configure production database
- [ ] Set strong `APP_KEY`
- [ ] Configure CORS origins (not `*`)
- [ ] Set up SSL/TLS certificate
- [ ] Configure SMS credentials (if using OTP)
- [ ] Run migrations: `npm run db:migrate`
- [ ] Seed data: `npm run db:seed`
- [ ] Build application: `npm run build`
- [ ] Set up process manager (PM2, systemd)
- [ ] Configure reverse proxy (Nginx, Apache)
- [ ] Set up monitoring and logging
- [ ] Configure backups for database

### Process Manager (PM2)
```bash
npm install -g pm2

# Start application
pm2 start bin/server.js --name puzzle-backend

# Save configuration
pm2 save

# Set up startup script
pm2 startup
```

### Reverse Proxy (Nginx)
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## 📚 Additional Documentation

- [Migration Complete Guide](../../MIGRATION_COMPLETE.md) - Full migration details
- [Backend Summary](../../BACKEND_SUMMARY.md) - Quick reference
- [Environment Config](../../ENV_CONFIG.md) - Configuration guide
- [AdonisJS Documentation](https://docs.adonisjs.com) - Official docs

## 🤝 Contributing

1. Create feature branch
2. Write tests for new features
3. Ensure all tests pass: `npm test`
4. Run linter: `npm run lint`
5. Check types: `npm run typecheck`
6. Submit pull request

## 📄 License

MIT License
