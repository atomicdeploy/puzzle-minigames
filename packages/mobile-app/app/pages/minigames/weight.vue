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
import { ref, onMounted, onUnmounted } from 'vue';

// Set page metadata
useHead({
  title: 'وزن توپ سفید - Mini Game',
  meta: [
    { name: 'description', content: 'بازی وزن توپ سفید - حل معمای فیزیک' }
  ]
});

// State
const physicsCanvas = ref(null);
const confettiCanvas = ref(null);
const answer = ref(null);
const feedbackMessage = ref('');
const feedbackClass = ref('');

// Physics engine context
let ctx = null;
let animationId = null;

// Ball configuration
const balls = [
  { x: 100, y: 100, radius: 30, color: '#ff6b6b', weight: 5 },
  { x: 200, y: 100, radius: 25, color: '#4ecdc4', weight: 3 },
  { x: 300, y: 100, radius: 35, color: '#ffe66d', weight: 7 },
  { x: 400, y: 100, radius: 30, color: '#ffffff', weight: 4 }, // White ball - this is what player needs to find
];

const correctAnswer = 4; // Weight of white ball

onMounted(() => {
  if (!process.client) return;

  // Initialize canvas
  if (physicsCanvas.value) {
    ctx = physicsCanvas.value.getContext('2d');
    physicsCanvas.value.width = physicsCanvas.value.offsetWidth;
    physicsCanvas.value.height = physicsCanvas.value.offsetHeight;
    
    // Start animation
    animate();
  }
});

function animate() {
  if (!ctx) return;

  const canvas = physicsCanvas.value;
  const width = canvas.width;
  const height = canvas.height;

  // Clear canvas
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, width, height);

  // Draw scale/balance
  drawScale(width, height);

  // Draw balls
  balls.forEach(ball => {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw weight label
    if (ball.color !== '#ffffff') {
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${ball.weight}kg`, ball.x, ball.y + 5);
    } else {
      ctx.fillStyle = '#6c5ce7';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('?', ball.x, ball.y + 5);
    }
  });

  // Continue animation
  animationId = requestAnimationFrame(animate);
}

function drawScale(width, height) {
  const centerX = width / 2;
  const centerY = height / 2;

  // Draw scale base
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  
  // Vertical support
  ctx.beginPath();
  ctx.moveTo(centerX, centerY + 100);
  ctx.lineTo(centerX, centerY - 50);
  ctx.stroke();

  // Horizontal beam
  ctx.beginPath();
  ctx.moveTo(centerX - 150, centerY - 50);
  ctx.lineTo(centerX + 150, centerY - 50);
  ctx.stroke();

  // Left pan
  ctx.strokeStyle = '#6c5ce7';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX - 120, centerY, 50, 0, Math.PI, false);
  ctx.stroke();

  // Right pan
  ctx.beginPath();
  ctx.arc(centerX + 120, centerY, 50, 0, Math.PI, false);
  ctx.stroke();
}

function submitAnswer() {
  if (answer.value === null || answer.value === '') {
    feedbackMessage.value = 'لطفاً یک عدد وارد کنید';
    feedbackClass.value = 'error';
    setTimeout(() => {
      feedbackMessage.value = '';
    }, 2000);
    return;
  }

  if (answer.value === correctAnswer) {
    feedbackMessage.value = '✨ آفرین! پاسخ شما صحیح است';
    feedbackClass.value = 'success';
  } else {
    feedbackMessage.value = 'پاسخ اشتباه است، دوباره امتحان کنید';
    feedbackClass.value = 'error';
  }

  setTimeout(() => {
    feedbackMessage.value = '';
  }, 3000);
}

onUnmounted(() => {
  // Cleanup
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  ctx = null;
});
</script>

<style lang="scss" scoped>
@import '@/assets/scss/minigame-weight.scss';

.minigame-weight {
  width: 100%;
  height: 100vh;
}
</style>
