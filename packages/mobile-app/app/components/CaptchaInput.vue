<template>
  <div class="captcha-container" :class="{ 'captcha-error': hasError, 'captcha-success': isVerified }">
    <div class="captcha-wrapper">
      <!-- CAPTCHA Image Display -->
      <div class="captcha-image-container">
        <div v-if="loading" class="captcha-loading">
          <div class="loading-spinner"></div>
          <p>در حال بارگذاری کپچا...</p>
        </div>
        
        <div v-else-if="captchaImage" class="captcha-image-wrapper">
          <img 
            :src="captchaImage" 
            alt="CAPTCHA" 
            class="captcha-image"
            @load="onImageLoad"
          />
          <button 
            type="button"
            class="captcha-refresh-btn" 
            @click="refreshCaptcha"
            :disabled="loading"
            aria-label="تازه‌سازی کپچا"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 4v6h-6M1 20v-6h6"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </button>
        </div>
        
        <div v-else class="captcha-error-state">
          <p>خطا در بارگذاری کپچا</p>
          <button 
            type="button"
            class="btn-retry" 
            @click="loadCaptcha"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
      
      <!-- CAPTCHA Input Field -->
      <div class="captcha-input-container">
        <label for="captcha-input" class="captcha-label">
          کد تصویر را وارد کنید:
          <span class="captcha-hint">(حروف و اعداد مشابه یکسان محسوب می‌شوند)</span>
        </label>
        <div class="captcha-input-wrapper">
          <input
            id="captcha-input"
            ref="captchaInputRef"
            v-model="captchaInput"
            type="text"
            class="captcha-input"
            :placeholder="placeholder"
            :disabled="loading || isVerified"
            :maxlength="8"
            autocomplete="off"
            spellcheck="false"
            @input="onInput"
            @keyup.enter="$emit('verify', captchaInput)"
          />
          <div v-if="isVerified" class="input-checkmark">
            ✓
          </div>
        </div>
        
        <!-- Feedback Messages -->
        <transition name="fade">
          <div v-if="feedbackMessage" class="captcha-feedback" :class="feedbackClass">
            {{ feedbackMessage }}
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

// Props
const props = defineProps<{
  apiBaseUrl?: string
  autoLoad?: boolean
  placeholder?: string
  showHints?: boolean
}>()

// Emits
const emit = defineEmits<{
  verify: [code: string]
  captchaLoaded: []
  captchaError: [error: string]
  inputChange: [value: string]
}>()

// Refs
const captchaImage = ref<string>('')
const captchaInput = ref<string>('')
const loading = ref<boolean>(false)
const hasError = ref<boolean>(false)
const isVerified = ref<boolean>(false)
const feedbackMessage = ref<string>('')
const feedbackClass = ref<string>('')
const captchaInputRef = ref<HTMLInputElement>()

// Default values
const baseUrl = props.apiBaseUrl || '/api/captcha'
const placeholderText = props.placeholder || 'کد تصویر'

/**
 * Load CAPTCHA from backend
 */
async function loadCaptcha() {
  loading.value = true
  hasError.value = false
  feedbackMessage.value = ''
  
  try {
    const response = await fetch(`${baseUrl}/generate`, {
      method: 'GET',
      credentials: 'include', // Include session cookies
    })
    
    if (!response.ok) {
      throw new Error('Failed to load CAPTCHA')
    }
    
    const data = await response.json()
    
    if (data.success && data.image) {
      captchaImage.value = data.image
      emit('captchaLoaded')
    } else {
      throw new Error('Invalid CAPTCHA response')
    }
  } catch (error) {
    hasError.value = true
    const errorMsg = 'خطا در بارگذاری کپچا'
    feedbackMessage.value = errorMsg
    feedbackClass.value = 'error'
    emit('captchaError', errorMsg)
    console.error('Error loading CAPTCHA:', error)
  } finally {
    loading.value = false
  }
}

/**
 * Refresh CAPTCHA
 */
async function refreshCaptcha() {
  captchaInput.value = ''
  isVerified.value = false
  hasError.value = false
  feedbackMessage.value = ''
  await loadCaptcha()
}

/**
 * Handle image load
 */
function onImageLoad() {
  // Focus input after image loads
  if (captchaInputRef.value) {
    setTimeout(() => {
      captchaInputRef.value?.focus()
    }, 100)
  }
}

/**
 * Handle input change
 */
