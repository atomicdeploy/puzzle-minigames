import { Haptics, ImpactStyle } from '@capacitor/haptics';

// Game State
const gameState = {
    combination: [null, null, null, null, null],
    solution: [3, 0, 5, 4, 9], // The correct answer based on the hints
    currentFieldIndex: null,
    disabledDigits: new Set(),
    audio: {
        error: null,
        success: null,
        click: null
    },
    isUnlocked: false
};

// Initialize Audio
function initAudio() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create error sound (descending beep)
    gameState.audio.error = () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    };
    
    // Create success sound (ascending chime)
    gameState.audio.success = () => {
        [0, 100, 200].forEach((delay, i) => {
            setTimeout(() => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                const freq = 400 * Math.pow(1.5, i);
                oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.4);
            }, delay);
        });
    };
    
    // Create click sound
    gameState.audio.click = () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    };
}

// Initialize digit fields
function initDigitFields() {
    const fields = document.querySelectorAll('.digit-field');
    
    fields.forEach((field, index) => {
        field.addEventListener('click', () => openNumpad(index));
        field.addEventListener('touchstart', (e) => {
            e.preventDefault();
            openNumpad(index);
        });
    });
}

// Open numpad modal
function openNumpad(index) {
    if (gameState.isUnlocked) return;
    
    gameState.currentFieldIndex = index;
    
    // Update active state
    document.querySelectorAll('.digit-field').forEach((field, i) => {
        field.classList.toggle('active', i === index);
    });
    
    // Show modal
    const modal = document.getElementById('numpad-modal');
    modal.style.display = 'flex';
    
    // Update numpad buttons state
    updateNumpadButtons();
    
    // Play click sound
    if (gameState.audio.click) {
        gameState.audio.click();
    }
    
    // Haptic feedback
    try {
        Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {
        console.debug('Haptics not available:', e.message);
    }
}

// Close numpad modal
function closeNumpad() {
    const modal = document.getElementById('numpad-modal');
    modal.style.display = 'none';
    
    // Remove active state
    document.querySelectorAll('.digit-field').forEach(field => {
        field.classList.remove('active');
    });
    
    gameState.currentFieldIndex = null;
}

// Update numpad buttons based on disabled digits
function updateNumpadButtons() {
    const buttons = document.querySelectorAll('.numpad-digit');
    
    buttons.forEach(button => {
        const digit = parseInt(button.dataset.digit);
        button.classList.toggle('disabled', gameState.disabledDigits.has(digit));
    });
}

// Initialize numpad
function initNumpad() {
    // Digit buttons
    const digitButtons = document.querySelectorAll('.numpad-digit');
    digitButtons.forEach(button => {
        button.addEventListener('click', () => handleDigitClick(button));
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleDigitClick(button);
        });
    });
    
    // Close button
    const closeBtn = document.getElementById('close-numpad');
    closeBtn.addEventListener('click', closeNumpad);
    closeBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        closeNumpad();
    });
    
    // Clear button
    const clearBtn = document.getElementById('clear-digit');
    clearBtn.addEventListener('click', clearCurrentDigit);
    clearBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        clearCurrentDigit();
    });
    
    // Close on background click
    const modal = document.getElementById('numpad-modal');
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeNumpad();
        }
    });
}

