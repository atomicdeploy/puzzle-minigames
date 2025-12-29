// Constants
const PUZZLE_NUMBER = 3; // This minigame unlocks puzzle piece 3
const CORRECT_PASSWORD = 'حقیقت در سکوت است'; // The Persian phrase
const CORRECT_ORDER = {
    top: 'Zoom',
    middle: 'Escape',
    bottom: 'Infernal'
};

// Game state
let currentStage = 1;
let isGameComplete = false;
let currentOrder = {
    top: null,
    middle: null,
    bottom: null
};

// Initialize the game
function init() {
    setupEventListeners();
    showStage(1);
}

// Setup event listeners
function setupEventListeners() {
    // Stage 1: Password submission
    const passwordInput = document.getElementById('password-input');
    const passwordSubmit = document.getElementById('password-submit');
    
    passwordSubmit.addEventListener('click', handlePasswordSubmit);
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handlePasswordSubmit();
        }
    });
    
    // Stage 2: Drag and drop
    setupDragAndDrop();
    
    // Stage 2: Order submission
    const orderSubmit = document.getElementById('order-submit');
    orderSubmit.addEventListener('click', handleOrderSubmit);
}

// Handle password submission
function handlePasswordSubmit() {
    if (isGameComplete || currentStage !== 1) return;
    
    const passwordInput = document.getElementById('password-input');
    const password = passwordInput.value.trim();
    
    if (!password) {
        showFeedback('لطفا رمز عبور را وارد کنید', 'error');
        return;
    }
    
    if (password === CORRECT_PASSWORD) {
        handleCorrectPassword();
    } else {
        handleIncorrectPassword();
    }
}

// Handle correct password
function handleCorrectPassword() {
    showFeedback('🎉 آفرین! رمز صحیح است! 🎉', 'success');
    
    // Disable password input
    document.getElementById('password-input').disabled = true;
    document.getElementById('password-submit').disabled = true;
    
    // Move to stage 2 after a delay
    setTimeout(() => {
        currentStage = 2;
        showStage(2);
    }, 2000);
}

// Handle incorrect password
function handleIncorrectPassword() {
    showFeedback('❌ رمز عبور اشتباه است! دوباره تلاش کنید', 'error');
    
    // Shake the input
    const passwordInput = document.getElementById('password-input');
    passwordInput.style.animation = 'none';
    setTimeout(() => {
        passwordInput.style.animation = 'shake 0.5s ease';
    }, 10);
}

// Setup drag and drop functionality
function setupDragAndDrop() {
    const wordCards = document.querySelectorAll('.word-card');
    const dropZones = document.querySelectorAll('.drop-zone');
    
    // Drag events for word cards
    wordCards.forEach(card => {
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);
        
        // Touch events for mobile
        card.addEventListener('touchstart', handleTouchStart, { passive: false });
        card.addEventListener('touchmove', handleTouchMove, { passive: false });
        card.addEventListener('touchend', handleTouchEnd, { passive: false });
    });
    
    // Drop events for drop zones
    dropZones.forEach(zone => {
        zone.addEventListener('dragover', handleDragOver);
        zone.addEventListener('dragleave', handleDragLeave);
        zone.addEventListener('drop', handleDrop);
    });
}

// Drag and drop handlers
let draggedElement = null;
let touchElement = null;
let touchClone = null;

function handleDragStart(e) {
    draggedElement = e.currentTarget;
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
}

function handleDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
    draggedElement = null;
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('drag-over');
    return false;
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    e.preventDefault();
    
    const zone = e.currentTarget;
    zone.classList.remove('drag-over');
    
    if (draggedElement) {
        placeWordInZone(draggedElement, zone);
    }
    
    return false;
}

// Touch handlers for mobile
function handleTouchStart(e) {
    touchElement = e.currentTarget;
    touchElement.classList.add('dragging');
    
    // Create a clone for visual feedback
    touchClone = touchElement.cloneNode(true);
    touchClone.style.position = 'fixed';
    touchClone.style.pointerEvents = 'none';
    touchClone.style.zIndex = '10000';
    touchClone.style.opacity = '0.8';
    touchClone.style.transform = 'scale(1.1)';
    document.body.appendChild(touchClone);
    
    updateTouchClonePosition(e.touches[0]);
}

