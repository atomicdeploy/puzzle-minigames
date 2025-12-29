import { ref, onMounted, onUnmounted } from 'vue';
import { io } from 'socket.io-client';

// Socket.io connection composable
export function useSocket(serverUrl = 'http://localhost:3001') {
  const socket = ref(null);
  const connected = ref(false);
  const error = ref(null);
  
  // Connect to server
  function connect() {
    try {
      socket.value = io(serverUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      });
      
      // Connection event handlers
      socket.value.on('connect', () => {
        connected.value = true;
        error.value = null;
        console.log('✅ Connected to server:', socket.value.id);
      });
      
      socket.value.on('disconnect', () => {
        connected.value = false;
        console.log('❌ Disconnected from server');
      });
      
      socket.value.on('connect_error', (err) => {
        error.value = err.message;
        console.error('Connection error:', err);
      });
      
    } catch (err) {
      error.value = err.message;
      console.error('Socket initialization error:', err);
    }
  }
  
  // Disconnect from server
  function disconnect() {
    if (socket.value) {
      socket.value.disconnect();
      socket.value = null;
      connected.value = false;
    }
  }
  
  // Emit event to server
  function emit(event, data) {
    if (socket.value && connected.value) {
      socket.value.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit:', event);
    }
  }
  
  // Listen to server events
  function on(event, callback) {
    if (socket.value) {
      socket.value.on(event, callback);
    }
  }
  
  // Remove event listener
  function off(event, callback) {
    if (socket.value) {
      socket.value.off(event, callback);
    }
  }
  
  // Game-specific methods
  function joinGame(playerData) {
    emit('player:join', playerData);
  }
  
  function startGame(gameData) {
    emit('game:start', gameData);
  }
  
  function sendMove(moveData) {
    emit('game:move', moveData);
  }
  
  function completeGame(scoreData) {
    emit('game:complete', scoreData);
  }
  
  function discoverPuzzle(puzzleData) {
    emit('puzzle:discovered', puzzleData);
  }
  
  function sendChatMessage(message) {
    emit('chat:message', { message });
  }
  
  // Auto-connect on mount, disconnect on unmount
  onMounted(() => {
    // Optional: auto-connect
    // connect();
  });
  
  onUnmounted(() => {
    disconnect();
  });
  
  return {
    // State
    socket,
    connected,
    error,
    
    // Methods
    connect,
    disconnect,
    emit,
    on,
    off,
    
    // Game methods
    joinGame,
    startGame,
    sendMove,
    completeGame,
    discoverPuzzle,
    sendChatMessage,
  };
}
