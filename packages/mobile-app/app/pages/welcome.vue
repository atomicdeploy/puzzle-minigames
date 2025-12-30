<template>
  <div class="welcome-page">
    <!-- Welcome Screen -->
    <div v-if="currentScreen === 'welcome'" class="screen active">
      <div class="welcome-content">
        <div class="logo-section">
          <h1 class="game-title">🔥 اینفرنال 🔥</h1>
          <p class="game-subtitle">اتاق فرار محیطی</p>
          <p class="event-name">رویداد بازیهای فکری دانشگاه هنر</p>
        </div>
        <button class="btn btn-primary" @click="currentScreen = 'tour'">شروع کنید</button>
      </div>
    </div>

    <!-- Tour/Guide Screen -->
    <div v-else-if="currentScreen === 'tour'" class="screen active">
      <div class="tour-content">
        <h2>🎮 راهنمای بازی</h2>
        
        <div class="tour-step">
          <div class="step-icon">🔍</div>
          <h3>کشف پازل‌ها</h3>
          <p>در محیط اطراف خود به دنبال QR کدهای مخفی بگردید</p>
        </div>

        <div class="tour-step">
          <div class="step-icon">📱</div>
          <h3>اسکن کد</h3>
          <p>با اسکن QR کد، پازل‌های پنهان را کشف کنید</p>
        </div>

        <div class="tour-step">
          <div class="step-icon">🧩</div>
          <h3>حل معما</h3>
          <p>هر پازل یک معمای جذاب دارد که باید حل کنید</p>
        </div>

        <div class="tour-step">
          <div class="step-icon">🏆</div>
          <h3>برنده شوید</h3>
          <p>با حل همه معماها، فاتح بازی شوید!</p>
        </div>

        <div class="tour-navigation">
          <button class="btn btn-secondary" @click="currentScreen = 'welcome'">بازگشت</button>
          <button class="btn btn-primary" @click="currentScreen = 'auth-choice'">متوجه شدم</button>
        </div>
      </div>
    </div>

    <!-- Auth Choice Screen -->
    <div v-else-if="currentScreen === 'auth-choice'" class="screen active">
      <div class="auth-choice-content">
        <h2>ورود به بازی</h2>
        <p class="subtitle">برای شروع بازی، لطفاً انتخاب کنید:</p>
        
        <div class="auth-buttons">
          <button class="btn btn-primary btn-large" @click="currentScreen = 'registration'">
            <span class="btn-icon">📝</span>
            ثبت نام جدید
          </button>
          <button class="btn btn-secondary btn-large" @click="currentScreen = 'signin'">
            <span class="btn-icon">🔑</span>
            ورود با حساب کاربری
          </button>
        </div>

        <button class="btn-back" @click="currentScreen = 'tour'">← بازگشت</button>
      </div>
    </div>

    <!-- Sign In Screen -->
    <div v-else-if="currentScreen === 'signin'" class="screen active">
      <div class="signin-content">
        <h2>ورود به حساب کاربری</h2>
        
        <form @submit.prevent="handleSignIn" class="auth-form">
          <div class="form-group">
            <label for="signin-phone">شماره موبایل</label>
            <input 
              v-model="signinPhone"
              type="tel" 
              id="signin-phone" 
              class="form-control" 
              placeholder="09xxxxxxxxx"
              required 
              maxlength="11" 
              pattern="^09\d{9}$"
            >
          </div>

          <button type="submit" class="btn btn-primary btn-large">ارسال کد تایید</button>
        </form>

        <button class="btn-back" @click="currentScreen = 'auth-choice'">← بازگشت</button>
      </div>
    </div>

    <!-- OTP Verification Screen (for sign in) -->
    <div v-else-if="currentScreen === 'otp-signin'" class="screen active">
      <div class="otp-content">
        <h2>تایید شماره موبایل</h2>
        <p class="subtitle">کد 6 رقمی ارسال شده به شماره {{ signinPhone }} را وارد کنید</p>
        
        <div class="otp-inputs" role="group" aria-label="6-digit one-time passcode">
          <input 
            v-for="i in 6" 
            :key="i"
            v-model="otpDigits[i-1]"
            type="text" 
            class="otp-input" 
            maxlength="1" 
            pattern="\d" 
            inputmode="numeric"
            :aria-label="`OTP digit ${i}`"
            @input="handleOTPInput($event, i-1)"
            @keydown="handleOTPKeydown($event, i-1)"
          >
        </div>

        <button @click="verifySignInOTP" class="btn btn-primary btn-large">تایید کد</button>
        <button @click="resendOTP('signin')" class="btn btn-text">ارسال مجدد کد</button>

        <button class="btn-back" @click="currentScreen = 'signin'">← بازگشت</button>
      </div>
    </div>

    <!-- Registration Screen -->
    <div v-else-if="currentScreen === 'registration'" class="screen active">
      <div class="registration-content">
        <h2>ثبت نام</h2>
        
        <form @submit.prevent="handleRegistration" class="auth-form">
          <!-- Name -->
          <div class="form-group">
            <label for="name">نام و نام خانوادگی <span class="required">*</span></label>
            <input v-model="formData.name" type="text" id="name" class="form-control" required>
          </div>

          <!-- Birthday -->
          <div class="form-group">
            <label for="birthday">تاریخ تولد <span class="required">*</span></label>
            <input v-model="formData.birthday" type="date" id="birthday" class="form-control" required>
          </div>

          <!-- Gender -->
          <div class="form-group">
            <label>جنسیت <span class="required">*</span></label>
            <div class="radio-group">
              <label class="radio-label">
                <input v-model="formData.gender" type="radio" name="gender" value="male" required>
                <span>مرد</span>
              </label>
              <label class="radio-label">
                <input v-model="formData.gender" type="radio" name="gender" value="female" required>
                <span>زن</span>
              </label>
              <label class="radio-label">
                <input v-model="formData.gender" type="radio" name="gender" value="other" required>
                <span>ترجیح می‌دهم نگویم</span>
              </label>
            </div>
          </div>

          <!-- Phone Number -->
          <div class="form-group">
            <label for="phone">شماره موبایل <span class="required">*</span></label>
            <input 
              v-model="formData.phone"
              type="tel" 
              id="phone" 
              class="form-control" 
              placeholder="09xxxxxxxxx"
              required 
              maxlength="11" 
              pattern="^09\d{9}$"
            >
          </div>

          <!-- Color Selection -->
          <div class="form-group">
            <label>رنگ مورد علاقه خود را انتخاب کنید <span class="required">*</span></label>
            <div class="color-picker">
              <input v-model="formData.color" type="radio" name="color" value="#ff6b6b" id="color1" required>
              <label for="color1" class="color-option" style="background: #ff6b6b;" aria-label="Red"></label>
              
              <input v-model="formData.color" type="radio" name="color" value="#4ecdc4" id="color2" required>
              <label for="color2" class="color-option" style="background: #4ecdc4;" aria-label="Teal"></label>
              
              <input v-model="formData.color" type="radio" name="color" value="#ffe66d" id="color3" required>
              <label for="color3" class="color-option" style="background: #ffe66d;" aria-label="Yellow"></label>
              
              <input v-model="formData.color" type="radio" name="color" value="#6c5ce7" id="color4" required>
              <label for="color4" class="color-option" style="background: #6c5ce7;" aria-label="Purple"></label>
              
              <input v-model="formData.color" type="radio" name="color" value="#fd79a8" id="color5" required>
              <label for="color5" class="color-option" style="background: #fd79a8;" aria-label="Pink"></label>
              
              <input v-model="formData.color" type="radio" name="color" value="#00b894" id="color6" required>
              <label for="color6" class="color-option" style="background: #00b894;" aria-label="Green"></label>
              
              <input v-model="formData.color" type="radio" name="color" value="#fdcb6e" id="color7" required>
              <label for="color7" class="color-option" style="background: #fdcb6e;" aria-label="Light Yellow"></label>
              
              <input v-model="formData.color" type="radio" name="color" value="#e17055" id="color8" required>
              <label for="color8" class="color-option" style="background: #e17055;" aria-label="Orange"></label>
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-large">ادامه</button>
        </form>

        <button class="btn-back" @click="currentScreen = 'auth-choice'">← بازگشت</button>
      </div>
    </div>

    <!-- OTP Verification Screen (for registration) -->
    <div v-else-if="currentScreen === 'otp-registration'" class="screen active">
      <div class="otp-content">
        <h2>تایید شماره موبایل</h2>
        <p class="subtitle">کد 6 رقمی ارسال شده به شماره {{ formData.phone }} را وارد کنید</p>
        
        <div class="otp-inputs" role="group" aria-label="6-digit one-time passcode">
          <input 
            v-for="i in 6" 
            :key="i"
            v-model="otpDigits[i-1]"
            type="text" 
            class="otp-input" 
            maxlength="1" 
            pattern="\d" 
            inputmode="numeric"
            :aria-label="`OTP digit ${i}`"
            @input="handleOTPInput($event, i-1)"
            @keydown="handleOTPKeydown($event, i-1)"
          >
        </div>

        <button @click="verifyRegistrationOTP" class="btn btn-primary btn-large">تایید و ثبت نام</button>
        <button @click="resendOTP('registration')" class="btn btn-text">ارسال مجدد کد</button>

        <button class="btn-back" @click="currentScreen = 'registration'">← بازگشت</button>
      </div>
    </div>

    <!-- Success Screen -->
    <div v-else-if="currentScreen === 'success'" class="screen active">
      <div class="success-content">
        <div class="success-icon">🎉</div>
        <h2>ثبت نام با موفقیت انجام شد!</h2>
        
        <div class="player-info">
          <div class="player-id-card">
            <div class="player-avatar">👤</div>
            <div class="player-details">
              <h3>{{ formData.name }}</h3>
              <p class="player-label">کد بازیکن</p>
              <p class="player-id">{{ playerId }}</p>
            </div>
            <div class="player-color" :style="{ background: formData.color }"></div>
          </div>
        </div>

        <div class="instructions">
          <h3>🎮 راهنمای شروع بازی</h3>
          <ul class="instruction-list">
            <li>در محیط اطراف خود به دنبال QR کدهای مخفی بگردید</li>
            <li>با اسکن هر QR کد، یک پازل جدید فعال می‌شود</li>
            <li>معماهای هر پازل را حل کنید و امتیاز کسب کنید</li>
            <li>کد بازیکن خود را برای ورود بعدی یادداشت کنید</li>
          </ul>
        </div>

        <button class="btn btn-primary btn-large" @click="startGame">شروع بازی</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useApi } from '~/composables/useApi';

