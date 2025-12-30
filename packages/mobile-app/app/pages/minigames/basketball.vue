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

// Refs
const courtCanvas = ref(null);
const confettiCanvas = ref(null);
const digits = ref([0, 0, 0, 0, 0]);
const selectedDigitIndex = ref(0);
const feedbackMessage = ref('');
const feedbackClass = ref('');

// Game logic - simplified version
// In production, this would include the full canvas drawing logic from game.js
let ctx = null;
let resizeHandler = null;

function resizeCourtCanvas() {
  const canvas = courtCanvas.value;
  if (!canvas) return;

  // Match the canvas resolution to its displayed size
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  // Reacquire context in case canvas was resized
  ctx = canvas.getContext('2d');

  // Redraw the court with the new dimensions
  drawCourt();
}

onMounted(() => {
  if (!process.client) return;

  // Initialize canvas
  if (courtCanvas.value) {
    // Initial sizing and draw
    resizeCourtCanvas();

    // Update canvas size and redraw on window resize
    resizeHandler = () => {
      resizeCourtCanvas();
    };
    window.addEventListener('resize', resizeHandler);
  }

  // Set up digit selection
  setupDigitSelection();
});

onUnmounted(() => {
  if (!process.client) return;
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler);
    resizeHandler = null;
  }
});
function drawCourt() {
  if (!ctx) return;
  
  const canvas = courtCanvas.value;
  const width = canvas.width;
  const height = canvas.height;
  
  // Draw court background
  ctx.fillStyle = '#2c5f2d';
  ctx.fillRect(0, 0, width, height);
  
  // Draw court lines (simplified)
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, width - 40, height - 40);
  
  // Draw center circle
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, 50, 0, Math.PI * 2);
  ctx.stroke();
  
  // Draw three-point line (simplified)
  ctx.strokeStyle = '#ff6b35';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(width / 2, 50, 100, 0, Math.PI);
  ctx.stroke();
}

function setupDigitSelection() {
  const digitElements = document.querySelectorAll('.digit');
  digitElements.forEach((el, index) => {
    el.addEventListener('click', () => {
      selectedDigitIndex.value = index;
      // Remove active class from all
      digitElements.forEach(d => d.classList.remove('active'));
      // Add active class to selected
      el.classList.add('active');
    });
  });
}

function increaseDigit() {
  const index = selectedDigitIndex.value;
  digits.value[index] = (digits.value[index] + 1) % 10;
  updateSevenSegmentDisplay(index, digits.value[index]);
}

function decreaseDigit() {
  const index = selectedDigitIndex.value;
  digits.value[index] = (digits.value[index] - 1 + 10) % 10;
  updateSevenSegmentDisplay(index, digits.value[index]);
}

function updateSevenSegmentDisplay(index, value) {
  // Defer DOM update to ensure Vue has applied its own DOM changes first
  setTimeout(() => {
    const digit = document.querySelector(`.digit[data-index="${index}"]`);
    if (digit) {
      digit.setAttribute('data-value', value);
    }
  }, 0);
}

function submitAnswer() {
  const answer = digits.value.join('');
  console.log('Submitted answer:', answer);
  
  // In production, this would check against the correct answer
  // For now, show success message
  feedbackMessage.value = 'پاسخ شما ثبت شد!';
  feedbackClass.value = 'success';
  
  setTimeout(() => {
    feedbackMessage.value = '';
  }, 3000);
}

onUnmounted(() => {
  // Cleanup
  ctx = null;
});
</script>

<style lang="scss" scoped>
@import '@/assets/scss/minigame-basketball.scss';

.minigame-basketball {
  width: 100%;
  height: 100vh;
}
</style>
