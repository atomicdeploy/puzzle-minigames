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
import { ref } from 'vue';

// Set page metadata
useHead({
  title: 'آینه - Mini Game Mirror',
  meta: [
    { name: 'description', content: 'بازی آینه - حل معمای کلمات' }
  ]
});

// State
const currentStage = ref(1);
const password = ref('');
const droppedWords = ref({
  top: null,
  middle: null,
  bottom: null
});
const availableWords = ref(['Zoom', 'Escape', 'Infernal']);
const draggedWord = ref(null);
const feedbackMessage = ref('');
const feedbackClass = ref('');

const positionLabels = {
  top: 'بالا',
  middle: 'وسط',
  bottom: 'پایین'
};

function submitPassword() {
  // In production, check against correct password
  const correctPassword = 'mirror'; // Example password
  
  if (password.value.toLowerCase() === correctPassword) {
    currentStage.value = 2;
  } else {
    feedbackMessage.value = 'رمز عبور اشتباه است';
    feedbackClass.value = 'error';
    setTimeout(() => {
      feedbackMessage.value = '';
    }, 2000);
  }
}

function onDragStart(event, word) {
  draggedWord.value = word;
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/html', event.target.innerHTML);
}

function onDrop(event, position) {
  event.preventDefault();
  
  if (draggedWord.value) {
    // Remove from available words
    const index = availableWords.value.indexOf(draggedWord.value);
    if (index > -1) {
      availableWords.value.splice(index, 1);
    }
    
    // If there's already a word in this position, return it to available
    if (droppedWords.value[position]) {
      availableWords.value.push(droppedWords.value[position]);
    }
    
    // Place the dragged word
    droppedWords.value[position] = draggedWord.value;
    draggedWord.value = null;
  }
}

function submitOrder() {
  // Check if all positions are filled
  if (!droppedWords.value.top || !droppedWords.value.middle || !droppedWords.value.bottom) {
    feedbackMessage.value = 'لطفاً همه جاها را پر کنید';
    feedbackClass.value = 'error';
    setTimeout(() => {
      feedbackMessage.value = '';
    }, 2000);
    return;
  }
  
  // In production, check against correct order
  const correctOrder = {
    top: 'Zoom',
    middle: 'Escape',
    bottom: 'Infernal'
  };
  
  const isCorrect = 
    droppedWords.value.top === correctOrder.top &&
    droppedWords.value.middle === correctOrder.middle &&
    droppedWords.value.bottom === correctOrder.bottom;
  
  if (isCorrect) {
    feedbackMessage.value = '✨ آفرین! پاسخ شما صحیح است';
    feedbackClass.value = 'success';
  } else {
    feedbackMessage.value = 'ترتیب اشتباه است، دوباره امتحان کنید';
    feedbackClass.value = 'error';
  }
  
  setTimeout(() => {
    feedbackMessage.value = '';
  }, 3000);
}
</script>

<style lang="scss" scoped>
@import '@/assets/scss/minigame-mirror.scss';

.minigame-mirror {
  width: 100%;
  height: 100vh;
}
</style>
