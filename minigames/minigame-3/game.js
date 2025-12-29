// Constants
const PUZZLE_NUMBER = 3;
const GAME_DURATION = 30; // seconds
const BALL_RADIUS = 20;
const BALL_SPEED = 3;
const GRAVITY = 0.5;
const PITCH_SMOOTHING = 0.7; // Higher = smoother but slower response
const MIN_VOLUME_THRESHOLD = 0.01; // Minimum volume to detect sound

// Pitch ranges (in Hz) mapped to directions
const PITCH_RANGES = {
    LEFT: { min: 0, max: 150, name: 'چپ ⬅️' },      // Very low pitch
    DOWN: { min: 150, max: 250, name: 'پایین ⬇️' },  // Low pitch
    UP: { min: 250, max: 400, name: 'بالا ⬆️' },     // Medium pitch
    RIGHT: { min: 400, max: 1000, name: 'راست ➡️' }  // High pitch
};

// Game state
let gameState = {
    isPlaying: false,
    isPaused: false,
    score: 0,
    timeRemaining: GAME_DURATION,
    ball: {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0
    },
    currentDirection: null,
    lastPitch: 0
};

// Audio/Microphone state
let audioContext = null;
let analyser = null;
let microphone = null;
let audioDataArray = null;
let pitchDetectionInterval = null;

// Canvas
let canvas, ctx;
let canvasWidth, canvasHeight;

// UI Elements
let startBtn, micBtn, scoreDisplay, timerDisplay;
let pitchLevel, currentDirectionDisplay;
let feedbackDiv;

// Timer
let gameTimer = null;

// Initialize the game
function init() {
    console.log('Initializing Audio-Controlled Minigame...');
    
    // Get canvas and context
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Get UI elements
    startBtn = document.getElementById('start-btn');
    micBtn = document.getElementById('mic-btn');
    scoreDisplay = document.getElementById('score');
    timerDisplay = document.getElementById('timer');
    pitchLevel = document.getElementById('pitch-level');
    currentDirectionDisplay = document.getElementById('current-direction');
    feedbackDiv = document.getElementById('feedback');
    
    // Setup event listeners
    startBtn.addEventListener('click', handleStart);
    micBtn.addEventListener('click', handleMicToggle);
    
    // Initialize ball position (center)
    resetBall();
    
    // Draw initial state
    drawGame();
}

function resizeCanvas() {
    const container = document.getElementById('canvas-container');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    canvasWidth = canvas.width;
    canvasHeight = canvas.height;
    
    // Reposition ball if needed
    if (gameState.ball.x === 0 && gameState.ball.y === 0) {
        resetBall();
    }
}

function resetBall() {
    gameState.ball.x = canvasWidth / 2;
    gameState.ball.y = canvasHeight / 2;
    gameState.ball.vx = (Math.random() - 0.5) * 2;
    gameState.ball.vy = (Math.random() - 0.5) * 2;
}

async function handleStart() {
    console.log('Start button clicked');
    startBtn.disabled = true;
    
    // Request microphone access
    try {
        await initMicrophone();
        startGame();
    } catch (error) {
        console.error('Error starting game:', error);
        showFeedback('خطا در دسترسی به میکروفون', 'error');
        startBtn.disabled = false;
    }
}

async function initMicrophone() {
    console.log('Requesting microphone access...');
    
    try {
        // Request microphone permission
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: false
            } 
        });
        
        // Create audio context
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        
        // Connect microphone to analyser
        microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        
        // Create data array for pitch detection
        audioDataArray = new Float32Array(analyser.fftSize);
        
        console.log('Microphone initialized successfully');
        micBtn.classList.remove('hidden');
        micBtn.classList.add('active');
        document.getElementById('mic-text').textContent = 'میکروفون فعال است';
        
        return true;
    } catch (error) {
        console.error('Microphone initialization failed:', error);
        throw new Error('دسترسی به میکروفون رد شد. لطفاً اجازه دسترسی را بدهید.');
    }
}

function handleMicToggle() {
    // This button is just for display, actual mic control happens in initMicrophone
    console.log('Mic button clicked (display only)');
}

function startGame() {
    console.log('Starting game...');
    
    gameState.isPlaying = true;
    gameState.isPaused = false;
    gameState.score = 0;
    gameState.timeRemaining = GAME_DURATION;
    
    resetBall();
    updateUI();
    
    // Hide start button, show mic button
    startBtn.classList.add('hidden');
    
    // Start pitch detection
    startPitchDetection();
    
    // Start game timer
    gameTimer = setInterval(() => {
        gameState.timeRemaining--;
        updateUI();
        
        if (gameState.timeRemaining <= 0) {
            endGame(true);
        }
    }, 1000);
    
    // Start game loop
    gameLoop();
}

