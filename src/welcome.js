// Welcome Page Logic for Infernal Puzzle Game

// Global state
const state = {
    currentScreen: 'welcome',
    registrationData: null,
    signinData: null,
    otpCode: null,
    profilePicture: null
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
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            state.profilePicture = e.target.result;
            const previewImg = document.getElementById('profile-preview-img');
            const placeholder = document.getElementById('profile-placeholder');
            previewImg.src = e.target.result;
            previewImg.style.display = 'block';
            placeholder.style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    // Sign In form handler
    const signinForm = document.getElementById('signin-form');
    if (signinForm) {
        signinForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const phone = document.getElementById('signin-phone').value;
            
            // Validate phone number
            if (!validatePhoneNumber(phone)) {
                showError('signin-phone', 'شماره موبایل معتبر نیست');
                return;
            }
            
            state.signinData = { phone };
            
            // Send OTP (simulated)
            sendOTP(phone, 'signin');
        });
    }
    
    // Registration form handler
    const registrationForm = document.getElementById('registration-form');
    if (registrationForm) {
        registrationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Collect form data
            const formData = {
                name: document.getElementById('name').value,
                birthday: document.getElementById('birthday').value,
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
            sendOTP(formData.phone, 'registration');
        });
    }
});

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

// Send OTP (simulated)
function sendOTP(phone, type) {
    // Generate cryptographically secure random 6-digit OTP
    const randomValues = new Uint32Array(1);
    crypto.getRandomValues(randomValues);
    state.otpCode = (100000 + (randomValues[0] % 900000)).toString();
    
    console.log(`OTP for ${phone}: ${state.otpCode}`); // For development/testing
    
    // In production, this would call a backend API to send SMS
    // For now, we'll just simulate it
    
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
}

// Resend OTP
window.resendOTP = (type) => {
    const phone = type === 'signin' ? state.signinData.phone : state.registrationData.phone;
    sendOTP(phone, type);
    showNotification('کد تایید مجدد ارسال شد');
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
window.verifySignInOTP = () => {
    const screen = document.getElementById('otp-signin-screen');
    const inputs = screen.querySelectorAll('.otp-input');
    const enteredOTP = Array.from(inputs).map(input => input.value).join('');
    
    if (enteredOTP.length !== 6) {
        showNotification('لطفاً کد 6 رقمی را کامل وارد کنید', 'error');
        return;
    }
    
    // Verify OTP
    if (enteredOTP === state.otpCode) {
        // In production, this would verify with backend and get user data
        // For now, we'll load from localStorage
        const existingUser = loadUserData(state.signinData.phone);
        
        if (existingUser) {
            showSuccessScreen(existingUser);
        } else {
            showNotification('حساب کاربری یافت نشد', 'error');
            setTimeout(() => showScreen('signin'), 2000);
        }
    } else {
        showNotification('کد تایید اشتباه است', 'error');
        // Clear inputs
        inputs.forEach(input => input.value = '');
        inputs[0].focus();
    }
};

// Verify Registration OTP
window.verifyRegistrationOTP = () => {
    const screen = document.getElementById('otp-registration-screen');
    const inputs = screen.querySelectorAll('.otp-input');
    const enteredOTP = Array.from(inputs).map(input => input.value).join('');
    
    if (enteredOTP.length !== 6) {
        showNotification('لطفاً کد 6 رقمی را کامل وارد کنید', 'error');
        return;
    }
    
    // Verify OTP
    if (enteredOTP === state.otpCode) {
        // Generate player ID
        const playerId = generatePlayerId();
        
        // Create user object
        const userData = {
            ...state.registrationData,
            playerId,
            createdAt: new Date().toISOString()
        };
        
        // Save user data
        saveUserData(userData);
        
        // Show success screen
        showSuccessScreen(userData);
    } else {
        showNotification('کد تایید اشتباه است', 'error');
        // Clear inputs
        inputs.forEach(input => input.value = '');
        inputs[0].focus();
    }
};

// Generate player ID
function generatePlayerId() {
    const prefix = 'INF';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
}

// Save user data
function saveUserData(userData) {
    // Save to localStorage (in production, this would be saved to backend)
    const users = JSON.parse(localStorage.getItem('infernal-users') || '{}');
    users[userData.phone] = userData;
    localStorage.setItem('infernal-users', JSON.stringify(users));
    
    // Save current user session
    localStorage.setItem('infernal-current-user', JSON.stringify(userData));
}

// Load user data
function loadUserData(phone) {
    const users = JSON.parse(localStorage.getItem('infernal-users') || '{}');
    return users[phone] || null;
}

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

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    const currentUser = localStorage.getItem('infernal-current-user');
    if (currentUser) {
        try {
            const userData = JSON.parse(currentUser);
            // Show a quick welcome back message and redirect
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
        welcomeBackDiv.innerHTML = `
            <h1 style="font-size: 2rem; margin-bottom: 1rem;">خوش آمدید ${userData.name}!</h1>
            <p style="font-size: 1.2rem; color: var(--text-secondary);">در حال انتقال به بازی...</p>
        `;
        document.body.appendChild(welcomeBackDiv);
        
        setTimeout(() => {
            window.location.href = '/index.html';
        }, 2000);
        } catch (error) {
            console.error('Failed to parse user data:', error);
            // Clear corrupted data
            localStorage.removeItem('infernal-current-user');
        }
    }
});
