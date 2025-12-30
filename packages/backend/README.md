# Backend Server

Node.js backend server for Puzzle Minigames with Express, Socket.io, and MySQL/MariaDB.

## Features

- RESTful API with Express.js
- Real-time communication with Socket.io
- MySQL/MariaDB database integration
- Player progress tracking
- Leaderboard system with cursor-based pagination
- CORS enabled
- **Real-time request logging** with IP, browser, device info
- **Static file serving** with per-domain configuration
- **Single-port deployment** serving both API and frontend

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Configure database connection in `.env`

4. Create database and tables (see Database Schema section)

## Running the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Health Check
- `GET /health` - Server health check

### Games
- `GET /api/games` - Get all games

### Player Progress
- `GET /api/players/:playerId/progress` - Get player progress
- `POST /api/players/:playerId/progress` - Save player progress

### Leaderboard
- `GET /api/leaderboard?limit=10&cursor=123` - Get top players with cursor-based pagination
  - `limit` (optional): Number of results (1-100, default: 10)
  - `cursor` (optional): ID cursor for pagination (fetch records with ID less than this value)
  - Response includes `nextCursor` for fetching the next page

## Socket.io Events

### Client → Server
- `player:join` - Player joins the game
- `game:start` - Start a game session
- `game:move` - Send game move
- `game:complete` - Complete a game
- `puzzle:discovered` - Puzzle piece discovered
- `chat:message` - Send chat message

### Server → Client
- `player:joined` - Confirmation of join
- `game:started` - Game started notification
- `game:move` - Broadcast player move
- `game:completed` - Game completion notification
- `puzzle:saved` - Puzzle save confirmation
- `chat:message` - Broadcast chat message
- `player:left` - Player disconnected

## Database Schema

```sql
CREATE DATABASE IF NOT EXISTS puzzle_minigames;
USE puzzle_minigames;

CREATE TABLE IF NOT EXISTS games (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS player_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  player_id VARCHAR(255) UNIQUE NOT NULL,
  discovered_puzzles JSON,
  puzzle_board JSON,
  score INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_player_id ON player_progress(player_id);
CREATE INDEX idx_score ON player_progress(score DESC);
```

## Environment Variables

See `.env.example` for all available configuration options.

### Key Configuration Options

**Server:**
- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment (development/production)

**CORS:**
- `CORS_ORIGIN`: Comma-separated list of allowed origins

**Database:**
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`

**Static File Serving:**
- `DOMAIN_STATIC_PATHS`: Per-domain static file paths
  - Format: `domain1:path1,domain2:path2`
  - Example: `example.com:/var/www/example,app.example.com:/var/www/app`
  - Default: Serves mobile app from `../mobile-app/.output/public` on localhost

## Real-Time Request Logging

The server logs detailed information for every request:
- 📥 HTTP method and URL
- 🕐 Timestamp
- 🌐 Client IP address (handles proxies)
- 🖥️ Browser information
- 💻 Operating system
- 📱 Device type
- ⏱️ Response time and status

Example output:
```
┌─────────────────────────────────────────────────────────
│ 📥 GET /api/leaderboard
│ 🕐 2025-12-29T09:30:00.000Z
│ 🌐 IP: 192.168.1.100
│ 🖥️  Browser: Chrome 120.0.0
│ 💻 OS: Windows 10
│ 📱 Device: Desktop
│ 🟢 Status: 200
│ ⏱️  Duration: 45ms
└─────────────────────────────────────────────────────────
```

## Static File Serving

The server can serve static files (frontend) on the same port as the API:

### Default Configuration
- Serves mobile app from `../mobile-app/.output/public`
- Available at `http://localhost:3001/`
- API endpoints available at `http://localhost:3001/api/*`
- Socket.io available at same port

### Per-Domain Configuration

Configure different static file directories for different domains:

**Via Environment Variable:**
```bash
DOMAIN_STATIC_PATHS=example.com:/var/www/example,app.example.com:/var/www/app
```

**Programmatic Configuration:**
```javascript
import { configureDomain } from './middleware/domainStatic.js';

configureDomain('example.com', '/path/to/static/files');
configureDomain('*.subdomain.com', '/path/to/wildcard/files');
```

### How It Works
1. Request arrives at the server
2. If path matches `/api/*` → handled by API routes
3. If path matches `/health` → health check endpoint
4. Otherwise → check domain-specific static file configuration
5. Serve file if exists, or serve `index.html` for SPA routing
6. Fallback to default mobile app static files

## Single-Port Deployment

Everything runs on a single port (default 3001):
- ✅ REST API endpoints (`/api/*`)
- ✅ Socket.io real-time communication
- ✅ Static file serving (frontend)
- ✅ Health check (`/health`)
- ✅ Per-domain static file routing

Benefits:
- Simplified deployment
- Single SSL certificate needed
- Easier firewall configuration
- No CORS issues between API and frontend

## License

MIT
