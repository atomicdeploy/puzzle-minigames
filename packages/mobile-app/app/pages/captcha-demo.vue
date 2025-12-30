<template>
  <div class="captcha-demo-page">
    <div class="demo-header">
      <h1>🔐 نمایش کپچای اینفرنال</h1>
      <p class="subtitle">سیستم تأیید هوشمند و زیبا</p>
    </div>

    <div class="demo-container">
      <!-- Main CAPTCHA Component -->
      <CaptchaInput 
        ref="captchaRef"
        :api-base-url="captchaApiUrl"
        :auto-load="true"
        placeholder="کد تصویر را وارد کنید"
        @verify="handleVerify"
        @captchaLoaded="onCaptchaLoaded"
        @inputChange="onInputChange"
      />

      <!-- Verify Button -->
      <div class="demo-actions">
        <button 
          class="btn-demo btn-verify" 
          @click="verifyCaptcha"
          :disabled="isVerifying"
        >
          {{ isVerifying ? 'در حال بررسی...' : 'تأیید کپچا' }}
        </button>
        <button 
          class="btn-demo btn-refresh" 
          @click="refreshCaptcha"
        >
          🔄 کپچای جدید
        </button>
      </div>

      <!-- Features List -->
      <div class="features-section">
        <h2>✨ ویژگی‌های کپچا</h2>
        <ul class="features-list">
          <li>
            <span class="feature-icon">🎨</span>
            <div>
              <strong>طراحی زیبا و جذاب</strong>
              <p>رنگ‌های زنده و افکت‌های نورانی در حالت تاریک</p>
            </div>
          </li>
          <li>
            <span class="feature-icon">📴</span>
            <div>
              <strong>کاملاً آفلاین</strong>
              <p>تولید شده در سمت سرور، بدون نیاز به سرویس خارجی</p>
            </div>
          </li>
          <li>
            <span class="feature-icon">🔤</span>
            <div>
              <strong>حساس به بزرگی و کوچکی حروف نیست</strong>
              <p>می‌توانید با حروف کوچک یا بزرگ بنویسید</p>
            </div>
          </li>
          <li>
            <span class="feature-icon">🔀</span>
            <div>
              <strong>حروف مشابه یکسان هستند</strong>
              <p>0 و o، 1 و i و l، 7 و 1 و... با هم یکسان محسوب می‌شوند</p>
            </div>
          </li>
          <li>
            <span class="feature-icon">📱</span>
            <div>
              <strong>واکنش‌گرا</strong>
              <p>در همه اندازه صفحات به خوبی کار می‌کند</p>
            </div>
          </li>
          <li>
            <span class="feature-icon">🎯</span>
            <div>
              <strong>کیفیت بالا (HD)</strong>
              <p>SVG با کیفیت بالا و قابل مقیاس</p>
            </div>
          </li>
        </ul>
      </div>

      <!-- Examples Section -->
      <div class="examples-section">
        <h2>🧪 مثال‌های مشابه بودن حروف</h2>
        <div class="examples-grid">
          <div class="example-card">
            <div class="example-chars">0 = o = O</div>
            <p>صفر و حرف o یکسان هستند</p>
          </div>
          <div class="example-card">
            <div class="example-chars">1 = i = I = l = L</div>
            <p>یک و حروف i و l یکسان هستند</p>
          </div>
          <div class="example-card">
            <div class="example-chars">7 = 1</div>
            <p>هفت و یک می‌توانند یکسان باشند</p>
          </div>
          <div class="example-card">
            <div class="example-chars">z = Z = 2</div>
            <p>z و 2 یکسان هستند</p>
          </div>
          <div class="example-card">
            <div class="example-chars">s = S = 5</div>
            <p>s و 5 یکسان هستند</p>
          </div>
          <div class="example-card">
            <div class="example-chars">b = B = 8</div>
            <p>b و 8 یکسان هستند</p>
          </div>
        </div>
      </div>

      <!-- Test Results -->
      <div v-if="testResults.length > 0" class="test-results">
        <h2>📊 نتایج تست‌ها</h2>
        <div class="results-list">
          <div 
            v-for="(result, index) in testResults" 
            :key="index"
            class="result-item"
            :class="{ 'result-success': result.success, 'result-error': !result.success }"
          >
            <span class="result-icon">{{ result.success ? '✓' : '✗' }}</span>
            <span class="result-message">{{ result.message }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCaptcha } from '~/composables/useCaptcha'
import CaptchaInput from '~/components/CaptchaInput.vue'

// Set page metadata
useHead({
  title: 'نمایش کپچای اینفرنال',
  meta: [
    { name: 'description', content: 'نمایش سیستم کپچای زیبا و هوشمند اینفرنال' }
  ]
})

// Refs
const captchaRef = ref(null)
const captchaApiUrl = '/api/captcha'
const { verifyCaptcha: verifyWithBackend, isVerifying } = useCaptcha(captchaApiUrl)
const testResults = ref<Array<{ success: boolean; message: string }>>([])

/**
 * Handle CAPTCHA verification
 */