// Set page metadata
useHead({
  title: 'خوش آمدید به اینفرنال',
  meta: [
    { name: 'description', content: 'اینفرنال - اتاق فرار محیطی - رویداد بازیهای فکری دانشگاه هنر' }
  ]
});

const router = useRouter();
const api = useApi();

// State
const currentScreen = ref('welcome');
const signinPhone = ref('');
const playerId = ref('');
const profilePicturePreview = ref(null);
const otpDigits = ref(['', '', '', '', '', '']);

const formData = ref({
  name: '',
  birthday: '',
  gender: '',
  educationLevel: '',
  fieldOfStudy: '',
  phone: '',
  color: '',
  profilePicture: null
});

// Check if user is already logged in
onMounted(async () => {
  if (!process.client) return;

  const authToken = localStorage.getItem('auth-token');
  const cachedUser = localStorage.getItem('infernal-current-user');
  
  if (authToken && cachedUser) {
    try {
      const userData = JSON.parse(cachedUser);
      
      // Try to get fresh data from backend
      try {
        const response = await api.getUserProfile();
        if (response.success && response.user) {
          localStorage.setItem('infernal-current-user', JSON.stringify(response.user));
          router.push('/');
          return;
        }
      } catch (error) {
        console.warn('Could not verify user with backend, using cached data', error);
      }
      
      // Use cached data
      router.push('/');
      return;
    } catch (error) {
      console.error('Failed to parse user data:', error);
      localStorage.removeItem('auth-token');
      localStorage.removeItem('infernal-current-user');
    }
  }
});

