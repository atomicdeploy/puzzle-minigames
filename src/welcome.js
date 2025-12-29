// Welcome Page Logic for Infernal Puzzle Game
import { api } from './api.js';

// Global state
const state = {
    currentScreen: 'welcome',
    registrationData: null,
    signinData: null,
    otpCode: null,
    profilePicture: null,
    otpSession: null // Store OTP session from backend
};

// Screen management
function showScreen(screenId) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Show target screen
    const targetScreen = document.getElementById(`${screenId}-screen`);
    if (targetScreen) {
        targetScreen.classList.add('active');
        state.currentScreen = screenId;
    }
}

// Navigation functions (called from HTML)
window.showWelcome = () => showScreen('welcome');
window.showTour = () => showScreen('tour');
window.showAuthChoice = () => showScreen('auth-choice');
window.showSignIn = () => showScreen('signin');
window.showRegistration = () => showScreen('registration');

// Profile picture upload handler
window.handleProfileUpload = (event) => {
    const input = event && event.target ? event.target : null;
    const file = input && input.files && input.files[0] ? input.files[0] : null;

    if (!file) {
        return;
    }

    // Maximum allowed file size: 500 KB
    const MAX_SIZE_BYTES = 500 * 1024;

    // Helper to handle invalid file cases: show error, reset input/state/preview.
    const handleInvalidFile = (message) => {
        if (typeof showError === 'function' && input && input.id) {
            showError(input.id, message);
        }
        if (input) {
            input.value = '';
        }
        state.profilePicture = null;
        const previewImg = document.getElementById('profile-preview-img');
        const placeholder = document.getElementById('profile-placeholder');
        if (previewImg && placeholder) {
            previewImg.style.display = 'none';
            placeholder.style.display = 'block';
        }
    };

    // Validate file size
    if (typeof file.size === 'number' && file.size > MAX_SIZE_BYTES) {
        handleInvalidFile('حجم تصویر پروفایل نباید بیشتر از ۵۰۰ کیلوبایت باشد');
        return;
    }

    // Validate file type against the input's accept attribute (if present)
    if (input && typeof input.accept === 'string' && input.accept.trim() !== '') {
        const acceptedTypes = input.accept
            .split(',')
            .map((t) => t.trim())
            .filter((t) => t.length > 0);

        const mimeType = file.type || '';
        const fileName = (file.name || '').toLowerCase();

        const matchesAccept = acceptedTypes.some((accept) => {
            const a = accept.toLowerCase();
            // Extension pattern, e.g. ".png"
            if (a.startsWith('.')) {
                return fileName.endsWith(a);
            }
            // Wildcard MIME type, e.g. "image/*"
            if (a.endsWith('/*')) {
                const base = a.slice(0, a.indexOf('/'));
                return mimeType.toLowerCase().startsWith(base + '/');
            }
            // Exact MIME type, e.g. "image/png"
            return mimeType.toLowerCase() === a;
        });

        if (!matchesAccept) {
            handleInvalidFile('نوع فایل انتخاب‌شده برای تصویر پروفایل مجاز نیست');
            return;
        }
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        state.profilePicture = e.target.result;
        const previewImg = document.getElementById('profile-preview-img');
        const placeholder = document.getElementById('profile-placeholder');
        if (previewImg) {
            previewImg.src = e.target.result;
            previewImg.style.display = 'block';
        }
        if (placeholder) {
            placeholder.style.display = 'none';
        }
    };
    reader.readAsDataURL(file);
};

// Initialize on load
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Persian date picker
    initializePersianDatePicker();
    
    // Check if user is already logged in - verify with backend
    const authToken = localStorage.getItem('auth-token');
    const cachedUser = localStorage.getItem('infernal-current-user');
    
    if (authToken && cachedUser) {
        try {
            // Verify token with backend
            const userData = JSON.parse(cachedUser);
            
            // Try to get fresh user data from backend
            try {
                const response = await api.getUserProfile();
                if (response.success && response.user) {
                    // Update cached data
                    localStorage.setItem('infernal-current-user', JSON.stringify(response.user));
                    redirectToGame(response.user);
                    return;
                }
            } catch (error) {
                // If backend call fails, use cached data
                console.warn('Could not verify user with backend, using cached data', error);
            }
            
            // If backend verification failed but we have cached data, use it
            redirectToGame(userData);
            return;
        } catch (error) {
            console.error('Failed to parse user data:', error);
            // Clear corrupted data
            localStorage.removeItem('auth-token');
            localStorage.removeItem('infernal-current-user');
        }
    }
    
    // Sign In form handler
    const signinForm = document.getElementById('signin-form');
    if (signinForm) {
        signinForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const phone = document.getElementById('signin-phone').value;
            
            // Validate phone number
            if (!validatePhoneNumber(phone)) {
                showError('signin-phone', 'شماره موبایل معتبر نیست');
                return;
            }
            
            state.signinData = { phone };
            
            // Send OTP
            await sendOTP(phone, 'signin');
        });
    }
    
    // Registration form handler
    const registrationForm = document.getElementById('registration-form');
    if (registrationForm) {
        registrationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Get birthday from dropdowns
            const year = document.getElementById('birthday-year')?.value;
            const month = document.getElementById('birthday-month')?.value;
            const day = document.getElementById('birthday-day')?.value;
            const birthday = year && month && day ? `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}` : '';
            
            // Collect form data
            const formData = {
                name: document.getElementById('name').value,
                birthday: birthday,
                gender: document.querySelector('input[name="gender"]:checked')?.value,
                educationLevel: document.getElementById('education-level').value,
                fieldOfStudy: document.getElementById('field-of-study').value,
                phone: document.getElementById('phone').value,
                color: document.querySelector('input[name="color"]:checked')?.value,
                profilePicture: state.profilePicture
            };
            
            // Validation
            if (!validateRegistrationForm(formData)) {
                return;
            }
            
            state.registrationData = formData;
            
            // Send OTP
            await sendOTP(formData.phone, 'registration');
        });
    }
});

