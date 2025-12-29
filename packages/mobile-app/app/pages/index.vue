<template>
  <div class="game-container">
    <div id="loading-screen" v-if="loading">
      <div class="loading-content">
        <h1>اینفرنال</h1>
        <div class="loading-spinner"></div>
        <p>در حال بارگذاری...</p>
      </div>
    </div>
    
    <div id="game-container" v-show="!loading">
      <header>
        <h1>🧩 اینفرنال 🧩</h1>
        <div class="stats">
          <span id="discovered-count">{{ gameState.discoveredCount }}/9</span>
          <span>پازل‌های کشف شده</span>
          <span v-if="socketConnected" class="connection-status">🟢 متصل</span>
          <span v-else class="connection-status">🔴 قطع</span>
        </div>
      </header>
      
      <div id="scene-container" ref="sceneContainer"></div>
      
      <div id="ui-overlay">
        <div id="puzzle-board"></div>
        <div id="treasure-chests"></div>
      </div>
      
      <div id="feedback-overlay" v-show="showFeedback"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useGameState } from '~/composables/useGameState';
import { useSocket } from '~/composables/useSocket';

const loading = ref(true);
const showFeedback = ref(false);
const sceneContainer = ref(null);

// Initialize game state
const gameState = useGameState();

// Initialize socket connection (optional - uncomment to enable)
const socket = useSocket();
const socketConnected = ref(false);

onMounted(async () => {
  // Load saved game state
  gameState.loadGameState();
  
  // Optional: Connect to backend server
  // socket.connect();
  // socket.on('connect', () => {
  //   socketConnected.value = true;
  //   socket.joinGame({ playerName: 'Player 1' });
  // });
  
  // Initialize the game
  await initializeGame();
  loading.value = false;
});

onUnmounted(() => {
  // Cleanup game resources
  cleanupGame();
  socket.disconnect();
});

async function initializeGame() {
  // TODO: Import and initialize the game logic from src/main.js
  // This will be migrated to Vue composables
  console.log('Initializing game...');
  console.log('Discovered puzzles:', Array.from(gameState.discoveredPuzzles.value));
  console.log('Puzzle board:', gameState.puzzleBoard.value);
}

function cleanupGame() {
  // TODO: Cleanup Three.js scene and event listeners
  console.log('Cleaning up game...');
}
</script>

<style lang="scss" scoped>
.game-container {
  width: 100%;
  height: 100vh;
}

.connection-status {
  margin-left: 10px;
  font-size: 0.9rem;
}

header {
  padding: 1rem;
  text-align: center;
  background: rgba(26, 26, 46, 0.8);
  backdrop-filter: blur(10px);
  
  h1 {
    margin: 0 0 0.5rem 0;
    font-size: 2rem;
  }
  
  .stats {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }
}
</style>
