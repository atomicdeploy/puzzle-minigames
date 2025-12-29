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
          <span id="discovered-count">{{ discoveredCount }}/9</span>
          <span>پازل‌های کشف شده</span>
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

const loading = ref(true);
const discoveredCount = ref(0);
const showFeedback = ref(false);
const sceneContainer = ref(null);

onMounted(async () => {
  // Initialize the game
  await initializeGame();
  loading.value = false;
});

onUnmounted(() => {
  // Cleanup game resources
  cleanupGame();
});

async function initializeGame() {
  // TODO: Import and initialize the game logic from src/main.js
  // This will be migrated to Vue composables
  console.log('Initializing game...');
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
</style>