function onInput() {
  hasError.value = false
  feedbackMessage.value = ''
  emit('inputChange', captchaInput.value)
}

/**
 * Set verification status (called from parent)
 */
function setVerified(verified: boolean, message?: string) {
  isVerified.value = verified
  
  if (verified) {
    feedbackMessage.value = message || 'کپچا تأیید شد ✓'
    feedbackClass.value = 'success'
  } else {
    hasError.value = true
    feedbackMessage.value = message || 'کد وارد شده اشتباه است'
    feedbackClass.value = 'error'
    // Clear input on error
    captchaInput.value = ''
    // Reload CAPTCHA
    setTimeout(() => {
      refreshCaptcha()
    }, 1500)
  }
}

/**
 * Get current input value
 */
function getValue(): string {
  return captchaInput.value
}

/**
 * Clear input
 */
function clear() {
  captchaInput.value = ''
  isVerified.value = false
  hasError.value = false
  feedbackMessage.value = ''
}

// Expose methods for parent component
defineExpose({
  loadCaptcha,
  refreshCaptcha,
  setVerified,
  getValue,
  clear,
})

// Auto-load on mount
onMounted(() => {
  if (props.autoLoad !== false) {
    loadCaptcha()
  }
})
</script>

<style scoped lang="scss">
.captcha-container {
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
  border-radius: 16px;
  background: linear-gradient(135deg, #1a1f3a 0%, #0a0e27 100%);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  transition: all 0.3s ease;
  
  &.captcha-error {
    animation: shake 0.5s ease;
    box-shadow: 0 8px 32px rgba(255, 0, 110, 0.3);
  }
  
  &.captcha-success {
    box-shadow: 0 8px 32px rgba(0, 245, 255, 0.3);
  }
}

.captcha-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

// Image Container
.captcha-image-container {
  position: relative;
  min-height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.02);
}

.captcha-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: #00d9ff;
  
  p {
    font-size: 14px;
    margin: 0;
  }
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 217, 255, 0.2);
  border-top-color: #00d9ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.captcha-image-wrapper {
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
}

.captcha-image {
  max-width: 100%;
  height: auto;
  display: block;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 245, 255, 0.1);
  animation: fadeIn 0.5s ease;
}

.captcha-refresh-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 217, 255, 0.2);
  color: #00d9ff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  
  &:hover:not(:disabled) {
    background: rgba(0, 217, 255, 0.3);
    transform: rotate(180deg);
  }
  
  &:active:not(:disabled) {
    transform: rotate(180deg) scale(0.9);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
}

.captcha-error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #ff006e;
  padding: 20px;
  
  p {
    margin: 0;
    font-size: 14px;
  }
  
  .btn-retry {
    padding: 8px 20px;
    border: 2px solid #ff006e;
    border-radius: 8px;
    background: transparent;
    color: #ff006e;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      background: #ff006e;
      color: white;
    }
  }
}

// Input Container
.captcha-input-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.captcha-label {
  font-size: 14px;
  color: #00d9ff;
  font-weight: 600;
  display: flex;
  flex-direction: column;
  gap: 4px;
  
  .captcha-hint {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
    font-weight: 400;
  }
}

.captcha-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.captcha-input {
  width: 100%;
  padding: 14px 48px 14px 16px;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(0, 217, 255, 0.3);
  border-radius: 12px;
  outline: none;
  transition: all 0.3s ease;
  font-family: 'Courier New', monospace;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
    letter-spacing: normal;
  }
  
  &:focus {
    border-color: #00d9ff;
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 0 20px rgba(0, 217, 255, 0.2);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.input-checkmark {
  position: absolute;
  right: 16px;
  font-size: 24px;
  color: #00f5ff;
  animation: scaleIn 0.3s ease;
}

// Feedback
.captcha-feedback {
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  
  &.success {
    background: rgba(0, 245, 255, 0.1);
    color: #00f5ff;
    border: 1px solid rgba(0, 245, 255, 0.3);
  }
  
  &.error {
    background: rgba(255, 0, 110, 0.1);
    color: #ff006e;
    border: 1px solid rgba(255, 0, 110, 0.3);
  }
}

// Animations
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

// Responsive
@media (max-width: 600px) {
  .captcha-container {
    padding: 16px;
  }
  
  .captcha-input {
    font-size: 16px;
    padding: 12px 40px 12px 12px;
  }
}
</style>
