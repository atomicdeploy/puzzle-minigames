<template>
  <div class="minigame-access-page">
    <!-- Loading State -->
    <div v-if="currentState === 'loading'" class="state-container">
      <div class="content">
        <div class="spinner-large"></div>
        <h1>در حال بررسی دسترسی...</h1>
        <p>لطفاً صبر کنید</p>
      </div>
    </div>

    <!-- Access Granted State -->
    <div v-else-if="currentState === 'access-granted'" class="state-container">
      <div class="content success-content">
        <div class="icon-large">✅</div>
        <h1>دسترسی تأیید شد!</h1>
        <div class="game-info">
          <p class="game-number">مینی‌گیم شماره <span>{{ gameNumber }}</span></p>
          <p class="game-description">{{ gameDescription }}</p>
        </div>
        <button @click="startGame" class="btn-primary btn-large">
          🎮 شروع بازی
        </button>
        <div class="token-info">
          <small>توکن شما: <code>{{ token }}</code></small>
        </div>
      </div>
    </div>

    <!-- Access Denied State -->
    <div v-else-if="currentState === 'access-denied'" class="state-container">
      <div class="content error-content">
        <div class="icon-large">❌</div>
        <h1>دسترسی رد شد</h1>
        <div class="error-details">
          <p>{{ errorMessage }}</p>
        </div>
        <div class="error-reasons">
          <h3>دلایل احتمالی:</h3>
          <ul>
            <li>کد QR اشتباه اسکن شده است</li>
            <li>توکن دسترسی نامعتبر است</li>
            <li>پارامترهای URL ناقص یا اشتباه هستند</li>
            <li>این کد قبلاً استفاده شده است</li>
          </ul>
        </div>
        <button @click="retry" class="btn-secondary btn-large">
          🔄 تلاش مجدد
        </button>
        <NuxtLink to="/" class="link-home">بازگشت به صفحه اصلی</NuxtLink>
      </div>
    </div>

    <!-- Invalid URL State -->
    <div v-else-if="currentState === 'invalid-url'" class="state-container">
      <div class="content error-content">
        <div class="icon-large">⚠️</div>
        <h1>آدرس نامعتبر</h1>
        <p>لطفاً از کد QR معتبر برای دسترسی استفاده کنید.</p>
        <div class="info-box">
          <p>برای دسترسی به مینی‌گیم، باید:</p>
          <ul>
            <li>کد QR مربوطه را اسکن کنید</li>
            <li>یا لینک صحیح را دریافت کنید</li>
          </ul>
        </div>
        <NuxtLink to="/" class="btn-primary btn-large">بازگشت به صفحه اصلی</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// Set page metadata
useHead({
  title: 'دسترسی به مینی‌گیم',
  meta: [
    { name: 'description', content: 'دسترسی به مینی‌گیم' }
  ]
});

const route = useRoute();
const router = useRouter();

// Timing constants
const VALIDATION_DELAYS = {
  INVALID_URL: 1000,
  VALIDATION_CHECK: 1000,
  ACCESS_GRANT: 1500,
};

// Reactive state
const currentState = ref('loading');
const gameNumber = ref('');
const gameDescription = ref('آماده شروید؟');
const token = ref('');
const errorMessage = ref('کد QR نامعتبر است یا دسترسی شما منقضی شده است.');

// Helper functions
function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

function isValidGameNumber(num) {
  const n = parseInt(num);
  return !isNaN(n) && n >= 1 && n <= 9;
}

function getGameDescription(num) {
  const descriptions = {
    1: 'پازل منطقی - سطح ساده',
    2: 'معمای کلمات - سطح متوسط',
    3: 'بازی حافظه - سطح ساده',
    4: 'پازل تصویری - سطح سخت',
    5: 'معمای ریاضی - سطح متوسط',
    6: 'بازی پیدا کردن تفاوت - سطح ساده',
    7: 'معمای منطقی - سطح سخت',
    8: 'پازل سودوکو - سطح متوسط',
    9: 'بازی نهایی - سطح خیلی سخت'
  };
  return descriptions[num] || 'مینی‌گیم جذاب';
}

async function verifyToken(gameNum, tokenValue) {
  // Optional: keep a small artificial delay for UX consistency
  await new Promise(resolve => setTimeout(resolve, 500));

  const accessKey = `minigame_access_${gameNum}`;
  const accessData = {
    token: tokenValue,
    timestamp: new Date().toISOString(),
    gameNumber: gameNum
  };

  try {
    // First, ask the backend to verify that this token is valid for the given game
    const response = await fetch('/api/minigame/verify-access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        gameNumber: gameNum,
        token: tokenValue
      })
    });

    // If the request itself failed (e.g. 4xx/5xx), treat as invalid
    if (!response.ok) {
      console.error('Token verification failed with status:', response.status);
      return false;
    }

    const data = await response.json();

    // Expect backend to return an object like: { valid: boolean, ... }
    if (!data || data.valid !== true) {
      return false;
    }

    // Only after successful verification, store access data locally as a cache
    try {
      const existingAccess = localStorage.getItem(accessKey);
      if (existingAccess) {
        const existing = JSON.parse(existingAccess);
        if (existing.token === tokenValue) {
          return true;
        }
      }
      localStorage.setItem(accessKey, JSON.stringify(accessData));
    } catch (storageError) {
      console.error('Error storing access data:', storageError);
      // Storage failure should not grant access if verification failed,
      // but at this point verification already succeeded, so still allow.
    }

    return true;
  } catch (e) {
    // Network or unexpected errors: do NOT silently grant access
    console.error('Error verifying token:', e);
    return false;
  }
}

async function validateAccess() {
  const params = route.query;

  // Check if URL has required parameters
  if (!params.game || !params.token) {
    setTimeout(() => {
      currentState.value = 'invalid-url';
    }, VALIDATION_DELAYS.INVALID_URL);
    return;
  }

  // Validate game number
  if (!isValidGameNumber(params.game)) {
    setTimeout(() => {
      currentState.value = 'access-denied';
      errorMessage.value = 'شماره مینی‌گیم نامعتبر است. شماره باید بین 1 تا 9 باشد.';
    }, VALIDATION_DELAYS.VALIDATION_CHECK);
    return;
  }

  // Validate token format (UUID v4)
  if (!isValidUUID(params.token)) {
    setTimeout(() => {
      currentState.value = 'access-denied';
      errorMessage.value = 'فرمت توکن دسترسی نامعتبر است. لطفاً از کد QR معتبر استفاده کنید.';
    }, VALIDATION_DELAYS.VALIDATION_CHECK);
    return;
  }

  const isValid = await verifyToken(params.game, params.token);

  setTimeout(() => {
    if (isValid) {
      currentState.value = 'access-granted';
      gameNumber.value = params.game;
      gameDescription.value = getGameDescription(params.game);
      token.value = params.token;
    } else {
      currentState.value = 'access-denied';
    }
  }, VALIDATION_DELAYS.ACCESS_GRANT);
}

function startGame() {
  if (process.client) {
    sessionStorage.setItem('currentGameToken', token.value);
    sessionStorage.setItem('currentGameNumber', gameNumber.value);
  }
  
  router.push({
    path: '/',
    query: {
      unlock: gameNumber.value,
      token: token.value
    }
  });
}

function retry() {
  if (process.client) {
    location.reload();
  }
}

onMounted(() => {
  validateAccess();
});
</script>

<style lang="scss" scoped>
@import '@/assets/scss/minigame-access.scss';

.minigame-access-page {
  width: 100%;
  height: 100vh;
}
</style>