function startPitchDetection() {
    console.log('Starting pitch detection...');
    
    pitchDetectionInterval = setInterval(() => {
        if (!gameState.isPlaying || !analyser) return;
        
        // Get audio data
        analyser.getFloatTimeDomainData(audioDataArray);
        
        // Check volume level
        const volume = getVolume(audioDataArray);
        
        if (volume < MIN_VOLUME_THRESHOLD) {
            // No sound detected
            gameState.currentDirection = null;
            currentDirectionDisplay.textContent = '---';
            pitchLevel.style.width = '0%';
            return;
        }
        
        // Detect pitch using autocorrelation
        const pitch = autoCorrelate(audioDataArray, audioContext.sampleRate);
        
        if (pitch > 0) {
            // Smooth pitch value
            gameState.lastPitch = gameState.lastPitch * PITCH_SMOOTHING + pitch * (1 - PITCH_SMOOTHING);
            
            // Determine direction from pitch
            const direction = getDirectionFromPitch(gameState.lastPitch);
            gameState.currentDirection = direction;
            
            // Update UI
            updatePitchDisplay(gameState.lastPitch);
        }
    }, 50); // Check every 50ms
}

function getVolume(buffer) {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
        sum += buffer[i] * buffer[i];
    }
    return Math.sqrt(sum / buffer.length);
}

function autoCorrelate(buffer, sampleRate) {
    // Implements the autocorrelation algorithm for pitch detection
    const SIZE = buffer.length;
    const MAX_SAMPLES = Math.floor(SIZE / 2);
    let best_offset = -1;
    let best_correlation = 0;
    let rms = 0;
    
    // Calculate RMS (root mean square) for volume detection
    for (let i = 0; i < SIZE; i++) {
        const val = buffer[i];
        rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);
    
    // Not enough volume
    if (rms < 0.01) return -1;
    
    // Find the best offset (fundamental frequency)
    let lastCorrelation = 1;
    for (let offset = 1; offset < MAX_SAMPLES; offset++) {
        let correlation = 0;
        
        for (let i = 0; i < MAX_SAMPLES; i++) {
            correlation += Math.abs((buffer[i]) - (buffer[i + offset]));
        }
        
        correlation = 1 - (correlation / MAX_SAMPLES);
        
        if (correlation > 0.9 && correlation > lastCorrelation) {
            const foundGoodCorrelation = correlation > best_correlation;
            if (foundGoodCorrelation) {
                best_correlation = correlation;
                best_offset = offset;
            }
        }
        
        lastCorrelation = correlation;
    }
    
    if (best_offset === -1) return -1;
    
    // Calculate frequency
    const frequency = sampleRate / best_offset;
    return frequency;
}

function getDirectionFromPitch(pitch) {
    if (pitch >= PITCH_RANGES.RIGHT.min && pitch <= PITCH_RANGES.RIGHT.max) {
        return 'RIGHT';
    } else if (pitch >= PITCH_RANGES.UP.min && pitch < PITCH_RANGES.RIGHT.min) {
        return 'UP';
    } else if (pitch >= PITCH_RANGES.DOWN.min && pitch < PITCH_RANGES.UP.min) {
        return 'DOWN';
    } else if (pitch < PITCH_RANGES.DOWN.min) {
        return 'LEFT';
    }
    return null;
}

function updatePitchDisplay(pitch) {
    // Update pitch level bar (0-1000 Hz range)
    const percentage = Math.min((pitch / 1000) * 100, 100);
    pitchLevel.style.width = `${percentage}%`;
    
    // Update direction display
    const direction = gameState.currentDirection;
    if (direction && PITCH_RANGES[direction]) {
        currentDirectionDisplay.textContent = PITCH_RANGES[direction].name;
    } else {
        currentDirectionDisplay.textContent = '---';
    }
}

function gameLoop() {
    if (!gameState.isPlaying) return;
    
    // Update ball physics
    updateBall();
    
    // Draw everything
    drawGame();
    
    // Continue loop
    requestAnimationFrame(gameLoop);
}

function updateBall() {
    // Apply control based on voice direction
    if (gameState.currentDirection) {
        switch (gameState.currentDirection) {
            case 'LEFT':
                gameState.ball.vx -= 0.5;
                break;
            case 'RIGHT':
                gameState.ball.vx += 0.5;
                break;
            case 'UP':
                gameState.ball.vy -= 0.5;
                break;
            case 'DOWN':
                gameState.ball.vy += 0.5;
                break;
        }
    }
    
    // Apply some drag to limit max speed
    gameState.ball.vx *= 0.98;
    gameState.ball.vy *= 0.98;
    
    // Limit max speed
    const maxSpeed = 10;
    const speed = Math.sqrt(gameState.ball.vx * gameState.ball.vx + gameState.ball.vy * gameState.ball.vy);
    if (speed > maxSpeed) {
        gameState.ball.vx = (gameState.ball.vx / speed) * maxSpeed;
        gameState.ball.vy = (gameState.ball.vy / speed) * maxSpeed;
    }
    
    // Update position
    gameState.ball.x += gameState.ball.vx;
    gameState.ball.y += gameState.ball.vy;
    
    // Check boundaries - if ball goes out, game over
    if (gameState.ball.x - BALL_RADIUS < 0 || 
        gameState.ball.x + BALL_RADIUS > canvasWidth ||
        gameState.ball.y - BALL_RADIUS < 0 || 
        gameState.ball.y + BALL_RADIUS > canvasHeight) {
        
        endGame(false);
        return;
    }
    
    // Award points for staying in bounds
    if (Date.now() % 100 < 16) { // Roughly every 100ms
        gameState.score++;
        updateUI();
    }
}

