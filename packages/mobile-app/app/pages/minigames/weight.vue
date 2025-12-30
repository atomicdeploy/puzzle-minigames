<template>
  <div class="minigame-weight">
    <div id="game-container">
      <header>
        <h1>🎮 وزن توپ سفید ⚖️</h1>
      </header>
      
      <div id="canvas-container">
        <canvas id="physics-canvas" ref="physicsCanvas"></canvas>
      </div>
      
      <div id="question-panel">
        <div class="question-text">
          <span class="ball-emoji">⚪</span> = 
          <span class="question-mark">❓</span>
        </div>
        
        <div class="input-group">
          <label for="answer-input">وزن توپ سفید را وارد کنید:</label>
          <input 
            v-model.number="answer"
            type="number" 
            id="answer-input" 
            placeholder="عدد را وارد کنید"
            inputmode="numeric"
            aria-label="پاسخ خود را به صورت عددی وارد کنید"
            @keyup.enter="submitAnswer"
          >
          <button @click="submitAnswer" class="submit-button" aria-label="تأیید پاسخ">
            تأیید
          </button>
        </div>
        
        <div id="hint-text">
          ترازو را تعادل نگه دارید و وزن توپ سفید را حدس بزنید
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
  title: 'وزن توپ سفید - Mini Game',
  meta: [
    { name: 'description', content: 'بازی وزن توپ سفید - حل معمای فیزیک' }
  ]
});

// Load the full game.js implementation
useScript('/minigames/minigame-weight/game.js', {
  defer: true
});

onMounted(() => {
  if (!process.client) return;
  console.log('✅ Weight minigame page mounted - game.js loading');
});

onUnmounted(() => {
  console.log('Weight minigame unmounted');
});
</script>

<style lang="scss">
@import '@/assets/scss/minigame-weight.scss';

.minigame-weight {
  width: 100%;
  height: 100vh;
}
</style>