// Helper function to redirect to game with welcome message
function redirectToGame(userData) {
    const welcomeHeading = document.createElement('h1');
    welcomeHeading.style.cssText = 'font-size: 2rem; margin-bottom: 1rem;';
    welcomeHeading.textContent = `خوش آمدید ${userData.name}!`;
    
    const welcomeMessage = document.createElement('p');
    welcomeMessage.style.cssText = 'font-size: 1.2rem; color: var(--text-secondary);';
    welcomeMessage.textContent = 'در حال انتقال به بازی...';
    
    const welcomeBackDiv = document.createElement('div');
    welcomeBackDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: var(--bg-dark);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 20000;
        color: white;
        text-align: center;
    `;
    welcomeBackDiv.appendChild(welcomeHeading);
    welcomeBackDiv.appendChild(welcomeMessage);
    document.body.appendChild(welcomeBackDiv);
    
    setTimeout(() => {
        window.location.href = '/index.html';
    }, 2000);
}

// Validate phone number
function validatePhoneNumber(phone) {
    const phoneRegex = /^09\d{9}$/;
    return phoneRegex.test(phone);
}

// Validate registration form
function validateRegistrationForm(data) {
    let isValid = true;
    
    if (!data.name || data.name.trim().length < 2) {
        showError('name', 'لطفاً نام و نام خانوادگی را وارد کنید');
        isValid = false;
    }
    
    if (!data.birthday) {
        showError('birthday', 'لطفاً تاریخ تولد را وارد کنید');
        isValid = false;
    }
    
    if (!data.gender) {
        alert('لطفاً جنسیت را انتخاب کنید');
        isValid = false;
    }
    
    if (!data.educationLevel) {
        showError('education-level', 'لطفاً مقطع تحصیلی را انتخاب کنید');
        isValid = false;
    }
    
    if (!data.fieldOfStudy || data.fieldOfStudy.trim().length < 2) {
        showError('field-of-study', 'لطفاً رشته تحصیلی را وارد کنید');
        isValid = false;
    }
    
    if (!validatePhoneNumber(data.phone)) {
        showError('phone', 'شماره موبایل معتبر نیست');
        isValid = false;
    }
    
    if (!data.color) {
        alert('لطفاً یک رنگ را انتخاب کنید');
        isValid = false;
    }
    
    return isValid;
}

// Show error message
function showError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (field) {
        const formGroup = field.closest('.form-group');
        formGroup.classList.add('error');
        
        // Remove existing error message
        const existingError = formGroup.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Add error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        formGroup.appendChild(errorDiv);
        
        // Remove error on input change
        field.addEventListener('input', () => {
            formGroup.classList.remove('error');
        }, { once: true });
    }
}

// Send OTP via backend API
async function sendOTP(phone, type) {
    try {
        // Show loading state
        showNotification('در حال ارسال کد...', 'info');
        
        // Call backend API to send OTP
        const response = await api.sendOTP(phone);
        state.otpSession = response.session; // Store session for verification
        
        console.log(`OTP sent to ${phone}`); // For development
        
        // Show OTP screen
        if (type === 'signin') {
            document.getElementById('signin-phone-display').textContent = phone;
            showScreen('otp-signin');
        } else if (type === 'registration') {
            document.getElementById('registration-phone-display').textContent = phone;
            showScreen('otp-registration');
        }
        
        // Setup OTP input handlers
        setupOTPInputs(type === 'signin' ? 'otp-signin-screen' : 'otp-registration-screen');
        
        showNotification('کد تایید ارسال شد', 'success');
    } catch (error) {
        console.error('Error sending OTP:', error);
        showNotification(error.message || 'خطا در ارسال کد تایید', 'error');
    }
}

// Resend OTP
window.resendOTP = async (type) => {
    const phone = type === 'signin' ? state.signinData.phone : state.registrationData.phone;
    await sendOTP(phone, type);
};

// Setup OTP input handlers
function setupOTPInputs(screenId) {
    const screen = document.getElementById(screenId);
    const inputs = screen.querySelectorAll('.otp-input');
    
    inputs.forEach((input, index) => {
        // Clear previous value and event listeners
        input.value = '';
        input.replaceWith(input.cloneNode(true));
    });
    
    // Re-query after cloning to get fresh elements
    const freshInputs = screen.querySelectorAll('.otp-input');
    
    freshInputs.forEach((input, index) => {
        // Auto-focus first input
        if (index === 0) {
            input.focus();
        }
        
        input.addEventListener('input', (e) => {
            const value = e.target.value;
            
            // Only allow digits
            if (!/^\d$/.test(value)) {
                e.target.value = '';
                return;
            }
            
            // Move to next input
            if (value && index < freshInputs.length - 1) {
                freshInputs[index + 1].focus();
            }
        });
        
        input.addEventListener('keydown', (e) => {
            // Handle backspace
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                freshInputs[index - 1].focus();
            }
        });
        
        // Handle paste
        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const pastedData = e.clipboardData.getData('text').trim();
            
            if (/^\d{6}$/.test(pastedData)) {
                pastedData.split('').forEach((digit, i) => {
                    if (freshInputs[i]) {
                        freshInputs[i].value = digit;
                    }
                });
                freshInputs[freshInputs.length - 1].focus();
            }
        });
    });
}

// Verify Sign In OTP
window.verifySignInOTP = async () => {
    const screen = document.getElementById('otp-signin-screen');
    const inputs = screen.querySelectorAll('.otp-input');
    const enteredOTP = Array.from(inputs).map(input => input.value).join('');
    
    if (enteredOTP.length !== 6) {
        showNotification('لطفاً کد 6 رقمی را کامل وارد کنید', 'error');
        return;
    }
    
    try {
        // Show loading state
        showNotification('در حال تایید...', 'info');
        
        // Verify OTP with backend
        const response = await api.verifyOTP(state.signinData.phone, enteredOTP);
        
        if (response.success && response.user) {
            // Store auth token
            if (response.token) {
                localStorage.setItem('auth-token', response.token);
            }
            
            // Store user data in localStorage as cache (backend is source of truth)
            localStorage.setItem('infernal-current-user', JSON.stringify(response.user));
            
            showSuccessScreen(response.user);
        } else {
            showNotification('حساب کاربری یافت نشد', 'error');
            setTimeout(() => showScreen('signin'), 2000);
        }
    } catch (error) {
        console.error('OTP verification error:', error);
        showNotification(error.message || 'کد تایید اشتباه است', 'error');
        // Clear inputs
        inputs.forEach(input => input.value = '');
        inputs[0].focus();
    }
};

// Verify Registration OTP
window.verifyRegistrationOTP = async () => {
    const screen = document.getElementById('otp-registration-screen');
    const inputs = screen.querySelectorAll('.otp-input');
    const enteredOTP = Array.from(inputs).map(input => input.value).join('');
    
    if (enteredOTP.length !== 6) {
        showNotification('لطفاً کد 6 رقمی را کامل وارد کنید', 'error');
        return;
    }
    
    try {
        // Show loading state
        showNotification('در حال ثبت نام...', 'info');
        
        // First verify OTP
        const verifyResponse = await api.verifyOTP(state.registrationData.phone, enteredOTP);
        
        if (!verifyResponse.success) {
            throw new Error('کد تایید اشتباه است');
        }
        
        // Then register the user
        const userData = {
            ...state.registrationData,
            otp: enteredOTP,
            session: state.otpSession
        };
        
        const registerResponse = await api.register(userData);
        
        if (registerResponse.success && registerResponse.user) {
            // Store auth token
            if (registerResponse.token) {
                localStorage.setItem('auth-token', registerResponse.token);
            }
            
            // Store user data in localStorage as cache (backend is source of truth)
            localStorage.setItem('infernal-current-user', JSON.stringify(registerResponse.user));
            
            showSuccessScreen(registerResponse.user);
        } else {
            throw new Error('خطا در ثبت نام');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showNotification(error.message || 'خطا در ثبت نام', 'error');
        // Clear inputs
        inputs.forEach(input => input.value = '');
        inputs[0].focus();
    }
};

// Show success screen
function showSuccessScreen(userData) {
    // Update success screen with user data
    document.getElementById('success-player-name').textContent = userData.name;
    document.getElementById('success-player-id').textContent = userData.playerId;
    document.getElementById('success-player-color').style.background = userData.color;
    
    // Set profile picture if available
    if (userData.profilePicture) {
        const successImg = document.getElementById('success-profile-img');
        const successPlaceholder = document.getElementById('success-profile-placeholder');
        successImg.src = userData.profilePicture;
        successImg.style.display = 'block';
        successPlaceholder.style.display = 'none';
    }
    
    showScreen('success');
}

// Start game
window.startGame = () => {
    // Redirect to main game
    window.location.href = '/index.html';
};

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 2rem;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'error' ? 'var(--error-color)' : 'var(--success-color)'};
        color: white;
        padding: 1rem 2rem;
        border-radius: 0.5rem;
        font-weight: 700;
        z-index: 10000;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        animation: slideDown 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
        }
        to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
    }
    
    @keyframes slideUp {
        from {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
        to {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
