// Constants
const PUZZLE_NUMBER = 3;
const GAME_DURATION = 30; // seconds
const BALL_RADIUS = 20;
const BALL_SPEED = 3;
const GRAVITY = 0.5;
const PITCH_SMOOTHING = 0.7; // Higher = smoother but slower response
const MIN_VOLUME_THRESHOLD = 0.01; // Minimum volume to detect sound
const GRID_SIZE = 50; // Size of grid cells for radar effect
const AMPLITUDE_SPEED_MULTIPLIER = 15; // How much amplitude affects speed
const MAX_SPEED_MULTIPLIER = 2; // Maximum speed multiplier from amplitude
const TARGET_REACH_THRESHOLD = 40; // Distance in pixels to reach target
const ARROW_MIN_DISTANCE = 60; // Minimum distance to show arrow to target

// Check for demo mode (for testing without microphone)
const urlParams = new URLSearchParams(window.location.search);
const DEMO_MODE = urlParams.has('demo');

// Pitch frequency mapping - will be configured based on testing
// For now, we'll map detected frequencies to numbers 1-20 for debugging
const PITCH_NUMBER_MIN = 1;
const PITCH_NUMBER_MAX = 20;
const FREQUENCY_MIN = 50;  // Minimum detectable frequency (Hz)
const FREQUENCY_MAX = 1000; // Maximum detectable frequency (Hz)

// Placeholder direction ranges - to be configured after testing
const PITCH_RANGES = {
    LEFT: { min: 1, max: 5, name: 'چپ ⬅️' },
    DOWN: { min: 6, max: 10, name: 'پایین ⬇️' },
    UP: { min: 11, max: 15, name: 'بالا ⬆️' },
    RIGHT: { min: 16, max: 20, name: 'راست ➡️' }
};

// Tutorial targets (positions on grid where ball needs to go)
const TUTORIAL_STEPS = [
    { direction: 'RIGHT', target: { x: 0.75, y: 0.5 }, name: 'راست', instruction: 'صدای بالا تولید کنید' },
    { direction: 'LEFT', target: { x: 0.25, y: 0.5 }, name: 'چپ', instruction: 'صدای پایین تولید کنید' },
    { direction: 'UP', target: { x: 0.5, y: 0.25 }, name: 'بالا', instruction: 'صدای متوسط-بالا تولید کنید' },
    { direction: 'DOWN', target: { x: 0.5, y: 0.75 }, name: 'پایین', instruction: 'صدای متوسط-پایین تولید کنید' }
];

// Game state
let gameState = {
    isPlaying: false,
    isPaused: false,
    isTutorialMode: true,
    tutorialStep: 0,
    tutorialComplete: false,
    score: 0,
    timeRemaining: GAME_DURATION,
    ball: {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0
    },
    currentDirection: null,
    lastPitch: 0,
    currentAmplitude: 0,
    targetReached: false
};

// Audio/Microphone state
let audioContext = null;
let analyser = null;
let microphone = null;
let microphoneStream = null; // Store the MediaStream for cleanup
let audioDataArray = null;
let pitchDetectionInterval = null;

// Canvas
let canvas, ctx;
let canvasWidth, canvasHeight;
let spectrogramCanvas, spectrogramCtx;
let spectrogramWidth, spectrogramHeight;

// UI Elements
let startBtn, micBtn, skipTutorialBtn, scoreDisplay, timerDisplay;
let pitchLevel, currentDirectionDisplay;
let feedbackDiv, pitchPreviewDiv, frequencyDisplay;

// Audio context for pitch preview
let previewAudioContext = null;

// Spectrogram data
let spectrogramData = [];
const SPECTROGRAM_HISTORY = 200; // Number of columns to keep

// Timer
let gameTimer = null;