// Handle digit button click
function handleDigitClick(button) {
    const digit = parseInt(button.dataset.digit);
    
    // Check if digit is disabled
    if (gameState.disabledDigits.has(digit)) {
        // Toggle disable state
        gameState.disabledDigits.delete(digit);
    } else {
        // Set digit if field is selected
        if (gameState.currentFieldIndex !== null) {
            setDigit(gameState.currentFieldIndex, digit);
            closeNumpad();
        }
    }
    
    updateNumpadButtons();
    
    // Play click sound
    if (gameState.audio.click) {
        gameState.audio.click();
    }
    
    // Haptic feedback
    try {
        Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {
        console.debug('Haptics not available:', e.message);
    }
}

// Set digit in combination
function setDigit(index, digit) {
    gameState.combination[index] = digit;
    
    // Update display
    const field = document.querySelector(`.digit-field[data-index="${index}"]`);
    const display = field.querySelector('.digit-display');
    display.textContent = digit;
    field.classList.add('filled');
    
    // Save state
    saveGameState();
}

// Clear current digit
function clearCurrentDigit() {
    if (gameState.currentFieldIndex !== null) {
        gameState.combination[gameState.currentFieldIndex] = null;
        
        // Update display
        const field = document.querySelector(`.digit-field[data-index="${gameState.currentFieldIndex}"]`);
        const display = field.querySelector('.digit-display');
        display.textContent = '-';
        field.classList.remove('filled');
        
        // Save state
        saveGameState();
    }
    
    // Play click sound
    if (gameState.audio.click) {
        gameState.audio.click();
    }
    
    // Haptic feedback
    try {
        Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {
        console.debug('Haptics not available:', e.message);
    }
}

// Initialize submit button
function initSubmitButton() {
    const submitBtn = document.getElementById('submit-btn');
    
    submitBtn.addEventListener('click', checkSolution);
    submitBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        checkSolution();
    });
}

// Check if solution is correct
function checkSolution() {
    if (gameState.isUnlocked) return;
    
    // Check if all digits are filled
    if (gameState.combination.some(digit => digit === null)) {
        showNotification('لطفاً تمام ارقام را وارد کنید', 'warning');
        return;
    }
    
    // Check if combination matches solution
    const isCorrect = gameState.combination.every((digit, index) => digit === gameState.solution[index]);
    
    if (isCorrect) {
        handleSuccess();
    } else {
        handleError();
    }
}

// Handle success
function handleSuccess() {
    gameState.isUnlocked = true;
    
    // Update lock icon
    const lockIcon = document.getElementById('lock-icon');
    lockIcon.textContent = '🔓';
    lockIcon.classList.remove('locked');
    lockIcon.classList.add('unlocked');
    
    // Update submit button
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.classList.add('success');
    submitBtn.disabled = true;
    
    // Show success feedback
    const overlay = document.getElementById('feedback-overlay');
    overlay.className = 'success';
    overlay.style.display = 'block';
    setTimeout(() => overlay.style.display = 'none', 500);
    
    // Success animation for all fields
    document.querySelectorAll('.digit-field').forEach((field, i) => {
        setTimeout(() => {
            field.style.animation = 'success-pulse 0.6s ease';
        }, i * 100);
    });
    
    // Play success sound
    if (gameState.audio.success) {
        gameState.audio.success();
    }
    
    // Haptic feedback
    try {
        Haptics.impact({ style: ImpactStyle.Medium });
        setTimeout(() => Haptics.impact({ style: ImpactStyle.Medium }), 200);
        setTimeout(() => Haptics.impact({ style: ImpactStyle.Medium }), 400);
    } catch (e) {
        console.debug('Haptics not available:', e.message);
    }
    
    // Show reward notification
    setTimeout(() => {
        showNotification('🎉 عالی! قفل باز شد! 🎉', 'success');
        setTimeout(() => {
            showRewardMessage();
        }, 2000);
    }, 800);
    
    // Save state
    saveGameState();
}

// Show reward message
function showRewardMessage() {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, var(--success-color), var(--accent-2));
        color: white;
        padding: 2rem 2.5rem;
        border-radius: 1.5rem;
        font-size: 1.8rem;
        font-weight: 700;
        z-index: 10000;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        animation: success-pulse 0.8s ease;
        text-align: center;
        border: 3px solid white;
    `;
    notification.innerHTML = `
        <div style="margin-bottom: 1rem;">پاداش شما:</div>
        <div style="font-size: 3rem; margin: 1rem 0;">🎁</div>
        <div style="font-size: 2.5rem; font-family: 'Courier New', monospace; letter-spacing: 5px;">305-49</div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.5s ease';
        setTimeout(() => notification.remove(), 500);
    }, 5000);
}

