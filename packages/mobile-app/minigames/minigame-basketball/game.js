// Constants
const CORRECT_ANSWER = '00000'; // Will be checked as combination
const PUZZLE_NUMBER = 'basketball';
const MAX_DIGIT = 9;
const MIN_DIGIT = 0;

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
let digitValues = [0, 0, 0, 0, 0]; // Five individual digit values (0-9 each)
let selectedDigitIndex = 0; // Currently selected digit for +/- controls
let isGameComplete = false;
let audioContext = null; // Reusable AudioContext instance
let draggedFootstep = null;

// User-draggable footsteps - 5 total, can be placed on decimal and negative lines
let userFootsteps = [
    { line: -1, row: 0.75, order: 1, id: 'footstep-1' },
    { line: 0, row: 0.25, order: 2, id: 'footstep-2' },
    { line: 1, row: 0.4, order: 3, id: 'footstep-3' },
    { line: 3, row: 0.5, order: 4, id: 'footstep-4' },
    { line: 1, row: 0.65, order: 5, id: 'footstep-5' }
];

// Initialize the game
function init() {
    drawBasketballCourt();
    loadFootstepsFromStorage(); // Load saved positions before creating footsteps
    createFootsteps();
    setupEventListeners();
    setupResizeHandler();
    updateAllDigits();
    
    // Initialize AudioContext once
    initAudioContext();
    
    // Setup digit click handlers for selection
    setupDigitSelection();
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
    
    // Draw horizontal lines (vertical lines for positioning)
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
    
    // Draw horizontal dotted lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]); // Create dotted pattern
    
    const numHorizontalLines = 8;
    for (let i = 1; i < numHorizontalLines; i++) {
        const y = (height / numHorizontalLines) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
    
    ctx.setLineDash([]); // Reset to solid lines
    
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
    
    // Add line numbers - only odd numbers
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = 'bold 12px Vazirmatn';
    ctx.textAlign = 'center';
    
    // Show odd line numbers only (display negative numbers as positive)
    for (let i of [-9, -7, -5, -3, -1, 1, 3, 5, 7, 9, 11, 13, 15]) {
        const x = centerX + (i * lineSpacing);
        if (x >= 0 && x <= width) {
            ctx.fillText(Math.abs(i).toString(), x, 20);
        }
    }
}

// Setup resize handler (called once during initialization)
let resizeHandlerAttached = false;

function setupResizeHandler() {
    if (!resizeHandlerAttached) {
        window.addEventListener('resize', () => {
            drawBasketballCourt();
            updateFootstepPositions();
        });
        resizeHandlerAttached = true;
    }
}

// Create footsteps on the court - draggable by user (5 total)
function createFootsteps() {
    const container = document.getElementById('footsteps-layer');
    const courtContainer = document.getElementById('court-container');
    const width = courtContainer.clientWidth;
    const height = courtContainer.clientHeight;
    const centerX = width / 2;
    const lineSpacing = width / 20;
    
    userFootsteps.forEach((step, index) => {
        const footstep = document.createElement('div');
        footstep.className = 'footstep draggable';
        
        // Display footstep ID number (hidden initially) and emoji
        footstep.innerHTML = `<span class="footstep-id">${step.order}</span>👣`;
        
        footstep.dataset.order = step.order;
        footstep.dataset.line = step.line;
        footstep.dataset.row = step.row;
        footstep.dataset.id = step.id;
        footstep.id = step.id;
        footstep.draggable = true;
        
        // Calculate position using stored row value
        const x = centerX + (step.line * lineSpacing);
        const y = height * step.row;
        
        footstep.style.left = `${x}px`;
        footstep.style.top = `${y}px`;
        footstep.style.transform = 'translate(-50%, -50%)';
        footstep.style.cursor = 'move';
        footstep.style.animationDelay = `${index * 0.15}s`; // Stagger animation
        
        // Add drag event listeners
        footstep.addEventListener('dragstart', handleDragStart);
        footstep.addEventListener('dragend', handleDragEnd);
        
        // Touch support
        footstep.addEventListener('touchstart', handleTouchStart, { passive: false });
        footstep.addEventListener('touchmove', handleTouchMove, { passive: false });
        footstep.addEventListener('touchend', handleTouchEnd);
        
        container.appendChild(footstep);
    });
    
    // Make court container a drop zone
    const court = document.getElementById('basketball-court');
    court.addEventListener('dragover', handleDragOver);
    court.addEventListener('drop', handleDrop);
}

// Drag and drop handlers
function handleDragStart(e) {
    draggedFootstep = e.target;
    e.target.style.opacity = '0.5';
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.innerHTML);
}