// Initialize the game
function init() {
    console.log('Initializing Audio-Controlled Minigame...');
    
    // Get canvas and context
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    
    spectrogramCanvas = document.getElementById('spectrogram-canvas');
    spectrogramCtx = spectrogramCanvas.getContext('2d');
    
    // Set canvas size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Get UI elements
    startBtn = document.getElementById('start-btn');
    micBtn = document.getElementById('mic-btn');
    skipTutorialBtn = document.getElementById('skip-tutorial-btn');
    scoreDisplay = document.getElementById('score');
    timerDisplay = document.getElementById('timer');
    pitchLevel = document.getElementById('pitch-level');
    currentDirectionDisplay = document.getElementById('current-direction');
    feedbackDiv = document.getElementById('feedback');
    pitchPreviewDiv = document.getElementById('pitch-preview');
    frequencyDisplay = document.getElementById('frequency-display');
    
    // Setup event listeners
    startBtn.addEventListener('click', handleStart);
    micBtn.addEventListener('click', handleMicToggle);
    skipTutorialBtn.addEventListener('click', handleSkipTutorial);
    
    // Setup tabs
    setupTabs();
    
    // Setup pitch preview buttons
    setupPitchPreview();
    
    // Show pitch preview initially
    pitchPreviewDiv.classList.remove('hidden');
    
    // Initialize ball position (center)
    resetBall();
    
    // Draw initial state
    drawGame();
}

function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab
            btn.classList.add('active');
            const tabName = btn.dataset.tab;
            document.getElementById(`${tabName}-tab`).classList.add('active');
            
            // Resize canvases when switching
            resizeCanvas();
        });
    });
}

function resizeCanvas() {
    const gameTab = document.getElementById('game-tab');
    const spectrogramTab = document.getElementById('spectrogram-tab');
    
    if (gameTab.classList.contains('active')) {
        canvas.width = gameTab.clientWidth;
        canvas.height = gameTab.clientHeight;
        canvasWidth = canvas.width;
        canvasHeight = canvas.height;
    }
    
    if (spectrogramTab.classList.contains('active') || spectrogramCanvas) {
        spectrogramCanvas.width = spectrogramTab.clientWidth;
        spectrogramCanvas.height = spectrogramTab.clientHeight;
        spectrogramWidth = spectrogramCanvas.width;
        spectrogramHeight = spectrogramCanvas.height;
    }

    
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

// Setup pitch preview buttons
function setupPitchPreview() {
    const directionButtons = document.querySelectorAll('.direction-btn');
    
    directionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const frequency = parseFloat(this.dataset.frequency);
            const direction = this.dataset.direction;
            playFrequencyTone(frequency, button);
        });
    });
}

