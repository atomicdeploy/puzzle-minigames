# Integration Testing Guide

This guide explains how to test the complete monorepo with both mobile app and backend server.

## Prerequisites

- Node.js v18+
- MySQL/MariaDB (optional, server runs without it)
- Git

## Initial Setup

1. **Clone and install**:
```bash
git clone <repository-url>
cd puzzle-minigames
npm install
```

This installs dependencies for all packages in the workspace.

## Testing the Backend Server

### 1. Configure Database (Optional)

```bash
cd packages/backend
cp .env.example .env
```

Edit `.env` with your MySQL credentials:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=puzzle_minigames
```

### 2. Create Database

```bash
mysql -u root -p < database/schema.sql
```

### 3. Start Backend Server

```bash
# From root directory
npm run backend:dev

# Or from backend directory
cd packages/backend
npm run dev
```

Expected output:
```
🚀 Server running on port 3001
📡 Socket.io server ready
🔗 Health check: http://localhost:3001/health
✅ Database connected successfully
```

### 4. Test Health Endpoint

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{"status":"ok","timestamp":"2025-12-29T..."}
```

### 5. Test API Endpoints

```bash
# Get all games
curl http://localhost:3001/api/games

# Get player progress
curl http://localhost:3001/api/players/player123/progress

# Save player progress
curl -X POST http://localhost:3001/api/players/player123/progress \
  -H "Content-Type: application/json" \
  -d '{"discoveredPuzzles":[1,2,3],"puzzleBoard":[1,2,3,null,null,null,null,null,null],"score":100}'

# Get leaderboard
curl http://localhost:3001/api/leaderboard?limit=10
```

## Testing the Mobile App

### 1. Start Development Server

```bash
# From root directory
npm run mobile:dev

# Or from mobile-app directory
cd packages/mobile-app
npm run dev
```

Expected output:
```
✔ Nuxt 4.2.2 with Nitro 2.12.9
  ➜ Local:    http://localhost:3000/
```

### 2. Open in Browser

Navigate to `http://localhost:3000/` in your browser.

### 3. Test Socket.io Connection (if enabled)

Open browser console and check for:
```
✅ Connected to server: <socket-id>
Initializing game...
Discovered puzzles: []
Puzzle board: [null, null, null, ...]
```

### 4. Build for Production

```bash
# Generate static site
npm run mobile:build

# Preview production build
cd packages/mobile-app
npm run preview
```

## Testing Both Services Together

### 1. Start Both Services

```bash
# From root directory
npm run dev
```

This starts both mobile app (port 3000) and backend (port 3001) concurrently.

### 2. Test Real-time Communication

#### In Browser Console (http://localhost:3000):

```javascript
// Access socket instance (if enabled in index.vue)
// Uncomment socket.connect() in the component first

// Send test event
socket.emit('player:join', { playerName: 'Test Player' });

// Listen for response
socket.on('player:joined', (data) => {
  console.log('Joined:', data);
});

// Test game move
socket.emit('game:move', { 
  puzzleNumber: 1, 
  position: 0 
});
```

#### In Backend Console:

You should see:
```
Player joined: { playerName: 'Test Player' }
Game move from <socket-id>: { puzzleNumber: 1, position: 0 }
```

## Building for Production

### Build All Packages

```bash
npm run build
```

### Individual Builds

```bash
# Mobile app
npm run mobile:build

# Backend
npm run backend:build
```

## Testing Android Build

### 1. Generate Mobile App

```bash
cd packages/mobile-app
npm run generate
```

### 2. Initialize Capacitor (First time only)

```bash
npm run android:init
```

### 3. Build and Sync

```bash
npm run android:build
```

### 4. Open in Android Studio

```bash
npm run android:open
```

Build APK from Android Studio.

## Common Issues

### Backend Issues

**Database Connection Failed**:
- Check MySQL is running: `systemctl status mysql`
- Verify credentials in `.env`
- Check firewall settings
- Server continues without database (limited functionality)

**Port Already in Use**:
```bash
# Find process using port 3001
lsof -i :3001
# Kill process
kill -9 <PID>
```

### Mobile App Issues

**Build Fails**:
```bash
# Clear cache
rm -rf packages/mobile-app/node_modules
rm -rf packages/mobile-app/.nuxt
npm install
```

**SCSS Not Loading**:
- Ensure files are in `app/assets/scss/` directory
- Check `nuxt.config.ts` CSS configuration

**Socket Connection Failed**:
- Ensure backend is running on port 3001
- Check CORS settings in backend
- Verify Socket.io client version matches server

## Performance Testing

### Load Testing Backend

Using Apache Bench:
```bash
# Test health endpoint
ab -n 1000 -c 10 http://localhost:3001/health

# Test API endpoint
ab -n 100 -c 5 http://localhost:3001/api/games
```

### Socket.io Load Testing

Use `socket.io-client-test`:
```bash
npm install -g socket.io-client-test
socket-io-test http://localhost:3001 -n 100
```

## Debugging

### Backend Debugging

Add to `packages/backend/src/server.js`:
```javascript
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
```

### Frontend Debugging

Enable Nuxt DevTools (already enabled in `nuxt.config.ts`):
- Press `Shift + Alt + D` in browser
- View component tree, state, routes

### Socket.io Debugging

Client side:
```javascript
const socket = useSocket('http://localhost:3001');
socket.socket.value.on('*', (event, data) => {
  console.log('Event:', event, data);
});
```

Server side (`packages/backend/src/socket/socketHandler.js`):
```javascript
io.use((socket, next) => {
  console.log('Socket middleware:', socket.id);
  next();
});
```

## Continuous Integration

### GitHub Actions Example

Create `.github/workflows/test.yml`:
```yaml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run mobile:build
      - run: npm run backend:build
```

## Conclusion

Your monorepo is now fully set up and tested! Both packages build and run successfully:

✅ Mobile app (Nuxt 3 + Vue 3 + SCSS + Capacitor)
✅ Backend server (Node.js + Express + Socket.io + MySQL)
✅ Real-time communication ready
✅ Database integration ready
✅ Production builds working

Next steps:
- Migrate game logic to Vue composables
- Implement authentication
- Deploy to production