function drawGame() {
    // Clear canvas
    ctx.fillStyle = 'rgba(15, 14, 23, 0.3)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Draw danger zones (red borders)
    ctx.strokeStyle = '#d63031';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, canvasWidth, canvasHeight);
    
    // Draw safe zone (inner border)
    const margin = 30;
    ctx.strokeStyle = '#00b894';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(margin, margin, canvasWidth - margin * 2, canvasHeight - margin * 2);
    ctx.setLineDash([]);
    
    // Draw ball
    ctx.beginPath();
    ctx.arc(gameState.ball.x, gameState.ball.y, BALL_RADIUS, 0, Math.PI * 2);
    
    // Gradient fill for ball
    const gradient = ctx.createRadialGradient(
        gameState.ball.x - 5, gameState.ball.y - 5, 5,
        gameState.ball.x, gameState.ball.y, BALL_RADIUS
    );
    gradient.addColorStop(0, '#fd79a8');
    gradient.addColorStop(1, '#6c5ce7');
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Ball outline
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw direction indicator
    if (gameState.currentDirection) {
        drawDirectionArrow();
    }
}

function drawDirectionArrow() {
    const arrowLength = 40;
    let dx = 0, dy = 0;
    
    switch (gameState.currentDirection) {
        case 'LEFT':
            dx = -arrowLength;
            break;
        case 'RIGHT':
            dx = arrowLength;
            break;
        case 'UP':
            dy = -arrowLength;
            break;
        case 'DOWN':
            dy = arrowLength;
            break;
    }
    
    const startX = gameState.ball.x;
    const startY = gameState.ball.y;
    const endX = startX + dx;
    const endY = startY + dy;
    
    // Draw arrow line
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = '#fdcb6e';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Draw arrow head
    const headLength = 10;
    const angle = Math.atan2(dy, dx);
    
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
        endX - headLength * Math.cos(angle - Math.PI / 6),
        endY - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
        endX - headLength * Math.cos(angle + Math.PI / 6),
        endY - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fillStyle = '#fdcb6e';
    ctx.fill();
}

function updateUI() {
    scoreDisplay.textContent = gameState.score;
    timerDisplay.textContent = gameState.timeRemaining;
}

function endGame(timeUp) {
    console.log('Game ended. Time up:', timeUp);
    
    gameState.isPlaying = false;
    
    // Clear intervals
    if (gameTimer) clearInterval(gameTimer);
    if (pitchDetectionInterval) clearInterval(pitchDetectionInterval);
    
    // Stop microphone
    if (microphone && microphone.mediaStream) {
        microphone.mediaStream.getTracks().forEach(track => track.stop());
    }
    
    // Determine success (survived for at least 20 seconds or until time ran out)
    const success = timeUp && gameState.timeRemaining === 0;
    
    if (success) {
        showFeedback('🎉 موفقیت! شما برنده شدید! 🎉', 'success');
        
        // Send success message to parent
        setTimeout(() => {
            window.parent.postMessage({
                type: 'minigame-complete',
                success: true,
                puzzleNumber: PUZZLE_NUMBER,
                score: gameState.score
            }, window.location.origin);
        }, 2000);
    } else {
        showFeedback('❌ باختید! توپ از صفحه خارج شد. دوباره تلاش کنید!', 'error');
        
        // Allow restart
        setTimeout(() => {
            feedbackDiv.classList.add('hidden');
            startBtn.classList.remove('hidden');
            startBtn.disabled = false;
            micBtn.classList.add('hidden');
            micBtn.classList.remove('active');
        }, 3000);
    }
}

function showFeedback(message, type) {
    feedbackDiv.textContent = message;
    feedbackDiv.className = `feedback ${type}`;
    feedbackDiv.classList.remove('hidden');
}

// Initialize on load
window.addEventListener('DOMContentLoaded', init);

// Handle page visibility change (pause when hidden)
document.addEventListener('visibilitychange', () => {
    if (document.hidden && gameState.isPlaying) {
        gameState.isPaused = true;
    } else if (!document.hidden && gameState.isPlaying && gameState.isPaused) {
        gameState.isPaused = false;
    }
});