// Validate phone number
function validatePhoneNumber(phone) {
  const phoneRegex = /^09\d{9}$/;
  return phoneRegex.test(phone);
}

// Handle sign in
async function handleSignIn() {
  if (!validatePhoneNumber(signinPhone.value)) {
    alert('شماره موبایل معتبر نیست');
    return;
  }

  try {
    const response = await api.sendOTP(signinPhone.value);
    if (response.success) {
      // Clear OTP digits and transition to OTP screen
      otpDigits.value = ['', '', '', '', '', ''];
      currentScreen.value = 'otp-signin';
    }
  } catch (error) {
    console.error('Error sending OTP:', error);
    alert('خطا در ارسال کد تایید');
  }
}

// Handle OTP input
function handleOTPInput(event, index) {
  const value = event.target.value;
  
  // Only allow digits
  if (value && !/^\d$/.test(value)) {
    otpDigits.value[index] = '';
    return;
  }
  
  // Move to next input if value is entered
  if (value && index < 5) {
    const inputs = document.querySelectorAll('.otp-input');
    inputs[index + 1]?.focus();
  }
}

// Handle OTP keydown for backspace navigation
function handleOTPKeydown(event, index) {
  if (event.key === 'Backspace' && !otpDigits.value[index] && index > 0) {
    const inputs = document.querySelectorAll('.otp-input');
    inputs[index - 1]?.focus();
  }
}