function handleDragEnd(e) {
    e.target.style.opacity = '1';
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    e.preventDefault();
    
    if (draggedFootstep) {
        const courtContainer = document.getElementById('court-container');
        const rect = courtContainer.getBoundingClientRect();
        const width = courtContainer.clientWidth;
        const height = courtContainer.clientHeight;
        const centerX = width / 2;
        const lineSpacing = width / 20;
        
        // Calculate which line the drop position corresponds to
        const dropX = e.clientX - rect.left;
        const dropY = e.clientY - rect.top;
        const relativeX = dropX - centerX;
        const newLine = Math.round((relativeX / lineSpacing) * 2) / 2; // Round to nearest 0.5
        const newRow = dropY / height; // Store as fraction of height
        
        // Update footstep position
        draggedFootstep.dataset.line = newLine;
        draggedFootstep.dataset.row = newRow;
        const x = centerX + (newLine * lineSpacing);
        const y = dropY;
        
        draggedFootstep.style.left = `${x}px`;
        draggedFootstep.style.top = `${y}px`;
        
        // Update userFootsteps array
        const id = draggedFootstep.dataset.id;
        const footstep = userFootsteps.find(f => f.id === id);
        if (footstep) {
            footstep.line = newLine;
            footstep.row = newRow;
            console.log(`Footstep ${footstep.order} moved to line ${newLine}, row ${newRow.toFixed(3)}`);
            console.log('Current footstep positions:', userFootsteps.map(f => ({ order: f.order, line: f.line, row: f.row })));
            saveFootstepsToStorage();
        }
        
        playClickSound();
    }
    
    return false;
}

// Touch handlers for mobile
let touchStartX, touchStartY;

function handleTouchStart(e) {
    draggedFootstep = e.target;
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    e.target.style.opacity = '0.7';
}

function handleTouchMove(e) {
    e.preventDefault();
    if (!draggedFootstep) return;
    
    const touch = e.touches[0];
    const courtContainer = document.getElementById('court-container');
    const rect = courtContainer.getBoundingClientRect();
    
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    draggedFootstep.style.left = `${x}px`;
    draggedFootstep.style.top = `${y}px`;
}

function handleTouchEnd(e) {
    if (!draggedFootstep) return;
    
    const courtContainer = document.getElementById('court-container');
    const rect = courtContainer.getBoundingClientRect();
    const width = courtContainer.clientWidth;
    const height = courtContainer.clientHeight;
    const centerX = width / 2;
    const lineSpacing = width / 20;
    
    const currentLeft = parseFloat(draggedFootstep.style.left);
    const currentTop = parseFloat(draggedFootstep.style.top);
    const relativeX = currentLeft - centerX;
    const newLine = Math.round((relativeX / lineSpacing) * 2) / 2; // Round to nearest 0.5
    const newRow = currentTop / height; // Store as fraction of height
    
    // Snap to line
    const x = centerX + (newLine * lineSpacing);
    draggedFootstep.style.left = `${x}px`;
    draggedFootstep.dataset.line = newLine;
    draggedFootstep.dataset.row = newRow;
    
    // Update userFootsteps array
    const id = draggedFootstep.dataset.id;
    const footstep = userFootsteps.find(f => f.id === id);
    if (footstep) {
        footstep.line = newLine;
        footstep.row = newRow;
        console.log(`Footstep ${footstep.order} moved to line ${newLine}, row ${newRow.toFixed(3)}`);
        console.log('Current footstep positions:', userFootsteps.map(f => ({ order: f.order, line: f.line, row: f.row })));
        saveFootstepsToStorage();
    }
    
    draggedFootstep.style.opacity = '1';
    draggedFootstep = null;
    
    playClickSound();
}

// Update footstep positions on resize
function updateFootstepPositions() {
    const courtContainer = document.getElementById('court-container');
    const width = courtContainer.clientWidth;
    const height = courtContainer.clientHeight;
    const centerX = width / 2;
    const lineSpacing = width / 20;
    
    const footsteps = document.querySelectorAll('.footstep');
    footsteps.forEach((footstep) => {
        const line = parseFloat(footstep.dataset.line);
        const row = parseFloat(footstep.dataset.row) || 0.3; // Default to 0.3 if not set
        const x = centerX + (line * lineSpacing);
        const y = height * row;
        
        footstep.style.left = `${x}px`;
        footstep.style.top = `${y}px`;
    });
}

// Initialize AudioContext (called once during initialization)
function initAudioContext() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.warn('Web Audio API not supported');
    }
}

// Setup event listeners
function setupEventListeners() {
    const increaseBtn = document.getElementById('increase-btn');
    const decreaseBtn = document.getElementById('decrease-btn');
    const submitBtn = document.getElementById('submit-btn');
    
    increaseBtn.addEventListener('click', () => changeDigitValue(1));
    decreaseBtn.addEventListener('click', () => changeDigitValue(-1));
    submitBtn.addEventListener('click', handleSubmit);
    
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if (isGameComplete) return;
        
        if (e.key === 'ArrowUp' || e.key === '+') {
            changeDigitValue(1);
        } else if (e.key === 'ArrowDown' || e.key === '-') {
            changeDigitValue(-1);
        } else if (e.key === 'ArrowLeft') {
            selectPreviousDigit();
        } else if (e.key === 'ArrowRight') {
            selectNextDigit();
        } else if (e.key === 'Enter') {
            handleSubmit();
        } else if (e.key >= '0' && e.key <= '9') {
            setDigitValue(parseInt(e.key));
        }
    });
}

