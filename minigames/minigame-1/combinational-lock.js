import { Haptics, ImpactStyle } from '@capacitor/haptics';

// Puzzle Hints - Each hint has a guess and rules about it
const PUZZLE_HINTS = [
    {
        guess: [8, 2, 6, 1, 9],
        correctDigits: 2,
        correctPositions: 0,
        description: 'دو رقم درست و در جای اشتباه'
    },
    {
        guess: [7, 0, 6, 2, 9],
        correctDigits: 1,
        correctPositions: 1,
        description: 'یک رقم درست و در جای درست'
    },
    {
        guess: [4, 7, 5, 3, 0],
        correctDigits: 3,
        correctPositions: 0,
        description: 'سه رقم درست و در جای اشتباه'
    },
    {
        guess: [8, 6, 3, 0, 2],
        correctDigits: 2,
        correctPositions: 1,
        description: 'دو رقم درست، یکی در جای درست و یکی در جای اشتباه'
    },
    {
        guess: [9, 1, 7, 0, 4],
        correctDigits: 2,
        correctPositions: 2,
        description: 'دو رقم درست و در جای درست'
    }
];

// Solver: Find all valid solutions based on hints
function solvePuzzle(hints) {
    const solutions = [];
    
    // Try all possible 5-digit combinations (00000 to 99999)
    for (let i = 0; i <= 99999; i++) {
        const candidate = String(i).padStart(5, '0').split('').map(Number);
        
        if (isValidSolution(candidate, hints)) {
            solutions.push(candidate);
        }
    }
    
    return solutions;
}

// Check if a candidate satisfies all hints
function isValidSolution(candidate, hints) {
    for (const hint of hints) {
        if (!satisfiesHint(candidate, hint)) {
            return false;
        }
    }
    return true;
}

// Check if candidate satisfies a single hint
function satisfiesHint(candidate, hint) {
    let correctInPosition = 0;
    let correctDigits = 0;
    
    // Count digits in correct position
    for (let i = 0; i < 5; i++) {
        if (candidate[i] === hint.guess[i]) {
            correctInPosition++;
        }
    }
    
    // Count total correct digits (including wrong positions)
    const candidateCounts = {};
    const guessCounts = {};
    
    for (let i = 0; i < 5; i++) {
        candidateCounts[candidate[i]] = (candidateCounts[candidate[i]] || 0) + 1;
        guessCounts[hint.guess[i]] = (guessCounts[hint.guess[i]] || 0) + 1;
    }
    
    for (const digit in guessCounts) {
        correctDigits += Math.min(guessCounts[digit], candidateCounts[digit] || 0);
    }
    
    return correctDigits === hint.correctDigits && 
           correctInPosition === hint.correctPositions;
}

// Validate current user input against a hint
// Returns: 'valid' if satisfies, 'invalid' if violates, 'unknown' if inconclusive
function validateAgainstHint(userInput, hint) {
    // If not all digits filled, we can't fully validate
    if (userInput.some(d => d === null)) {
        return 'unknown';
    }
    
    return satisfiesHint(userInput, hint) ? 'valid' : 'invalid';
}

