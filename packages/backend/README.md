# Backend Server

Node.js backend server for Puzzle Minigames with Express, Socket.io, and MySQL/MariaDB.

## Features

- RESTful API with Express.js
- Real-time communication with Socket.io
- MySQL/MariaDB database integration
- Player progress tracking
- Leaderboard system
- CORS enabled

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
- `GET /api/leaderboard?limit=10` - Get top players

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

## License

MIT
