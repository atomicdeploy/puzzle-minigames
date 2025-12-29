// Constants
const CORRECT_ANSWER = 15; // The actual answer based on the puzzle sequence
const PUZZLE_NUMBER = 3;
const MAX_SCORE = 99;
const MIN_SCORE = 0;

// Seven segment patterns for digits 0-9
const SEGMENT_PATTERNS = {
    0: [true, true, true, true, true, true, false],    // a,b,c,d,e,f,g
    1: [false, true, true, false, false, false, false],
    2: [true, true, false, true, true, false, true],
    3: [true, true, true, true, false, false, true],
    4: [false, true, true, false, false, true, true],
    5: [true, false, true, true, false, true, true],
    6: [true, false, true, true, true, true, true],
    7: [true, true, true, false, false, false, false],
    8: [true, true, true, true, true, true, true],
    9: [true, true, true, true, false, true, true]
};

// Game state
let currentScore = 0;
let isGameComplete = false;

// Footstep sequence (positions will be calculated based on court size)
// Each entry: { x: percentage, y: percentage, line: line number from center }
// Orange line (center) is line 0, negative is left, positive is right
const footstepSequence = [
    { line: 0, order: 1 },   // Start at center (0 points)
    { line: 3, order: 2 },   // 3 steps right (3 points)
    { line: 5, order: 3 },   // 2 more steps right (5 points total)
    { line: 2, order: 4 },   // 3 steps back left (2 points)
    { line: 7, order: 5 },   // 5 steps right (7 points)
    { line: 8, order: 6 },   // 1 step right (8 points)
    { line: 3, order: 7 },   // 5 steps back left (3 points)
    { line: 8, order: 8 },   // 5 steps right (8 points)
    { line: 15, order: 9 }   // 7 steps right - FINAL SCORE: 15 points!
];

// Initialize the game
function init() {
    drawBasketballCourt();
    createFootsteps();
    setupEventListeners();
    updateSevenSegmentDisplay(currentScore);
    
    // Start the radar effect animation
    animateRadar();
    
    // Animate footsteps appearing one by one
    animateFootstepsSequence();
}