// Handle error
function handleError() {
    // Show error feedback
    const overlay = document.getElementById('feedback-overlay');
    overlay.className = 'error';
    overlay.style.display = 'block';
    setTimeout(() => overlay.style.display = 'none', 500);
    
    // Shake animation for all fields
    document.querySelectorAll('.digit-field').forEach(field => {
        field.classList.add('error-shake');
        setTimeout(() => field.classList.remove('error-shake'), 500);
    });
    
    // Shake submit button
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.classList.add('error');
    setTimeout(() => submitBtn.classList.remove('error'), 500);
    
    // Play error sound
    if (gameState.audio.error) {
        gameState.audio.error();
    }
    
    // Haptic feedback
    try {
        Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (e) {
        console.debug('Haptics not available:', e.message);
    }
    
    // Show error notification
    showNotification('ترکیب اشتباه است! دوباره تلاش کنید', 'error');
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    
    let bgColor = 'var(--primary-color)';
    if (type === 'error') bgColor = 'var(--error-color)';
    if (type === 'success') bgColor = 'var(--success-color)';
    if (type === 'warning') bgColor = 'var(--warning-color)';
    
    notification.style.cssText = `
        position: fixed;
        top: 20%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: ${bgColor};
        color: white;
        padding: 1rem 2rem;
        border-radius: 1rem;
        font-size: 1.2rem;
        font-weight: 600;
        z-index: 10000;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        animation: slideUp 0.3s ease;
        text-align: center;
        max-width: 80%;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// Load game state from localStorage
function loadGameState() {
    const saved = localStorage.getItem('combinational-lock-game');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            gameState.combination = data.combination || [null, null, null, null, null];
            gameState.disabledDigits = new Set(data.disabledDigits || []);
            gameState.isUnlocked = data.isUnlocked || false;
            
            // Restore UI
            gameState.combination.forEach((digit, index) => {
                if (digit !== null) {
                    const field = document.querySelector(`.digit-field[data-index="${index}"]`);
                    const display = field.querySelector('.digit-display');
                    display.textContent = digit;
                    field.classList.add('filled');
                }
            });
            
            // Restore unlocked state
            if (gameState.isUnlocked) {
                const lockIcon = document.getElementById('lock-icon');
                lockIcon.textContent = '🔓';
                lockIcon.classList.remove('locked');
                lockIcon.classList.add('unlocked');
                
                const submitBtn = document.getElementById('submit-btn');
                submitBtn.disabled = true;
                submitBtn.classList.add('success');
            }
        } catch (e) {
            console.error('Failed to load game state:', e);
        }
    }
}

// Save game state to localStorage
function saveGameState() {
    const data = {
        combination: gameState.combination,
        disabledDigits: Array.from(gameState.disabledDigits),
        isUnlocked: gameState.isUnlocked
    };
    localStorage.setItem('combinational-lock-game', JSON.stringify(data));
}

// Initialize back button
function initBackButton() {
    const backBtn = document.getElementById('back-btn');
    
    backBtn.addEventListener('click', () => {
        window.location.href = '../index.html';
    });
    
    backBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        window.location.href = '../index.html';
    });
}

// Initialize game
function initGame() {
    initAudio();
    initDigitFields();
    initNumpad();
    initSubmitButton();
    initBackButton();
    loadGameState();
    
    // Hide loading screen
    setTimeout(() => {
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('game-container').style.display = 'flex';
    }, 1000);
}

// Add fadeOut animation to CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; transform: translate(-50%, -50%); }
        to { opacity: 0; transform: translate(-50%, -60%); }
    }
`;
document.head.appendChild(style);

// Start game when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}