function handleTouchMove(e) {
    if (!touchElement || !touchClone) return;
    e.preventDefault();
    
    updateTouchClonePosition(e.touches[0]);
}

function handleTouchEnd(e) {
    if (!touchElement || !touchClone) return;
    e.preventDefault();
    
    const touch = e.changedTouches[0];
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    
    // Find the drop zone
    let dropZone = elementBelow;
    while (dropZone && !dropZone.classList.contains('drop-zone')) {
        dropZone = dropZone.parentElement;
    }
    
    if (dropZone && dropZone.classList.contains('drop-zone')) {
        placeWordInZone(touchElement, dropZone);
    }
    
    // Clean up
    touchElement.classList.remove('dragging');
    touchClone.remove();
    touchElement = null;
    touchClone = null;
}

function updateTouchClonePosition(touch) {
    if (!touchClone) return;
    touchClone.style.left = `${touch.clientX - 50}px`;
    touchClone.style.top = `${touch.clientY - 25}px`;
}

// Place word in drop zone
function placeWordInZone(wordCard, zone) {
    const position = zone.dataset.position;
    const word = wordCard.dataset.word;
    const zoneContent = zone.querySelector('.zone-content');
    
    // If zone already has a word, return it to pool
    if (currentOrder[position]) {
        const existingWord = currentOrder[position];
        returnWordToPool(existingWord);
    }
    
    // Move word to zone
    const wordClone = wordCard.cloneNode(true);
    wordClone.draggable = false;
    wordClone.classList.remove('dragging');
    
    // Add click to remove functionality
    wordClone.addEventListener('click', () => {
        returnWordToPool(word);
        currentOrder[position] = null;
        zoneContent.innerHTML = '';
        zone.classList.remove('filled');
    });
    
    zoneContent.innerHTML = '';
    zoneContent.appendChild(wordClone);
    currentOrder[position] = word;
    zone.classList.add('filled');
    
    // Hide original word in pool
    wordCard.classList.add('hidden');
}

// Return word to pool
function returnWordToPool(word) {
    const wordCards = document.querySelectorAll('.word-card');
    wordCards.forEach(card => {
        if (card.dataset.word === word) {
            card.classList.remove('hidden');
        }
    });
}

// Handle order submission
function handleOrderSubmit() {
    if (isGameComplete || currentStage !== 2) return;
    
    // Check if all positions are filled
    if (!currentOrder.top || !currentOrder.middle || !currentOrder.bottom) {
        showFeedback('لطفا همه موقعیت‌ها را پر کنید', 'error');
        return;
    }
    
    // Check if order is correct
    if (currentOrder.top === CORRECT_ORDER.top &&
        currentOrder.middle === CORRECT_ORDER.middle &&
        currentOrder.bottom === CORRECT_ORDER.bottom) {
        handleCorrectOrder();
    } else {
        handleIncorrectOrder();
    }
}

// Handle correct order
function handleCorrectOrder() {
    isGameComplete = true;
    
    showFeedback('🎉 عالی! ترتیب صحیح است! پازل باز شد! 🎉', 'success');
    playConfetti();
    
    // Disable order submit button
    document.getElementById('order-submit').disabled = true;
    
    // Notify parent window
    setTimeout(() => {
        window.parent.postMessage({
            type: 'minigame-complete',
            success: true,
            puzzleNumber: PUZZLE_NUMBER
        }, window.location.origin);
    }, 3000);
}

// Handle incorrect order
function handleIncorrectOrder() {
    showFeedback('❌ ترتیب اشتباه است! دوباره تلاش کنید', 'error');
    
    // Shake the submit button
    const submitButton = document.getElementById('order-submit');
    submitButton.style.animation = 'none';
    setTimeout(() => {
        submitButton.style.animation = 'shake 0.5s ease';
    }, 10);
}

// Show specific stage
function showStage(stageNumber) {
    const stages = document.querySelectorAll('.stage');
    stages.forEach((stage, index) => {
        if (index + 1 === stageNumber) {
            stage.classList.add('active');
        } else {
            stage.classList.remove('active');
        }
    });
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
    const colors = ['#6c5ce7', '#fd79a8', '#00b894', '#4ecdc4', '#ffe66d', '#ff6b6b'];
    
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

// Initialize game when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
