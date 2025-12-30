# Socket.io Integration Guide

This document explains how to use Socket.io for real-time communication between the mobile app and backend server.

## Overview

The puzzle minigames project uses Socket.io for real-time multiplayer features, live updates, and synchronized game state across clients.

## Architecture

```
Mobile App (Vue/Nuxt)  ←→  Socket.io Client  ←→  Backend Server  ←→  Socket.io Server
                                                        ↓
                                                  MySQL Database
```

## Setup

### Backend Server

The backend Socket.io server is automatically initialized in `packages/backend/src/server.js`:

```javascript
import { Server } from 'socket.io';
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST']
  }
});
```

### Mobile App Client

Use the `useSocket` composable in your Vue components:

```vue
<script setup>
import { useSocket } from '~/composables/useSocket';

const socket = useSocket('http://localhost:3001');

onMounted(() => {
  socket.connect();
  
  socket.on('player:joined', (data) => {
    console.log('Joined game:', data);
  });
});
</script>
```

## Available Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `player:join` | `{ playerName, ... }` | Player joins the game |
| `game:start` | `{ gameId, ... }` | Start a new game session |
| `game:move` | `{ move, ... }` | Send a game move |
| `game:complete` | `{ score, ... }` | Complete a game |
| `puzzle:discovered` | `{ puzzleNumber }` | Puzzle piece discovered |
| `chat:message` | `{ message }` | Send chat message |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `player:joined` | `{ playerId, timestamp }` | Confirmation of join |
| `game:started` | `{ gameId, playerId }` | Game started notification |
| `game:move` | `{ playerId, move }` | Broadcast player move |
| `game:completed` | `{ playerId, score }` | Game completion notification |
| `puzzle:saved` | `{ puzzleNumber, success }` | Puzzle save confirmation |
| `chat:message` | `{ playerId, message, timestamp }` | Chat message broadcast |
| `player:left` | `{ playerId }` | Player disconnected |

## Usage Examples

### Connecting to Server

```javascript
const socket = useSocket('http://localhost:3001');

onMounted(() => {
  socket.connect();
});

onUnmounted(() => {
  socket.disconnect();
});
```

### Sending Events

```javascript
// Join game
socket.joinGame({ 
  playerName: 'محمد',
  device: 'mobile'
});

// Start game
socket.startGame({ 
  gameId: 'main-puzzle',
  difficulty: 'medium'
});

// Send move
socket.sendMove({ 
  puzzleNumber: 5,
  position: 4,
  timestamp: Date.now()
});

// Complete game
socket.completeGame({ 
  score: 1000,
  time: 120
});
```

### Listening to Events

```javascript
// Player joined
socket.on('player:joined', (data) => {
  console.log('Player ID:', data.playerId);
});

// Game started
socket.on('game:started', (data) => {
  console.log('Game started by:', data.playerId);
});

// Other player's move
socket.on('game:move', (data) => {
  console.log('Player moved:', data);
  updateGameBoard(data.move);
});

// Game completed
socket.on('game:completed', (data) => {
  showWinner(data);
});
```

## Complete Example

```vue
<template>
  <div>
    <div v-if="connected">🟢 Connected</div>
    <div v-else>🔴 Disconnected</div>
    
    <button @click="handleJoin">Join Game</button>
    <button @click="handleMove">Make Move</button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useSocket } from '~/composables/useSocket';

const socket = useSocket('http://localhost:3001');
const connected = ref(false);

onMounted(() => {
  socket.connect();
  
  socket.on('connect', () => {
    connected.value = true;
  });
  
  socket.on('disconnect', () => {
    connected.value = false;
  });
  
  socket.on('player:joined', (data) => {
    console.log('Joined successfully:', data);
  });
  
  socket.on('game:move', (data) => {
    console.log('Move received:', data);
  });
});

onUnmounted(() => {
  socket.disconnect();
});

function handleJoin() {
  socket.joinGame({ playerName: 'Player 1' });
}

function handleMove() {
  socket.sendMove({ 
    puzzleNumber: 1, 
    position: 0 
  });
}
</script>
```

## Environment Configuration

### Development

Mobile app connects to `http://localhost:3001` by default.

### Production

Update the socket URL based on your deployment:

```javascript
const socket = useSocket(
  import.meta.env.PROD 
    ? 'https://your-production-server.com' 
    : 'http://localhost:3001'
);
```

Or use environment variables in `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      socketUrl: process.env.SOCKET_URL || 'http://localhost:3001'
    }
  }
})
```

Then in your component:

```javascript
const config = useRuntimeConfig();
const socket = useSocket(config.public.socketUrl);
```

## Best Practices

1. **Always disconnect**: Use `onUnmounted` to disconnect sockets
2. **Error handling**: Listen to `connect_error` events
3. **Reconnection**: Socket.io handles reconnection automatically
4. **Event naming**: Use consistent event naming patterns
5. **Data validation**: Validate data on both client and server
6. **Rate limiting**: Implement rate limiting on the server
7. **Authentication**: Add authentication for production

## Troubleshooting

### Connection Failed

1. Check if backend server is running
2. Verify CORS settings in backend `.env`
3. Check firewall/network settings
4. Verify Socket.io versions match

### Events Not Received

1. Check event name spelling
2. Verify listener is attached before event is emitted
3. Check server logs for errors
4. Use socket.io-client debug mode

### Enable Debug Mode

```javascript
const socket = useSocket('http://localhost:3001');
socket.socket.value.on('*', (event, data) => {
  console.log('Socket event:', event, data);
});
```

## Security Considerations

For production deployment:

1. **Use HTTPS/WSS**: Always use secure connections
2. **Authentication**: Implement JWT or session-based auth
3. **Input validation**: Validate all incoming data
4. **Rate limiting**: Prevent spam/DoS attacks
5. **CORS**: Restrict origins to your domain
6. **Error handling**: Don't expose sensitive errors

## Additional Resources

- [Socket.io Documentation](https://socket.io/docs/)
- [Vue Composables Guide](https://vuejs.org/guide/reusability/composables.html)
- [Nuxt 3 Documentation](https://nuxt.com/docs)
