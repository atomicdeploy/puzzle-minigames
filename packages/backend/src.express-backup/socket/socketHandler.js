// Socket.io event handlers
export function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    // Handle player join
    socket.on('player:join', (data) => {
      if (!data || typeof data !== 'object') {
        socket.emit('error', { message: 'Invalid player:join data' });
        return;
      }
      console.log(`Player joined:`, data);
      socket.emit('player:joined', { 
        playerId: socket.id, 
        timestamp: new Date().toISOString() 
      });
    });

    // Handle game events
    socket.on('game:start', (data) => {
      if (!data || typeof data !== 'object') {
        socket.emit('error', { message: 'Invalid game:start data' });
        return;
      }
      console.log(`Game started by ${socket.id}:`, data);
      io.emit('game:started', { 
        gameId: data.gameId, 
        playerId: socket.id 
      });
    });

    socket.on('game:move', (data) => {
      if (!data || typeof data !== 'object') {
        socket.emit('error', { message: 'Invalid game:move data' });
        return;
      }
      console.log(`Game move from ${socket.id}:`, data);
      // Broadcast move to other players
      socket.broadcast.emit('game:move', { 
        playerId: socket.id, 
        move: data 
      });
    });

    socket.on('game:complete', (data) => {
      if (!data || typeof data !== 'object' || typeof data.score !== 'number') {
        socket.emit('error', { message: 'Invalid game:complete data' });
        return;
      }
      console.log(`Game completed by ${socket.id}:`, data);
      io.emit('game:completed', { 
        playerId: socket.id, 
        score: data.score 
      });
    });

    // Handle puzzle discovery
    socket.on('puzzle:discovered', (data) => {
      if (!data || typeof data !== 'object' || typeof data.puzzleNumber !== 'number') {
        socket.emit('error', { message: 'Invalid puzzle:discovered data' });
        return;
      }
      console.log(`Puzzle discovered by ${socket.id}:`, data);
      socket.emit('puzzle:saved', { 
        puzzleNumber: data.puzzleNumber, 
        success: true 
      });
    });

    // Handle chat messages (if needed)
    socket.on('chat:message', (data) => {
      if (!data || typeof data !== 'object' || typeof data.message !== 'string') {
        socket.emit('error', { message: 'Invalid chat:message data' });
        return;
      }
      console.log(`Chat message from ${socket.id}:`, data);
      io.emit('chat:message', { 
        playerId: socket.id, 
        message: data.message, 
        timestamp: new Date().toISOString() 
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
      io.emit('player:left', { playerId: socket.id });
    });

    // Error handling
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });
  });

  return io;
}