// Play a tone at specified frequency
function playFrequencyTone(frequency, button) {
    try {
        // Create audio context if it doesn't exist
        if (!previewAudioContext) {
            previewAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        if (!frequency || frequency < FREQUENCY_MIN || frequency > FREQUENCY_MAX) {
            console.error('Invalid frequency:', frequency);
            return;
        }
        
        // Add playing class for visual feedback
        button.classList.add('playing');
        
        // Create oscillator for the tone
        const oscillator = previewAudioContext.createOscillator();
        const gainNode = previewAudioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(previewAudioContext.destination);
        
        // Set frequency and type
        oscillator.frequency.setValueAtTime(frequency, previewAudioContext.currentTime);
        oscillator.type = 'sine';
        
        // Envelope for smooth sound
        gainNode.gain.setValueAtTime(0, previewAudioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, previewAudioContext.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, previewAudioContext.currentTime + 0.8);
        
        // Play the tone
        oscillator.start(previewAudioContext.currentTime);
        oscillator.stop(previewAudioContext.currentTime + 0.8);
        
        // Remove playing class after animation
        setTimeout(() => {
            button.classList.remove('playing');
        }, 500);
    } catch (error) {
        console.error('Error playing pitch tone:', error);
        // Show visual feedback even if audio fails
        button.classList.add('playing');
        setTimeout(() => {
            button.classList.remove('playing');
        }, 500);
    }
}

async function handleStart() {
    console.log('Start button clicked');
    startBtn.disabled = true;
    
    // Hide pitch preview when starting
    pitchPreviewDiv.classList.add('hidden');
    
    // In demo mode, skip microphone
    if (DEMO_MODE) {
        console.log('Demo mode: skipping microphone');
        startGame();
        startDemoSimulation();
        return;
    }
    
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
        
        // Store the stream for cleanup
        microphoneStream = stream;
        
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

function handleSkipTutorial() {
    gameState.isTutorialMode = false;
    gameState.tutorialComplete = true;
    startActualGame();
}

function startGame() {
    console.log('Starting game...');
    
    gameState.isPlaying = true;
    gameState.isPaused = false;
    
    resetBall();
    updateUI();
    
    // Hide start button, show skip tutorial button (if in tutorial mode)
    startBtn.classList.add('hidden');
    if (gameState.isTutorialMode) {
        skipTutorialBtn.classList.remove('hidden');
    }
    
    // Start pitch detection
    startPitchDetection();
    
    // If not in tutorial mode, start the timer immediately
    if (!gameState.isTutorialMode) {
        gameState.score = 0;
        gameState.timeRemaining = GAME_DURATION;
        
        gameTimer = setInterval(() => {
            gameState.timeRemaining--;
            updateUI();
            
            if (gameState.timeRemaining <= 0) {
                endGame(true);
            }
        }, 1000);
    }
    
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
        
        // Store amplitude for speed control
        gameState.currentAmplitude = volume;
        
        if (volume < MIN_VOLUME_THRESHOLD) {
            // No sound detected
            gameState.currentDirection = null;
            gameState.currentAmplitude = 0;
            currentDirectionDisplay.textContent = '---';
            pitchLevel.style.width = '0%';
            return;
        }
        
        // Detect pitch using autocorrelation
        const pitch = autoCorrelate(audioDataArray, audioContext.sampleRate);
        
        if (pitch > 0) {
            // Smooth pitch value
            gameState.lastPitch = gameState.lastPitch * PITCH_SMOOTHING + pitch * (1 - PITCH_SMOOTHING);
            
            // Convert frequency to pitch number (1-20)
            const pitchNumber = frequencyToPitchNumber(gameState.lastPitch);
            
            // Log pitch number for configuration
            console.log(`Pitch Number: ${pitchNumber} (Frequency: ${gameState.lastPitch.toFixed(2)} Hz)`);
            
            // Determine direction from pitch number
            const direction = getDirectionFromPitchNumber(pitchNumber);
            gameState.currentDirection = direction;
            
            // Update UI
            updatePitchDisplay(gameState.lastPitch);
            
            // Update spectrogram
            updateSpectrogram(gameState.lastPitch, volume);
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
    // Simplified and more robust autocorrelation for pitch detection
    const SIZE = buffer.length;
    let rms = 0;
    
    // Calculate RMS (root mean square) for volume detection
    for (let i = 0; i < SIZE; i++) {
        const val = buffer[i];
        rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);
    
    // Not enough volume
    if (rms < 0.01) return -1;
    
    // Define reasonable pitch range for human voice (80-1000 Hz)
    const MIN_FREQUENCY = 80;  // Lowest expected frequency
    const MAX_FREQUENCY = 1000; // Highest expected frequency
    const MIN_SAMPLES = Math.ceil(sampleRate / MAX_FREQUENCY);
    const MAX_SAMPLES = Math.floor(sampleRate / MIN_FREQUENCY);
    
    // Autocorrelation using AMDF (Average Magnitude Difference Function)
    let best_offset = -1;
    let best_score = Infinity;
    
    for (let offset = MIN_SAMPLES; offset <= MAX_SAMPLES && offset < SIZE / 2; offset++) {
        let sum = 0;
        
        // Calculate average magnitude difference
        for (let i = 0; i < SIZE / 2; i++) {
            sum += Math.abs(buffer[i] - buffer[i + offset]);
        }
        
        const score = sum / (SIZE / 2);
        
        // Find minimum (best match)
        if (score < best_score) {
            best_score = score;
            best_offset = offset;
        }
    }
    
    if (best_offset === -1) return -1;
    
    // Calculate frequency from offset
    const frequency = sampleRate / best_offset;
    
    // Sanity check - ensure frequency is in expected range
    if (frequency < MIN_FREQUENCY || frequency > MAX_FREQUENCY) {
        return -1;
    }
    
    return frequency;
}

// Convert frequency to pitch number (1-20)
function frequencyToPitchNumber(frequency) {
    if (frequency < FREQUENCY_MIN || frequency > FREQUENCY_MAX) {
        return null;
    }
    
    // Map frequency logarithmically to pitch number 1-20
    // Using logarithmic scale for better perceptual mapping
    const logMin = Math.log(FREQUENCY_MIN);
    const logMax = Math.log(FREQUENCY_MAX);
    const logFreq = Math.log(frequency);
    
    const normalized = (logFreq - logMin) / (logMax - logMin);
    const pitchNumber = Math.round(normalized * (PITCH_NUMBER_MAX - PITCH_NUMBER_MIN) + PITCH_NUMBER_MIN);
    
    return Math.max(PITCH_NUMBER_MIN, Math.min(PITCH_NUMBER_MAX, pitchNumber));
}

// Determine direction from pitch number
function getDirectionFromPitchNumber(pitchNumber) {
    if (pitchNumber === null) return null;
    
    // Check each direction's pitch number range
    for (const [direction, range] of Object.entries(PITCH_RANGES)) {
        if (pitchNumber >= range.min && pitchNumber <= range.max) {
            return direction;
        }
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
    // Apply control based on voice direction with amplitude-based speed
    if (gameState.currentDirection) {
        // Calculate speed multiplier based on amplitude (louder = faster)
        const speedMultiplier = Math.min(gameState.currentAmplitude * AMPLITUDE_SPEED_MULTIPLIER, MAX_SPEED_MULTIPLIER);
        
        switch (gameState.currentDirection) {
            case 'LEFT':
                gameState.ball.vx -= 0.5 * speedMultiplier;
                break;
            case 'RIGHT':
                gameState.ball.vx += 0.5 * speedMultiplier;
                break;
            case 'UP':
                gameState.ball.vy -= 0.5 * speedMultiplier;
                break;
            case 'DOWN':
                gameState.ball.vy += 0.5 * speedMultiplier;
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
    
    // In tutorial mode, check if target is reached
    if (gameState.isTutorialMode && !gameState.tutorialComplete) {
        checkTutorialTarget();
    }
    
    // Check boundaries - if ball goes out, game over (only in normal mode)
    if (!gameState.isTutorialMode) {
        if (gameState.ball.x - BALL_RADIUS < 0 || 
            gameState.ball.x + BALL_RADIUS > canvasWidth ||
            gameState.ball.y - BALL_RADIUS < 0 || 
            gameState.ball.y + BALL_RADIUS > canvasHeight) {
            
            endGame(false);
            return;
        }
    } else {
        // In tutorial mode, keep ball within bounds
        if (gameState.ball.x - BALL_RADIUS < 0) {
            gameState.ball.x = BALL_RADIUS;
            gameState.ball.vx = 0;
        }
        if (gameState.ball.x + BALL_RADIUS > canvasWidth) {
            gameState.ball.x = canvasWidth - BALL_RADIUS;
            gameState.ball.vx = 0;
        }
        if (gameState.ball.y - BALL_RADIUS < 0) {
            gameState.ball.y = BALL_RADIUS;
            gameState.ball.vy = 0;
        }
        if (gameState.ball.y + BALL_RADIUS > canvasHeight) {
            gameState.ball.y = canvasHeight - BALL_RADIUS;
            gameState.ball.vy = 0;
        }
    }
    
    // Award points for staying in bounds (only in normal mode)
    if (!gameState.isTutorialMode && Date.now() % 100 < 16) { // Roughly every 100ms
        gameState.score++;
        updateUI();
    }
}

function checkTutorialTarget() {
    const currentStep = TUTORIAL_STEPS[gameState.tutorialStep];
    if (!currentStep) return;
    
    const targetX = currentStep.target.x * canvasWidth;
    const targetY = currentStep.target.y * canvasHeight;
    
    const distance = Math.sqrt(
        Math.pow(gameState.ball.x - targetX, 2) + 
        Math.pow(gameState.ball.y - targetY, 2)
    );
    
    // Target reached if ball is within threshold
    if (distance < TARGET_REACH_THRESHOLD && !gameState.targetReached) {
        gameState.targetReached = true;
        
        // Wait a moment then move to next step
        setTimeout(() => {
            gameState.tutorialStep++;
            gameState.targetReached = false;
            
            if (gameState.tutorialStep >= TUTORIAL_STEPS.length) {
                // Tutorial complete!
                completeTutorial();
            } else {
                // Reset ball to center for next target
                resetBall();
            }
        }, 1000);
    }
}

function completeTutorial() {
    gameState.isTutorialMode = false;
    gameState.tutorialComplete = true;
    
    // Show success message
    showFeedback('🎉 آموزش کامل شد! حالا بازی واقعی شروع می‌شود!', 'success');
    
    // Start the actual game after a delay
    setTimeout(() => {
        feedbackDiv.classList.add('hidden');
        startActualGame();
    }, 2000);
}

function startActualGame() {
    gameState.score = 0;
    gameState.timeRemaining = GAME_DURATION;
    resetBall();
    
    // Hide skip button
    skipTutorialBtn.classList.add('hidden');
    
    // Start game timer
    gameTimer = setInterval(() => {
        gameState.timeRemaining--;
        updateUI();
        
        if (gameState.timeRemaining <= 0) {
            endGame(true);
        }
    }, 1000);
}

function drawGame() {
    // Clear canvas with black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Draw grid lines
    drawGrid();
    
    // Draw radar effect
    drawRadarEffect();
    
    // In tutorial mode, draw tutorial elements
    if (gameState.isTutorialMode && !gameState.tutorialComplete) {
        drawTutorialTarget();
        drawTutorialInstructions();
    } else {
        // Draw danger zones (red borders) in normal mode
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
    }
    
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

function drawGrid() {
    ctx.strokeStyle = 'rgba(100, 255, 218, 0.15)'; // Cyan grid lines
    ctx.lineWidth = 1;
    
    // Vertical lines
    for (let x = 0; x < canvasWidth; x += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasHeight);
        ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y < canvasHeight; y += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasWidth, y);
        ctx.stroke();
    }
}

function drawRadarEffect() {
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const maxRadius = Math.max(canvasWidth, canvasHeight) / 2;
    const time = Date.now() / 1000;
    
    // Draw pulsing radar circles
    for (let i = 0; i < 3; i++) {
        const radius = (maxRadius * ((time + i * 0.5) % 1.5) / 1.5);
        const alpha = 1 - ((time + i * 0.5) % 1.5) / 1.5;
        
        ctx.strokeStyle = `rgba(0, 255, 170, ${alpha * 0.3})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // Draw sweeping radar line
    const angle = (time % 4) / 4 * Math.PI * 2;
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);
    
    const radarGradient = ctx.createLinearGradient(0, 0, maxRadius, 0);
    radarGradient.addColorStop(0, 'rgba(0, 255, 170, 0.6)');
    radarGradient.addColorStop(0.5, 'rgba(0, 255, 170, 0.3)');
    radarGradient.addColorStop(1, 'rgba(0, 255, 170, 0)');
    
    ctx.fillStyle = radarGradient;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, maxRadius, 0, Math.PI / 6);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
}

function drawTutorialTarget() {
    const currentStep = TUTORIAL_STEPS[gameState.tutorialStep];
    if (!currentStep) return;
    
    const targetX = currentStep.target.x * canvasWidth;
    const targetY = currentStep.target.y * canvasHeight;
    const targetRadius = 35;
    
    // Calculate distance to target
    const distance = Math.sqrt(
        Math.pow(gameState.ball.x - targetX, 2) + 
        Math.pow(gameState.ball.y - targetY, 2)
    );
    
    const isNear = distance < TARGET_REACH_THRESHOLD;
    const targetColor = gameState.targetReached ? '#00b894' : (isNear ? '#fdcb6e' : '#d63031');
    
    // Draw pulsing target
    const pulseScale = 1 + Math.sin(Date.now() / 300) * 0.1;
    
    // Outer circle (pulsing)
    ctx.strokeStyle = targetColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(targetX, targetY, targetRadius * pulseScale, 0, Math.PI * 2);
    ctx.stroke();
    
    // Inner circle
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(targetX, targetY, targetRadius * 0.6, 0, Math.PI * 2);
    ctx.stroke();
    
    // Center dot
    ctx.fillStyle = targetColor;
    ctx.beginPath();
    ctx.arc(targetX, targetY, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw crosshair
    ctx.beginPath();
    ctx.moveTo(targetX - targetRadius * 0.4, targetY);
    ctx.lineTo(targetX + targetRadius * 0.4, targetY);
    ctx.moveTo(targetX, targetY - targetRadius * 0.4);
    ctx.lineTo(targetX, targetY + targetRadius * 0.4);
    ctx.stroke();
    
    // Draw arrow from ball to target
    drawArrowToTarget(targetX, targetY, targetColor);
    
    // Success/failure indicator
    if (gameState.targetReached) {
        ctx.fillStyle = '#00b894';
        ctx.font = 'bold 24px Vazirmatn';
        ctx.textAlign = 'center';
        ctx.fillText('✓', targetX, targetY - 50);
    } else if (isNear) {
        ctx.fillStyle = '#fdcb6e';
        ctx.font = 'bold 20px Vazirmatn';
        ctx.textAlign = 'center';
        ctx.fillText('نزدیک!', targetX, targetY - 50);
    }
}

function drawArrowToTarget(targetX, targetY, color) {
    const ballX = gameState.ball.x;
    const ballY = gameState.ball.y;
    
    // Don't draw if too close
    const distance = Math.sqrt(Math.pow(targetX - ballX, 2) + Math.pow(targetY - ballY, 2));
    if (distance < ARROW_MIN_DISTANCE) return;
    
    // Calculate arrow start and end points
    const angle = Math.atan2(targetY - ballY, targetX - ballX);
    const startX = ballX + Math.cos(angle) * 30;
    const startY = ballY + Math.sin(angle) * 30;
    const endX = targetX - Math.cos(angle) * 50;
    const endY = targetY - Math.sin(angle) * 50;
    
    // Draw arrow line
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw arrow head
    const headLength = 15;
    ctx.fillStyle = color;
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
    ctx.fill();
}

function drawTutorialInstructions() {
    const currentStep = TUTORIAL_STEPS[gameState.tutorialStep];
    if (!currentStep) return;
    
    // Draw instruction box
    const boxWidth = canvasWidth * 0.9;
    const boxHeight = 80;
    const boxX = (canvasWidth - boxWidth) / 2;
    const boxY = 10;
    
    // Background
    ctx.fillStyle = 'rgba(26, 26, 46, 0.9)';
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    
    // Border
    ctx.strokeStyle = '#6c5ce7';
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
    
    // Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Vazirmatn';
    ctx.textAlign = 'center';
    ctx.fillText(`مرحله ${gameState.tutorialStep + 1} از ${TUTORIAL_STEPS.length}`, canvasWidth / 2, boxY + 25);
    
    ctx.font = '14px Vazirmatn';
    ctx.fillStyle = '#fdcb6e';
    ctx.fillText(`جهت: ${currentStep.name}`, canvasWidth / 2, boxY + 45);
    
    ctx.fillStyle = '#00ffaa';
    ctx.fillText(currentStep.instruction, canvasWidth / 2, boxY + 65);
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
    if (microphoneStream) {
        microphoneStream.getTracks().forEach(track => track.stop());
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
        
        // Allow restart - reset to tutorial mode
        setTimeout(() => {
            feedbackDiv.classList.add('hidden');
            startBtn.classList.remove('hidden');
            startBtn.textContent = 'شروع آموزش';
            startBtn.disabled = false;
            micBtn.classList.add('hidden');
            micBtn.classList.remove('active');
            skipTutorialBtn.classList.add('hidden');
            
            // Show pitch preview again
            pitchPreviewDiv.classList.remove('hidden');
            
            // Reset game state to tutorial mode
            gameState.isTutorialMode = true;
            gameState.tutorialStep = 0;
            gameState.tutorialComplete = false;
            gameState.score = 0;
            gameState.timeRemaining = GAME_DURATION;
        }, 3000);
    }
}

function showFeedback(message, type) {
    feedbackDiv.textContent = message;
    feedbackDiv.className = `feedback ${type}`;
    feedbackDiv.classList.remove('hidden');
}

// Demo mode simulation (for testing without microphone)
function startDemoSimulation() {
    if (!DEMO_MODE) return;
    
    console.log('Starting demo simulation');
    
    // Simulate pitch changes for tutorial
    let demoInterval = setInterval(() => {
        if (!gameState.isPlaying) {
            clearInterval(demoInterval);
            return;
        }
        
        // Simulate amplitude
        gameState.currentAmplitude = 0.3 + Math.random() * 0.3;
        
        // In tutorial mode, guide toward the target
        if (gameState.isTutorialMode && !gameState.tutorialComplete) {
            const currentStep = TUTORIAL_STEPS[gameState.tutorialStep];
            if (currentStep) {
                gameState.currentDirection = currentStep.direction;
                
                // Simulate pitch for the direction using sample frequencies
                let demoPitch = 0;
                switch (currentStep.direction) {
                    case 'LEFT': demoPitch = 100; break;
                    case 'DOWN': demoPitch = 200; break;
                    case 'UP': demoPitch = 300; break;
                    case 'RIGHT': demoPitch = 500; break;
                }
                gameState.lastPitch = demoPitch;
                updatePitchDisplay(demoPitch);
                updateSpectrogram(demoPitch, gameState.currentAmplitude);
            }
        } else {
            // Random direction in normal mode
            const directions = ['LEFT', 'RIGHT', 'UP', 'DOWN'];
            const randomDir = directions[Math.floor(Math.random() * directions.length)];
            gameState.currentDirection = randomDir;
            
            // Use sample frequencies for random pitch
            const freqExamples = {
                'LEFT': 100,
                'DOWN': 200,
                'UP': 300,
                'RIGHT': 500
            };
            gameState.lastPitch = freqExamples[randomDir];
            updateSpectrogram(gameState.lastPitch, gameState.currentAmplitude);
        }
    }, 100);
}

// Update spectrogram with new frequency data
function updateSpectrogram(frequency, amplitude) {
    if (!spectrogramCanvas || !spectrogramCtx) return;
    
    // Add new data point
    spectrogramData.push({ frequency, amplitude });
    
    // Keep only recent history
    if (spectrogramData.length > SPECTROGRAM_HISTORY) {
        spectrogramData.shift();
    }
    
    // Update frequency display
    if (frequencyDisplay) {
        frequencyDisplay.textContent = `فرکانس: ${frequency.toFixed(2)} Hz`;
    }
    
    // Draw spectrogram
    drawSpectrogram();
}

function drawSpectrogram() {
    if (!spectrogramCanvas || !spectrogramCtx || spectrogramData.length === 0) return;
    
    const width = spectrogramCanvas.width;
    const height = spectrogramCanvas.height;
    
    // Clear canvas
    spectrogramCtx.fillStyle = '#000';
    spectrogramCtx.fillRect(0, 0, width, height);
    
    // Draw frequency grid lines
    spectrogramCtx.strokeStyle = 'rgba(100, 255, 218, 0.1)';
    spectrogramCtx.lineWidth = 1;
    
    const freqSteps = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
    freqSteps.forEach(freq => {
        const y = height - (freq / 1000) * height;
        spectrogramCtx.beginPath();
        spectrogramCtx.moveTo(0, y);
        spectrogramCtx.lineTo(width, y);
        spectrogramCtx.stroke();
        
        // Label
        spectrogramCtx.fillStyle = 'rgba(100, 255, 218, 0.5)';
        spectrogramCtx.font = '10px Vazirmatn';
        spectrogramCtx.fillText(`${freq}Hz`, 5, y - 2);
    });
    
    // Draw data points
    const columnWidth = width / SPECTROGRAM_HISTORY;
    
    spectrogramData.forEach((data, index) => {
        const x = index * columnWidth;
        const normalizedFreq = Math.min(data.frequency / 1000, 1);
        const y = height - (normalizedFreq * height);
        
        // Color based on amplitude (brightness)
        const intensity = Math.min(data.amplitude * 3, 1);
        const hue = 180 + (normalizedFreq * 180); // Cyan to purple gradient
        spectrogramCtx.fillStyle = `hsla(${hue}, 80%, ${intensity * 60}%, ${intensity})`;
        
        spectrogramCtx.fillRect(x, y - 5, columnWidth + 1, 10);
    });
    
    // Draw current frequency line
    if (spectrogramData.length > 0) {
        const lastData = spectrogramData[spectrogramData.length - 1];
        const normalizedFreq = Math.min(lastData.frequency / 1000, 1);
        const y = height - (normalizedFreq * height);
        
        spectrogramCtx.strokeStyle = '#00ffaa';
        spectrogramCtx.lineWidth = 2;
        spectrogramCtx.beginPath();
        spectrogramCtx.moveTo(0, y);
        spectrogramCtx.lineTo(width, y);
        spectrogramCtx.stroke();
    }
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