// Game State
const gameState = {
    combination: [null, null, null, null, null],
    solutions: [], // Will be computed by solver
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
    let audioContext = null;

    // Lazily create the AudioContext on first use, ideally after a user interaction.
    function getAudioContext() {
        if (audioContext) {
            return audioContext;
        }
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.debug('AudioContext not available:', e.message);
            return null;
        }
        return audioContext;
    }
    
    // Create error sound (descending beep)
    gameState.audio.error = () => {
        const ctx = getAudioContext();
        if (!ctx) return;

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.frequency.setValueAtTime(600, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
    };
    
    // Create success sound (ascending chime)
    gameState.audio.success = () => {
        const ctx = getAudioContext();
        if (!ctx) return;

        [0, 100, 200].forEach((delay, i) => {
            setTimeout(() => {
                const innerCtx = getAudioContext();
                if (!innerCtx) return;

                const oscillator = innerCtx.createOscillator();
                const gainNode = innerCtx.createGain();
                oscillator.connect(gainNode);
                gainNode.connect(innerCtx.destination);
                
                const freq = 400 * Math.pow(1.5, i);
                oscillator.frequency.setValueAtTime(freq, innerCtx.currentTime);
                gainNode.gain.setValueAtTime(0.2, innerCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, innerCtx.currentTime + 0.4);
                
                oscillator.start(innerCtx.currentTime);
                oscillator.stop(innerCtx.currentTime + 0.4);
            }, delay);
        });
    };
    
    // Create click sound
    gameState.audio.click = () => {
        const ctx = getAudioContext();
        if (!ctx) return;

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.frequency.setValueAtTime(800, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.1);
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

// Helper function to get digits already used in combination (excluding specific index)
function getUsedDigits(excludeIndex = null) {
    const usedDigits = new Set();
    gameState.combination.forEach((digit, index) => {
        if (digit !== null && index !== excludeIndex) {
            usedDigits.add(digit);
        }
    });
    return usedDigits;
}

// Update numpad buttons based on disabled digits and already-used digits
function updateNumpadButtons() {
    const buttons = document.querySelectorAll('.numpad-digit');
    
    // Get digits already used in the combination (excluding current field)
    const usedDigits = getUsedDigits(gameState.currentFieldIndex);
    
    buttons.forEach(button => {
        const digit = parseInt(button.dataset.digit);
        const isDisabled = gameState.disabledDigits.has(digit);
        const isUsed = usedDigits.has(digit);
        
        button.classList.toggle('disabled', isDisabled || isUsed);
        
        // Add special class for already-used digits
        button.classList.toggle('used', isUsed && !isDisabled);
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
    
    // Check if digit is already used in another position
    const usedDigits = getUsedDigits(gameState.currentFieldIndex);
    
    // Check if digit is disabled by user
    if (gameState.disabledDigits.has(digit)) {
        // Toggle disable state
        gameState.disabledDigits.delete(digit);
    } else if (usedDigits.has(digit)) {
        // Digit is already used - do nothing, show feedback
        // Play error sound
        if (gameState.audio.error) {
            gameState.audio.error();
        }
        return;
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

// Update hint status indicators based on current combination
function updateHintStatuses() {
    PUZZLE_HINTS.forEach((hint, index) => {
        const hintItem = document.querySelector(`.hint-item[data-hint-index="${index}"]`);
        const statusSpan = hintItem.querySelector('.hint-status');
        
        const status = validateAgainstHint(gameState.combination, hint);
        
        statusSpan.textContent = '';
        statusSpan.className = 'hint-status';
        
        if (status === 'valid') {
            statusSpan.textContent = '✅';
            statusSpan.classList.add('valid');
        } else if (status === 'invalid') {
            statusSpan.textContent = '❌';
            statusSpan.classList.add('invalid');
        }
        // If 'unknown', leave empty (no icon)
    });
}

// Generate detailed explanation for hint validation in Persian
function generateHintExplanation(userInput, hint, hintIndex) {
    const hintNumber = hint.guess.join('');
    const userNumber = userInput.map(d => d === null ? '-' : d).join('');
    
    let explanation = `<strong>سرنخ شماره ${hintIndex + 1}:</strong>\n\n`;
    explanation += `<div class="digit-comparison"><strong>حدس داده شده:</strong><span>${hintNumber}</span></div>\n`;
    explanation += `<div class="digit-comparison"><strong>ترکیب شما:</strong><span>${userNumber}</span></div>\n\n`;
    
    // Check if all digits are filled
    if (userInput.some(d => d === null)) {
        explanation += `<div class="result-box">هنوز تمام ارقام را وارد نکرده‌اید. لطفاً ابتدا تمام خانه‌ها را پر کنید تا بتوانیم این سرنخ را بررسی کنیم.</div>`;
        return explanation;
    }
    
    // Count digits in correct positions
    let correctInPosition = 0;
    let positionDetails = '<strong>بررسی موقعیت‌ها:</strong>\n';
    
    for (let i = 0; i < 5; i++) {
        if (userInput[i] === hint.guess[i]) {
            correctInPosition++;
            positionDetails += `<span class="match">• موقعیت ${i + 1}: رقم ${userInput[i]} ✓ (درست)</span>\n`;
        } else {
            positionDetails += `<span class="no-match">• موقعیت ${i + 1}: ${hint.guess[i]} در حدس، ${userInput[i]} در ترکیب شما ✗ (متفاوت)</span>\n`;
        }
    }
    
    // Count total correct digits
    const userCounts = {};
    const guessCounts = {};
    
    for (let i = 0; i < 5; i++) {
        userCounts[userInput[i]] = (userCounts[userInput[i]] || 0) + 1;
        guessCounts[hint.guess[i]] = (guessCounts[hint.guess[i]] || 0) + 1;
    }
    
    let correctDigits = 0;
    let digitDetails = '\n<strong>بررسی ارقام مشترک:</strong>\n';
    
    for (const digit in guessCounts) {
        const common = Math.min(guessCounts[digit], userCounts[digit] || 0);
        correctDigits += common;
        if (common > 0) {
            digitDetails += `<span class="match">• رقم ${digit}: ${common} بار مشترک</span>\n`;
        }
    }
    
    if (correctDigits === 0) {
        digitDetails += `<span class="no-match">• هیچ رقم مشترکی وجود ندارد</span>\n`;
    }
    
    explanation += positionDetails + digitDetails;
    
    // Add rule comparison
    explanation += `\n<strong>قانون سرنخ:</strong> ${hint.description}\n\n`;
    explanation += `<strong>نتیجه محاسبات:</strong>\n`;
    explanation += `• تعداد ارقام درست: ${correctDigits} (باید ${hint.correctDigits} باشد)\n`;
    explanation += `• تعداد ارقام در جای درست: ${correctInPosition} (باید ${hint.correctPositions} باشد)\n\n`;
    
    // Final verdict
    const isValid = (correctDigits === hint.correctDigits && correctInPosition === hint.correctPositions);
    
    if (isValid) {
        explanation += `<div class="result-box valid">✅ این سرنخ با ترکیب شما مطابقت دارد!</div>`;
    } else {
        explanation += `<div class="result-box invalid">❌ این سرنخ با ترکیب شما مطابقت ندارد!\n\n`;
        if (correctDigits !== hint.correctDigits) {
            explanation += `تعداد ارقام درست باید ${hint.correctDigits} باشد ولی ${correctDigits} است.\n`;
        }
        if (correctInPosition !== hint.correctPositions) {
            explanation += `تعداد ارقام در جای درست باید ${hint.correctPositions} باشد ولی ${correctInPosition} است.`;
        }
        explanation += `</div>`;
    }
    
    return explanation;
}

// Show hint explanation dialog
function showHintExplanation(hintIndex) {
    const hint = PUZZLE_HINTS[hintIndex];
    const explanation = generateHintExplanation(gameState.combination, hint, hintIndex);
    
    const dialog = document.getElementById('hint-explanation-dialog');
    const dialogText = document.getElementById('hint-dialog-text');
    
    dialogText.innerHTML = explanation;
    dialog.style.display = 'flex';
    
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

// Close hint explanation dialog
function closeHintExplanation() {
    const dialog = document.getElementById('hint-explanation-dialog');
    dialog.style.display = 'none';
}

// Initialize hint click listeners
function initHintListeners() {
    const hintItems = document.querySelectorAll('.hint-item');
    
    hintItems.forEach((item, index) => {
        // For mouse clicks
        item.addEventListener('click', () => showHintExplanation(index));
        
        // For touch devices - detect tap vs scroll
        let touchStartY = 0;
        let touchStartTime = 0;
        let hasMoved = false;
        
        item.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
            touchStartTime = Date.now();
            hasMoved = false;
        }, { passive: true });
        
        item.addEventListener('touchmove', (e) => {
            const touchMoveY = e.touches[0].clientY;
            const deltaY = Math.abs(touchMoveY - touchStartY);
            
            // If moved more than 10px, consider it a scroll
            if (deltaY > 10) {
                hasMoved = true;
            }
        }, { passive: true });
        
        item.addEventListener('touchend', (e) => {
            const touchDuration = Date.now() - touchStartTime;
            
            // Only trigger if:
            // 1. No significant movement (not a scroll)
            // 2. Quick tap (less than 300ms)
            if (!hasMoved && touchDuration < 300) {
                e.preventDefault();
                showHintExplanation(index);
            }
        });
    });
    
    // Close button
    const closeBtn = document.getElementById('close-hint-dialog');
    closeBtn.addEventListener('click', closeHintExplanation);
    closeBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        closeHintExplanation();
    });
    
    // Close on background click
    const dialog = document.getElementById('hint-explanation-dialog');
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
            closeHintExplanation();
        }
    });
}