// Draw basketball court on canvas
function drawBasketballCourt() {
    const canvas = document.getElementById('basketball-court');
    const ctx = canvas.getContext('2d');
    const container = document.getElementById('court-container');
    
    // Set canvas size
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Draw court background
    ctx.fillStyle = 'rgba(193, 123, 58, 0.3)';
    ctx.fillRect(0, 0, width, height);
    
    // Draw horizontal lines (parallel to the orange center line)
    const lineSpacing = width / 20; // Space between lines
    const numLines = 10;
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    
    for (let i = -numLines; i <= numLines; i++) {
        const x = centerX + (i * lineSpacing);
        
        // Orange center line (starting point - line 0)
        if (i === 0) {
            ctx.strokeStyle = 'rgba(255, 140, 66, 0.8)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
            
            // Add spotlight effect on orange line
            const gradient = ctx.createRadialGradient(x, centerY, 0, x, centerY, width / 3);
            gradient.addColorStop(0, 'rgba(255, 140, 66, 0.3)');
            gradient.addColorStop(1, 'rgba(255, 140, 66, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 1;
        } else {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
    }
    
    // Draw three-point arc (decorative)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, height - 50, width / 4, 0, Math.PI, true);
    ctx.stroke();
    
    // Draw basketball hoop
    ctx.strokeStyle = 'rgba(255, 107, 107, 0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, height - 50, 15, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw backboard
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(centerX - 40, height - 30);
    ctx.lineTo(centerX + 40, height - 30);
    ctx.stroke();
    
    // Add line numbers for some reference lines
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = 'bold 12px Vazirmatn';
    ctx.textAlign = 'center';
    
    for (let i of [0, 3, 5, 7, 10, 15]) {
        const x = centerX + (i * lineSpacing);
        if (x >= 0 && x <= width) {
            ctx.fillText(i.toString(), x, 20);
        }
    }
    
    // Handle window resize
    window.addEventListener('resize', () => {
        drawBasketballCourt();
        updateFootstepPositions();
    });
}

// Create footsteps on the court
function createFootsteps() {
    const container = document.getElementById('footsteps-layer');
    const courtContainer = document.getElementById('court-container');
    const width = courtContainer.clientWidth;
    const height = courtContainer.clientHeight;
    const centerX = width / 2;
    const lineSpacing = width / 20;
    
    footstepSequence.forEach((step, index) => {
        const footstep = document.createElement('div');
        footstep.className = 'footstep';
        footstep.textContent = '👣';
        footstep.dataset.order = step.order;
        footstep.dataset.line = step.line;
        
        // Calculate position
        const x = centerX + (step.line * lineSpacing);
        const y = height * 0.3 + (index * (height * 0.05)); // Stagger vertically
        
        footstep.style.left = `${x}px`;
        footstep.style.top = `${y}px`;
        footstep.style.transform = 'translate(-50%, -50%)';
        
        // Initially hidden for animation
        footstep.style.opacity = '0';
        
        container.appendChild(footstep);
    });
}

// Update footstep positions on resize
function updateFootstepPositions() {
    const courtContainer = document.getElementById('court-container');
    const width = courtContainer.clientWidth;
    const height = courtContainer.clientHeight;
    const centerX = width / 2;
    const lineSpacing = width / 20;
    
    const footsteps = document.querySelectorAll('.footstep');
    footsteps.forEach((footstep, index) => {
        const line = parseInt(footstep.dataset.line);
        const x = centerX + (line * lineSpacing);
        const y = height * 0.3 + (index * (height * 0.05));
        
        footstep.style.left = `${x}px`;
        footstep.style.top = `${y}px`;
    });
}

// Animate footsteps appearing one by one
function animateFootstepsSequence() {
    const footsteps = document.querySelectorAll('.footstep');
    
    footsteps.forEach((footstep, index) => {
        setTimeout(() => {
            footstep.style.opacity = '1';
            footstep.style.animation = 'footstep-appear 0.5s ease-out';
            
            // Highlight the last footstep
            if (index === footsteps.length - 1) {
                setTimeout(() => {
                    footstep.classList.add('highlight');
                }, 500);
            }
        }, index * 300);
    });
}

// Animate radar effect
function animateRadar() {
    const radar = document.getElementById('radar-effect');
    // The animation is handled by CSS, just ensure it's visible
}

// Setup event listeners
function setupEventListeners() {
    const increaseBtn = document.getElementById('increase-btn');
    const decreaseBtn = document.getElementById('decrease-btn');
    const submitBtn = document.getElementById('submit-btn');
    
    increaseBtn.addEventListener('click', () => changeScore(1));
    decreaseBtn.addEventListener('click', () => changeScore(-1));
    submitBtn.addEventListener('click', handleSubmit);
    
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if (isGameComplete) return;
        
        if (e.key === 'ArrowUp' || e.key === '+') {
            changeScore(1);
        } else if (e.key === 'ArrowDown' || e.key === '-') {
            changeScore(-1);
        } else if (e.key === 'Enter') {
            handleSubmit();
        }
    });
}

// Change score value
function changeScore(delta) {
    if (isGameComplete) return;
    
    currentScore = Math.max(MIN_SCORE, Math.min(MAX_SCORE, currentScore + delta));
    updateSevenSegmentDisplay(currentScore);
    
    // Play a subtle sound or haptic feedback
    playClickSound();
}

// Update seven segment display
function updateSevenSegmentDisplay(value) {
    const digits = document.querySelectorAll('.digit');
    const valueStr = value.toString().padStart(2, '0');
    
    digits.forEach((digit, index) => {
        const digitValue = parseInt(valueStr[index]);
        const pattern = SEGMENT_PATTERNS[digitValue];
        
        digit.dataset.value = digitValue;
        
        const segments = digit.querySelectorAll('.segment');
        segments.forEach((segment, segIndex) => {
            if (pattern[segIndex]) {
                segment.classList.add('active');
            } else {
                segment.classList.remove('active');
            }
        });
    });
}

