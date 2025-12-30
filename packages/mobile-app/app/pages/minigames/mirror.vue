<template>
  <div class="minigame-mirror">
    <div id="game-container">
      <header>
        <h1>🪞 آینه 🪞</h1>
      </header>
      
      <!-- Stage 1: Password Input -->
      <div v-if="currentStage === 1" class="stage active">
        <div class="stage-content">
          <div class="mirror-container">
            <div class="mirror-dome">
              <div class="mirror-glass">
                <div class="glass-shine"></div>
                <div class="glass-reflection-top"></div>
                <div class="glass-reflection-bottom"></div>
              </div>
              <div class="mirror-base"></div>
            </div>
          </div>
          
          <div class="input-group">
            <input 
              v-model="password"
              type="text" 
              placeholder="" 
              autocomplete="off" 
              aria-label="رمز عبور"
              @keyup.enter="submitPassword"
            >
            <button @click="submitPassword" class="submit-button" aria-label="تأیید">
              <span class="button-text">تأیید</span>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Stage 2: Word Ordering -->
      <div v-else-if="currentStage === 2" class="stage active">
        <div class="stage-content">
          <div class="success-message">
            ✨ آفرین! اکنون کلمات را به ترتیب صحیح قرار دهید ✨
          </div>
          
          <div class="ordering-container">
            <div class="drop-zones">
              <div 
                v-for="position in ['top', 'middle', 'bottom']"
                :key="position"
                class="drop-zone"
                :data-position="position"
                @drop="onDrop($event, position)"
                @dragover.prevent
              >
                <span class="zone-label">{{ positionLabels[position] }}</span>
                <div class="zone-content">
                  <span v-if="droppedWords[position]">{{ droppedWords[position] }}</span>
                </div>
              </div>
            </div>
            
            <div class="words-pool">
              <div 
                v-for="word in availableWords"
                :key="word"
                class="word-card"
                draggable="true"
                @dragstart="onDragStart($event, word)"
              >
                <span class="word-text">{{ word }}</span>
              </div>
            </div>
          </div>
          
          <button @click="submitOrder" class="submit-button" aria-label="تأیید ترتیب">
            <span class="button-text">تأیید ترتیب</span>
            <span class="button-icon">✓</span>
          </button>
        </div>
      </div>
      
      <div v-if="feedbackMessage" class="feedback" :class="feedbackClass">
        {{ feedbackMessage }}
      </div>
      <canvas ref="confettiCanvas" id="confetti-canvas"></canvas>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';

// Set page metadata
useHead({
  title: 'آینه - Mini Game Mirror',
  meta: [
    { name: 'description', content: 'بازی آینه - حل معمای کلمات' }
  ]
});

// Load the full game.js implementation
useScript('/minigames/minigame-mirror/game.js', {
  defer: true
});

onMounted(() => {
  if (!process.client) return;
  console.log('✅ Mirror minigame page mounted - game.js loading');
});

onUnmounted(() => {
  console.log('Mirror minigame unmounted');
});
</script>

<style lang="scss">
@import '@/assets/scss/minigame-mirror.scss';

.minigame-mirror {
  width: 100%;
  height: 100vh;
}
</style>
