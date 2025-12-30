<template>
  <div class="minigame-basketball">
    <div id="game-container">
      <header>
        <h1>🏀 رد نهان 👣</h1>
      </header>
      
      <div id="instructions-panel">
        <div class="instruction-card">
          <h2>📋 راهنمای بازی</h2>
          <div class="instruction-content">
            <p>🔍 <strong>بازی نهان:</strong> باید رد پا‌ها را دنبال کنید تا امتیاز درست را تشخیص دهید</p>
            <p>📏 <strong>قانون اول:</strong> به ازای هر یک قدم، یک متر</p>
            <p>⭐ <strong>قانون دوم:</strong> به اندازهٔ هر ۱ متر، یک امتیاز</p>
            <p>🟠 <strong>نقطهٔ شروع:</strong> خط نارنجی که زیر تور قرار دارد، نقطهٔ صفر است</p>
            <p>🧩 <strong>هدف:</strong> ترتیب حرکت را پیدا کنید و اعداد نهایی را به‌دست آورید</p>
          </div>
        </div>
      </div>
      
      <div id="court-container">
        <div id="radar-effect"></div>
        <canvas id="basketball-court" ref="courtCanvas"></canvas>
        <div id="footsteps-layer"></div>
      </div>
      
      <div id="answer-panel">
        <div class="scoreboard-container">
          <div class="scoreboard-label">امتیاز‌ها:</div>
          <div id="seven-segment-display" class="seven-segment-display">
            <div v-for="i in 5" :key="i" class="digit-container">
              <div class="digit" :data-value="digits[i-1]" :data-index="i-1">
                <div class="segment seg-a"></div>
                <div class="segment seg-b"></div>
                <div class="segment seg-c"></div>
                <div class="segment seg-d"></div>
                <div class="segment seg-e"></div>
                <div class="segment seg-f"></div>
                <div class="segment seg-g"></div>
              </div>
              <div class="digit-label">{{ ['۱', '۲', '۳', '۴', '۵'][i-1] }}</div>
            </div>
          </div>
          <div class="score-controls">
            <button class="control-btn" @click="decreaseDigit" aria-label="کاهش امتیاز">−</button>
            <button class="control-btn" @click="increaseDigit" aria-label="افزایش امتیاز">+</button>
          </div>
        </div>
        
        <button id="submit-btn" class="submit-button" @click="submitAnswer" aria-label="ثبت امتیاز">
          <span class="btn-icon">✓</span>
          <span class="btn-text">ثبت امتیاز</span>
        </button>
        
        <div id="hint-text">
          برای وارد کردن هر عدد روی اون بزنید و از کلید‌های + و - استفاده کنید
        </div>
      </div>
      
      <div v-if="feedbackMessage" id="feedback" class="feedback" :class="feedbackClass">
        {{ feedbackMessage }}
      </div>
      <canvas id="confetti-canvas" ref="confettiCanvas"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

// Set page metadata
useHead({
  title: 'رد نهان - Mini Game Basketball',
  meta: [
    { name: 'description', content: 'بازی رد نهان - پیدا کردن مسیر حرکت' }
  ]
});

// Load the full game.js implementation
useScript('/minigames/minigame-basketball/game.js', {
  defer: true
});

onMounted(() => {
  if (!process.client) return;
  
  console.log('✅ Basketball minigame page mounted - game.js should be loading');
});

onUnmounted(() => {
  console.log('Basketball minigame unmounted');
});
</script>


<style lang="scss">
@import '@/assets/scss/minigame-basketball.scss';
</style>