// Setup digit selection (click to select which digit to change)
function setupDigitSelection() {
    const digits = document.querySelectorAll('.digit');
    digits.forEach((digit, index) => {
        digit.style.cursor = 'pointer';
        digit.addEventListener('click', () => {
            selectDigit(index);
            playClickSound();
        });
    });
    
    // Highlight the first digit initially
    selectDigit(0);
}

// Select a specific digit
function selectDigit(index) {
    selectedDigitIndex = index;
    const digits = document.querySelectorAll('.digit');
    digits.forEach((digit, i) => {
        if (i === index) {
            digit.classList.add('selected');
        } else {
            digit.classList.remove('selected');
        }
    });
}

// Select next digit (move right in RTL layout)
function selectNextDigit() {
    selectedDigitIndex = (selectedDigitIndex + 1) % 5;
    selectDigit(selectedDigitIndex);
    playClickSound();
}

// Select previous digit (move left in RTL layout)
function selectPreviousDigit() {
    selectedDigitIndex = (selectedDigitIndex - 1 + 5) % 5;
    selectDigit(selectedDigitIndex);
    playClickSound();
}

// Change the currently selected digit value
function changeDigitValue(delta) {
    if (isGameComplete) return;
    
    digitValues[selectedDigitIndex] = (digitValues[selectedDigitIndex] + delta + 10) % 10;
    updateDigit(selectedDigitIndex);
    
    // Play a subtle sound or haptic feedback
    playClickSound();
}

// Set the currently selected digit to a specific value
function setDigitValue(value) {
    if (isGameComplete) return;
    
    digitValues[selectedDigitIndex] = value;
    updateDigit(selectedDigitIndex);
    playClickSound();
}

// Update a single digit display
function updateDigit(index) {
    const digits = document.querySelectorAll('.digit');
    const digit = digits[index];
    const digitValue = digitValues[index];
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
}

// Update all digits display
function updateAllDigits() {
    for (let i = 0; i < 5; i++) {
        updateDigit(i);
    }
}

// Handle submit button click
function handleSubmit() {
    if (isGameComplete) return;
    
    const combinationCode = digitValues.join('');
    
    // Check if matches expected answer (can be customized)
    // For now, we'll accept any 5-digit combination and mark as success
    handleCorrectAnswer(combinationCode);
}

// Handle correct answer
function handleCorrectAnswer(combinationCode) {
    isGameComplete = true;
    
    showFeedback('🎉 عالی! رمز ترکیبی ثبت شد! 🏀', 'success');
    playConfetti();
    
    // Reveal footstep ID numbers
    const footstepIds = document.querySelectorAll('.footstep-id');
    footstepIds.forEach(id => {
        id.classList.add('revealed');
    });
    
    // Disable controls
    document.getElementById('increase-btn').disabled = true;
    document.getElementById('decrease-btn').disabled = true;
    document.getElementById('submit-btn').disabled = true;
    
    // Disable digit selection
    const digits = document.querySelectorAll('.digit');
    digits.forEach(digit => {
        digit.style.cursor = 'default';
        digit.style.pointerEvents = 'none';
    });
    
    // Notify parent window with the combination code
    setTimeout(() => {
        if (window.parent !== window) {
            window.parent.postMessage({
                type: 'minigame-complete',
                success: true,
                puzzleNumber: PUZZLE_NUMBER,
                answer: combinationCode
            }, window.location.origin);
        }
    }, 3000);
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
    if (!audioContext) return;
    
    try {
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
        // Silent fail if audio playback fails
    }
}

// Save footstep positions to localStorage
function saveFootstepsToStorage() {
    try {
        const positions = userFootsteps.map(f => ({ id: f.id, line: f.line, row: f.row, order: f.order }));
        localStorage.setItem('basketball-footsteps', JSON.stringify(positions));
        console.log('Footstep positions saved to localStorage');
    } catch (e) {
        console.error('Failed to save footstep positions:', e);
    }
}

// Load footstep positions from localStorage
function loadFootstepsFromStorage() {
    try {
        const saved = localStorage.getItem('basketball-footsteps');
        if (saved) {
            const positions = JSON.parse(saved);
            positions.forEach(savedPos => {
                const footstep = userFootsteps.find(f => f.id === savedPos.id);
                if (footstep) {
                    footstep.line = savedPos.line;
                    footstep.row = savedPos.row !== undefined ? savedPos.row : footstep.row; // Use saved row or keep default
                }
            });
            console.log('Footstep positions loaded from localStorage:', positions);
        }
    } catch (e) {
        console.error('Failed to load footstep positions:', e);
    }
}

// Initialize game when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