// Set digit in combination
function setDigit(index, digit) {
    gameState.combination[index] = digit;
    
    // Update display
    const field = document.querySelector(`.digit-field[data-index="${index}"]`);
    const display = field.querySelector('.digit-display');
    display.textContent = digit;
    field.classList.add('filled');
    
    // Update hint statuses
    updateHintStatuses();
    
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
        
        // Update hint statuses
        updateHintStatuses();
        
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

// Reset all combination fields
function resetCombination() {
    if (gameState.isUnlocked) return; // Don't reset if already solved
    
    // Clear all fields
    gameState.combination = [null, null, null, null, null];
    
    // Update all field displays
    document.querySelectorAll('.digit-field').forEach((field, index) => {
        const display = field.querySelector('.digit-display');
        display.textContent = '-';
        field.classList.remove('filled');
    });
    
    // Clear hint statuses
    updateHintStatuses();
    
    // Play click sound
    if (gameState.audio.click) {
        gameState.audio.click();
    }
    
    // Haptic feedback
    try {
        Haptics.impact({ style: ImpactStyle.Medium });
    } catch (e) {
        console.debug('Haptics not available:', e.message);
    }
    
    // Save state
    saveGameState();
    
    // Show notification
    showNotification('تمام ارقام پاک شد', 'info');
}

// Initialize reset button
function initResetButton() {
    const resetBtn = document.getElementById('reset-btn');
    
    resetBtn.addEventListener('click', resetCombination);
    resetBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        resetCombination();
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
    
    // Check if combination is one of the valid solutions
    const isCorrect = gameState.solutions.some(solution => 
        solution.every((digit, index) => digit === gameState.combination[index])
    );
    
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
    
    // Disable buttons
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.classList.add('success');
    submitBtn.disabled = true;
    
    const resetBtn = document.getElementById('reset-btn');
    resetBtn.disabled = true;
    
    // Show success feedback
    const overlay = document.getElementById('feedback-overlay');
    overlay.className = 'success';
    overlay.style.display = 'block';
    setTimeout(() => overlay.style.display = 'none', 500);
    
    // Success animation for all fields
    document.querySelectorAll('.digit-field').forEach((field, i) => {
        setTimeout(() => {
            field.classList.add('success');
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
    // Generate reward answer from the solution (use first valid solution)
    const solution = gameState.solutions[0];
    const rewardAnswer = solution.join(''); // Show combination as-is
    
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
        <div style="font-size: 2.5rem; font-family: 'Courier New', monospace; letter-spacing: 5px; direction: ltr;">${rewardAnswer}</div>
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
            
            // Update hint statuses based on loaded state
            updateHintStatuses();
            
            // Restore unlocked state
            if (gameState.isUnlocked) {
                const lockIcon = document.getElementById('lock-icon');
                lockIcon.textContent = '🔓';
                lockIcon.classList.remove('locked');
                lockIcon.classList.add('unlocked');
                
                const submitBtn = document.getElementById('submit-btn');
                submitBtn.disabled = true;
                submitBtn.classList.add('success');
                
                const resetBtn = document.getElementById('reset-btn');
                resetBtn.disabled = true;
            }
        } catch (e) {
            console.error('Failed to load game state:', e);
            // Clear potentially corrupted saved data and reset to a safe default
            localStorage.removeItem('combinational-lock-game');
            gameState.combination = [null, null, null, null, null];
            gameState.disabledDigits = new Set();
            gameState.isUnlocked = false;
            // Ensure hints and UI are in a consistent initial state
            updateHintStatuses();
            // Inform the user that their saved progress could not be loaded
            showNotification('پیشرفت ذخیره‌شده قابل بارگذاری نبود و بازنشانی شد.', 'error');
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

// Initialize sticky behavior for combination input
function initStickyBehavior() {
    const header = document.querySelector('header');
    const combinationInput = document.getElementById('combination-input');
    
    if (!header || !combinationInput) {
        console.error('Header or combination input not found');
        return;
    }
    
    // Function to update header height CSS variable
    function updateHeaderHeight() {
        const headerHeight = header.offsetHeight;
        console.log('Header height:', headerHeight); // Debug log
        document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);
    }
    
    // Update on load and keep in sync with header size changes
    updateHeaderHeight();
    
    if (typeof ResizeObserver !== 'undefined') {
        const resizeObserver = new ResizeObserver(() => {
            updateHeaderHeight();
        });
        resizeObserver.observe(header);
    }
    
    window.addEventListener('resize', updateHeaderHeight);
    
    // Track initial position of combination input
    let combinationInputTop = null;
    
    // Intersection observer to detect when combination input becomes sticky
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                // When not intersecting with its original position, it's sticky
                if (!entry.isIntersecting) {
                    combinationInput.classList.add('sticky');
                } else {
                    combinationInput.classList.remove('sticky');
                }
            });
        },
        {
            threshold: [1],
            rootMargin: `-${header.offsetHeight + 10}px 0px 0px 0px`
        }
    );
    
    // Create a sentinel element to track original position
    const sentinel = document.createElement('div');
    sentinel.style.height = '1px';
    sentinel.style.pointerEvents = 'none';
    combinationInput.parentNode.insertBefore(sentinel, combinationInput);
    
    observer.observe(sentinel);
}

// Initialize game
function initGame() {
    // First, solve the puzzle to find all valid solutions
    console.log('Solving puzzle...');
    gameState.solutions = solvePuzzle(PUZZLE_HINTS);
    console.log(`Found ${gameState.solutions.length} valid solution(s):`, gameState.solutions);
    
    if (gameState.solutions.length === 0) {
        console.error('No valid solutions found for the given hints!');
        showNotification('خطا: هیچ راه‌حلی یافت نشد', 'error');
    }
    
    initAudio();
    initDigitFields();
    initNumpad();
    initSubmitButton();
    initResetButton();
    initHintListeners();
    initBackButton();
    loadGameState();
    initStickyBehavior();
    
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
