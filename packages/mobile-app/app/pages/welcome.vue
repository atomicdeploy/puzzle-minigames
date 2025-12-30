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
        <button class="btn btn-primary" @click="currentScreen = 'tour'">بزن بریم!</button>
      </div>
    </div>

    <!-- Tour/Guide Screen -->
    <div v-else-if="currentScreen === 'tour'" class="screen active">
      <div class="tour-content">
        <h2>🎮 بازی چه جوریه؟</h2>
        
        <div class="tour-step">
          <div class="step-icon">🔍</div>
          <h3>پیدا کردن پازل‌ها</h3>
          <p>تو محیط اطرافت دنبال کدهای QR بگرد</p>
        </div>

        <div class="tour-step">
          <div class="step-icon">📱</div>
          <h3>اسکن کردن</h3>
          <p>هر کد رو که اسکن کنی، یه پازل جدید باز میشه</p>
        </div>

        <div class="tour-step">
          <div class="step-icon">🧩</div>
          <h3>حل معما</h3>
          <p>هر پازل یه معمای جذاب داره که باید حلش کنی</p>
        </div>

        <div class="tour-step">
          <div class="step-icon">🏆</div>
          <h3>برنده شو!</h3>
          <p>همه معماهارو حل کن و فاتح بازی بشو!</p>
        </div>

        <div class="tour-navigation">
          <button class="btn btn-secondary" @click="currentScreen = 'welcome'">برگردیم</button>
          <button class="btn btn-primary" @click="currentScreen = 'auth-choice'">فهمیدم، بریم!</button>
        </div>
      </div>
    </div>

    <!-- Auth Choice Screen -->
    <div v-else-if="currentScreen === 'auth-choice'" class="screen active">
      <div class="auth-choice-content">
        <h2>بیا تو بازی!</h2>
        <p class="subtitle">برای شروع، یکیشو انتخاب کن:</p>
        
        <div class="auth-buttons">
          <button class="btn btn-primary btn-large" @click="currentScreen = 'registration'">
            <span class="btn-icon">📝</span>
            می‌خوام ثبت نام کنم
          </button>
          <button class="btn btn-secondary btn-large" @click="currentScreen = 'signin'">
            <span class="btn-icon">🔑</span>
            قبلاً ثبت نام کردم
          </button>
        </div>

        <button class="btn-back" @click="currentScreen = 'tour'">← برگردیم</button>
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

          <button type="submit" class="btn btn-primary btn-large">بفرست برام کد بیاد</button>
        </form>

        <button class="btn-back" @click="currentScreen = 'auth-choice'">← برگردیم</button>
      </div>
    </div>

    <!-- OTP Verification Screen (for sign in) -->
    <div v-else-if="currentScreen === 'otp-signin'" class="screen active">
      <div class="otp-content">
        <h2>کد تایید رو بزن!</h2>
        <p class="subtitle">کد ۶ رقمی که برات فرستادیم رو بزن ({{ signinPhone }})</p>
        
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

        <button @click="verifySignInOTP" class="btn btn-primary btn-large">تایید کن!</button>
        <button @click="resendOTP('signin')" class="btn btn-text">دوباره بفرست</button>

        <button class="btn-back" @click="currentScreen = 'signin'">← برگردیم</button>
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

          <!-- Profile Picture Upload -->
          <div class="form-group">
            <label for="profilePicture">تصویر پروفایل (اختیاری)</label>
            <div class="profile-picture-upload">
              <div class="profile-preview" @click="$refs.profileInput?.click()">
                <img v-if="profilePicturePreview" :src="profilePicturePreview" alt="Profile Preview" />
                <span v-else class="placeholder-emoji">👤</span>
              </div>
              <input 
                ref="profileInput"
                type="file" 
                id="profilePicture" 
                accept="image/*"
                @change="handleProfileUpload"
                style="display: none;"
              >
              <button type="button" class="btn btn-secondary btn-small" @click="$refs.profileInput?.click()">
                انتخاب تصویر
              </button>
              <small class="help-text">حداکثر ۵۰۰ کیلوبایت</small>
            </div>
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

          <!-- Education Level -->
          <div class="form-group">
            <label for="educationLevel">مقطع تحصیلی <span class="required">*</span></label>
            <select v-model="formData.educationLevel" id="educationLevel" class="form-control" required>
              <option value="" disabled selected>انتخاب کنید</option>
              <option value="high-school">دبیرستان</option>
              <option value="diploma">دیپلم</option>
              <option value="associate">کاردانی</option>
              <option value="bachelor">کارشناسی</option>
              <option value="master">کارشناسی ارشد</option>
              <option value="phd">دکتری</option>
            </select>
          </div>

          <!-- Field of Study -->
          <div class="form-group">
            <label for="fieldOfStudy">رشته تحصیلی <span class="required">*</span></label>
            <input v-model="formData.fieldOfStudy" type="text" id="fieldOfStudy" class="form-control" required placeholder="مثال: مهندسی کامپیوتر">
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

          <button type="submit" class="btn btn-primary btn-large">بریم به مرحله بعد!</button>
        </form>

        <button class="btn-back" @click="currentScreen = 'auth-choice'">← برگردیم</button>
      </div>
    </div>

    <!-- OTP Verification Screen (for registration) -->
    <div v-else-if="currentScreen === 'otp-registration'" class="screen active">
      <div class="otp-content">
        <h2>کد تایید رو بزن!</h2>
        <p class="subtitle">کد ۶ رقمی که برات فرستادیم رو بزن ({{ formData.phone }})</p>
        
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

        <button @click="verifyRegistrationOTP" class="btn btn-primary btn-large">تایید کن و بریم!</button>
        <button @click="resendOTP('registration')" class="btn btn-text">دوباره بفرست</button>

        <button class="btn-back" @click="currentScreen = 'registration'">← برگردیم</button>
      </div>
    </div>

    <!-- Success Screen -->
    <div v-else-if="currentScreen === 'success'" class="screen active">
      <div class="success-content">
        <div class="success-icon">🎉</div>
        <h2>یه ذهنم! ثبت نام شد!</h2>
        
        <div class="player-info">
          <div class="player-id-card">
            <div class="player-avatar">
              <img v-if="profilePicturePreview" :src="profilePicturePreview" alt="Profile Picture" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />
              <span v-else>👤</span>
            </div>
            <div class="player-details">
              <h3>{{ formData.name }}</h3>
              <p class="player-label">کد بازیکن</p>
              <p class="player-id">{{ playerId }}</p>
            </div>
            <div class="player-color" :style="{ background: formData.color }"></div>
          </div>
        </div>

        <div class="instructions">
          <h3>🎮 حالا چیکار کنیم؟</h3>
          <ul class="instruction-list">
            <li>تو محیط اطرافت دنبال کدهای QR بگرد</li>
            <li>هر کد رو که اسکن کنی، یه پازل جدید باز میشه</li>
            <li>معماهارو حل کن و امتیاز بگیر</li>
            <li>کد بازیکنت رو یادداشت کن که بعد لازمت میشه</li>
          </ul>
        </div>

        <button class="btn btn-primary btn-large" @click="startGame">بزن بریم بازی!</button>
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

// Handle profile picture upload
function handleProfileUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  
  // Validate file size (max 500KB)
  if (file.size > 500 * 1024) {
    alert('حجم فایل باید کمتر از ۵۰۰ کیلوبایت باشد');
    event.target.value = '';
    return;
  }
  
  // Validate file type
  if (!file.type.startsWith('image/')) {
    alert('فقط فایل‌های تصویری مجاز هستند');
    event.target.value = '';
    return;
  }
  
  // Read and preview the image
  const reader = new FileReader();
  reader.onload = (e) => {
    profilePicturePreview.value = e.target?.result;
    formData.value.profilePicture = e.target?.result;
  };
  reader.readAsDataURL(file);
}

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