async function verifyCaptcha() {
  const captchaCode = captchaRef.value?.getValue()
  
  if (!captchaCode) {
    addTestResult(false, 'لطفاً کد کپچا را وارد کنید')
    return
  }

  const isValid = await verifyWithBackend(captchaCode)
  
  if (isValid) {
    captchaRef.value?.setVerified(true, 'کپچا با موفقیت تأیید شد! ✓')
    addTestResult(true, `کد "${captchaCode}" صحیح بود!`)
  } else {
    captchaRef.value?.setVerified(false, 'کد کپچا اشتباه است')
    addTestResult(false, `کد "${captchaCode}" اشتباه بود`)
  }
}

/**
 * Handle verify event from component
 */
function handleVerify() {
  verifyCaptcha()
}

/**
 * Refresh CAPTCHA
 */
function refreshCaptcha() {
  captchaRef.value?.refreshCaptcha()
  addTestResult(true, 'کپچای جدید بارگذاری شد')
}

/**
 * Handle CAPTCHA loaded
 */
function onCaptchaLoaded() {
  console.log('CAPTCHA loaded successfully')
}

/**
 * Handle input change
 */
function onInputChange(value: string) {
  console.log('CAPTCHA input:', value)
}

/**
 * Add test result
 */
function addTestResult(success: boolean, message: string) {
  testResults.value.unshift({ success, message })
  // Keep only last 10 results
  if (testResults.value.length > 10) {
    testResults.value.pop()
  }
}
</script>

<style scoped lang="scss">
.captcha-demo-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%);
  padding: 40px 20px;
  color: #ffffff;
  font-family: 'Vazirmatn', sans-serif;
  direction: rtl;
}

.demo-header {
  text-align: center;
  margin-bottom: 50px;
  
  h1 {
    font-size: 42px;
    margin: 0;
    background: linear-gradient(135deg, #00f5ff 0%, #ff006e 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    filter: drop-shadow(0 0 20px rgba(0, 245, 255, 0.3));
  }
  
  .subtitle {
    font-size: 18px;
    color: rgba(255, 255, 255, 0.7);
    margin-top: 10px;
  }
}

.demo-container {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.demo-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-demo {
  padding: 14px 32px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  &.btn-verify {
    background: linear-gradient(135deg, #00f5ff 0%, #00d9ff 100%);
    color: #0a0e27;
    box-shadow: 0 4px 20px rgba(0, 245, 255, 0.3);
    
    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 25px rgba(0, 245, 255, 0.5);
    }
    
    &:active:not(:disabled) {
      transform: translateY(0);
    }
  }
  
  &.btn-refresh {
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
    border: 2px solid rgba(255, 255, 255, 0.2);
    
    &:hover {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.3);
    }
  }
}

// Features Section
.features-section {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  padding: 30px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  h2 {
    font-size: 28px;
    margin: 0 0 24px 0;
    color: #00d9ff;
  }
}

.features-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
  
  li {
    display: flex;
    gap: 16px;
    align-items: start;
    padding: 16px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 12px;
    transition: all 0.3s ease;
    
    &:hover {
      background: rgba(255, 255, 255, 0.05);
      transform: translateX(-5px);
    }
  }
  
  .feature-icon {
    font-size: 28px;
    flex-shrink: 0;
  }
  
  strong {
    display: block;
    font-size: 18px;
    color: #00f5ff;
    margin-bottom: 4px;
  }
  
  p {
    margin: 0;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
    line-height: 1.6;
  }
}

// Examples Section
.examples-section {
  h2 {
    font-size: 28px;
    margin: 0 0 24px 0;
    color: #ff006e;
    text-align: center;
  }
}

.examples-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.example-card {
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 0, 110, 0.3);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: rgba(255, 0, 110, 0.6);
    transform: scale(1.05);
    box-shadow: 0 8px 20px rgba(255, 0, 110, 0.2);
  }
  
  .example-chars {
    font-size: 20px;
    font-weight: bold;
    color: #ffbe0b;
    margin-bottom: 12px;
    font-family: 'Courier New', monospace;
  }
  
  p {
    margin: 0;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.7);
  }
}

// Test Results
.test-results {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  padding: 30px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  h2 {
    font-size: 28px;
    margin: 0 0 20px 0;
    color: #8338ec;
  }
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  animation: slideIn 0.3s ease;
  
  &.result-success {
    background: rgba(0, 245, 255, 0.1);
    border: 1px solid rgba(0, 245, 255, 0.3);
    
    .result-icon {
      color: #00f5ff;
    }
  }
  
  &.result-error {
    background: rgba(255, 0, 110, 0.1);
    border: 1px solid rgba(255, 0, 110, 0.3);
    
    .result-icon {
      color: #ff006e;
    }
  }
  
  .result-icon {
    font-weight: bold;
    font-size: 18px;
  }
  
  .result-message {
    flex: 1;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

// Responsive
@media (max-width: 768px) {
  .demo-header h1 {
    font-size: 32px;
  }
  
  .features-section,
  .test-results {
    padding: 20px;
  }
  
  .examples-grid {
    grid-template-columns: 1fr;
  }
}
</style>