// Handle submit button click
function handleSubmit() {
    if (isGameComplete) return;
    
    if (currentScore === CORRECT_ANSWER) {
        handleCorrectAnswer();
    } else {
        handleIncorrectAnswer();
    }
}

// Handle correct answer
function handleCorrectAnswer() {
    isGameComplete = true;
    
    showFeedback('🎉 عالی! پاسخ صحیح است! 🏀', 'success');
    playConfetti();
    
    // Disable controls
    document.getElementById('increase-btn').disabled = true;
    document.getElementById('decrease-btn').disabled = true;
    document.getElementById('submit-btn').disabled = true;
    
    // Highlight all footsteps
    const footsteps = document.querySelectorAll('.footstep');
    footsteps.forEach(footstep => {
        footstep.classList.add('highlight');
    });
    
    // Notify parent window
    setTimeout(() => {
        if (window.parent !== window) {
            window.parent.postMessage({
                type: 'minigame-complete',
                success: true,
                puzzleNumber: PUZZLE_NUMBER,
                answer: CORRECT_ANSWER
            }, window.location.origin);
        }
    }, 3000);
}

// Handle incorrect answer
function handleIncorrectAnswer() {
    const diff = Math.abs(currentScore - CORRECT_ANSWER);
    let message = '❌ پاسخ اشتباه است! ';
    
    if (diff <= 3) {
        message += 'خیلی نزدیک هستید! 🔥';
    } else if (diff <= 7) {
        message += 'نزدیک‌تر شوید! 🎯';
    } else {
        message += 'دوباره رد پا‌ها را بررسی کنید! 👣';
    }
    
    showFeedback(message, 'error');
    
    // Shake the display
    const display = document.getElementById('seven-segment-display');
    display.style.animation = 'shake 0.5s ease';
    setTimeout(() => {
        display.style.animation = '';
    }, 500);
}

// Show feedback message
function showFeedback(message, type) {
    const feedback = document.getElementById('feedback');
    feedback.textContent = message;
    feedback.className = `feedback ${type}`;
    
    setTimeout(() => {
        feedback.classList.add('hidden');
    }, 3000);
}

// Play confetti animation
function playConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const confetti = [];
    const confettiCount = 200;
    const colors = ['#ff8c42', '#ff6b6b', '#00b894', '#4ecdc4', '#fdcb6e', '#6c5ce7'];
    
    for (let i = 0; i < confettiCount; i++) {
        confetti.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            r: Math.random() * 6 + 4,
            d: Math.random() * confettiCount,
            color: colors[Math.floor(Math.random() * colors.length)],
            tilt: Math.floor(Math.random() * 10) - 10,
            tiltAngleIncrement: Math.random() * 0.07 + 0.05,
            tiltAngle: 0
        });
    }
    
    function drawConfetti() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        for (let i = 0; i < confetti.length; i++) {
            const c = confetti[i];
            ctx.beginPath();
            ctx.lineWidth = c.r / 2;
            ctx.strokeStyle = c.color;
            ctx.moveTo(c.x + c.tilt + c.r / 4, c.y);
            ctx.lineTo(c.x + c.tilt, c.y + c.tilt + c.r / 4);
            ctx.stroke();
        }
        
        updateConfetti();
    }
    
    function updateConfetti() {
        let stillActive = false;
        
        for (let i = 0; i < confetti.length; i++) {
            const c = confetti[i];
            c.tiltAngle += c.tiltAngleIncrement;
            c.y += (Math.cos(c.d) + 3 + c.r / 2) / 2;
            c.x += Math.sin(c.d);
            c.tilt = Math.sin(c.tiltAngle - i / 3) * 15;
            
            if (c.y <= canvas.height) {
                stillActive = true;
            }
        }
        
        if (stillActive) {
            requestAnimationFrame(drawConfetti);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
    
    drawConfetti();
}

// Play click sound using Web Audio API
function playClickSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
        // Silent fail if audio context is not available
    }
}

// Initialize game when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