// Verify sign in OTP
async function verifySignInOTP() {
  const otp = otpDigits.value.join('');
  
  if (otp.length !== 6) {
    alert('لطفاً کد 6 رقمی را کامل وارد کنید');
    return;
  }
  
  try {
    const response = await api.verifyOTP(signinPhone.value, otp);
    if (response.success && response.token) {
      // Store auth token and user data
      if (process.client) {
        localStorage.setItem('auth-token', response.token);
        if (response.user) {
          localStorage.setItem('infernal-current-user', JSON.stringify(response.user));
        }
      }
      // Navigate to main game
      router.push('/');
    } else {
      alert('کد تایید اشتباه است');
      otpDigits.value = ['', '', '', '', '', ''];
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    alert('خطا در تایید کد');
  }
}

// Verify registration OTP
async function verifyRegistrationOTP() {
  const otp = otpDigits.value.join('');
  
  if (otp.length !== 6) {
    alert('لطفاً کد 6 رقمی را کامل وارد کنید');
    return;
  }
  
  try {
    const response = await api.verifyOTP(formData.value.phone, otp);
    if (response.success) {
      // Generate player ID
      playerId.value = `P${Date.now().toString().slice(-6)}`;
      
      const userData = {
        ...formData.value,
        playerId: playerId.value
      };
      
      // Store auth token and user data
      if (process.client) {
        if (response.token) {
          localStorage.setItem('auth-token', response.token);
        }
        localStorage.setItem('infernal-current-user', JSON.stringify(userData));
      }
      
      currentScreen.value = 'success';
    } else {
      alert('کد تایید اشتباه است');
      otpDigits.value = ['', '', '', '', '', ''];
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    alert('خطا در تایید کد');
  }
}

// Resend OTP
async function resendOTP(type) {
  const phone = type === 'signin' ? signinPhone.value : formData.value.phone;
  
  try {
    const response = await api.sendOTP(phone);
    if (response.success) {
      alert('کد تایید مجدداً ارسال شد');
      otpDigits.value = ['', '', '', '', '', ''];
    }
  } catch (error) {
    console.error('Error resending OTP:', error);
    alert('خطا در ارسال مجدد کد');
  }
}

// Handle registration
async function handleRegistration() {
  if (!validatePhoneNumber(formData.value.phone)) {
    alert('شماره موبایل معتبر نیست');
    return;
  }

  try {
    const response = await api.sendOTP(formData.value.phone);
    if (response.success) {
      // Clear OTP digits and transition to OTP screen
      otpDigits.value = ['', '', '', '', '', ''];
      currentScreen.value = 'otp-registration';
    }
  } catch (error) {
    console.error('Error sending OTP:', error);
    alert('خطا در ارسال کد تایید');
  }
}

// Start game
function startGame() {
  router.push('/');
}
</script>

<style lang="scss" scoped>
@import '@/assets/scss/welcome.scss';

.welcome-page {
  width: 100%;
  min-height: 100vh;
  
  .screen {
    display: none;
    
    &.active {
      display: flex;
    }
  }
}
</style>
