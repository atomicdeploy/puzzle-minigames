import './style.css';
import * as THREE from 'three';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

// Constants
const PUZZLE_SIZE = 9;
const AUTO_SAVE_INTERVAL = 5000; // milliseconds

// Game State
const gameState = {
    discoveredPuzzles: new Set(),
    puzzleBoard: Array(PUZZLE_SIZE).fill(null),
    solution: [1, 2, 3, 4, 5, 6, 7, 8, 9], // Simple Sudoku solution for 3x3
    draggingPiece: null,
    audio: {
        error: null,
        success: null,
        discover: null
    }
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
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    };
    
    // Create discover sound (magical)
    gameState.audio.discover = () => {
        [0, 0.1, 0.2].forEach((delay, i) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            const freq = 523.25 * Math.pow(1.5, i); // C, G, high C
            oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + delay);
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + delay);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + delay + 0.4);
            
            oscillator.start(audioContext.currentTime + delay);
            oscillator.stop(audioContext.currentTime + delay + 0.4);
        });
    };
}

// Initialize 3D Scene
let scene, camera, renderer;

function init3DScene() {
    const container = document.getElementById('scene-container');
    
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f0e17);
    
    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const pointLight1 = new THREE.PointLight(0x6c5ce7, 1, 100);
    pointLight1.position.set(5, 5, 5);
    scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0xfd79a8, 0.8, 100);
    pointLight2.position.set(-5, -5, 5);
    scene.add(pointLight2);
    
    // Create floating puzzle pieces in background
    createFloatingPuzzles();
    
    // Animation loop
    animate();
    
    // Handle resize
    window.addEventListener('resize', onWindowResize);
}

// Create floating 3D puzzle pieces
const floatingPuzzles = [];

function createFloatingPuzzles() {
    const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.1);
    
    for (let i = 0; i < 15; i++) {
        const material = new THREE.MeshPhongMaterial({
            color: new THREE.Color().setHSL(Math.random(), 0.7, 0.6),
            emissive: new THREE.Color().setHSL(Math.random(), 0.5, 0.3),
            shininess: 100
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 5
        );
        mesh.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        
        mesh.userData = {
            speedX: (Math.random() - 0.5) * 0.01,
            speedY: (Math.random() - 0.5) * 0.01,
            rotationSpeed: (Math.random() - 0.5) * 0.02
        };
        
        scene.add(mesh);
        floatingPuzzles.push(mesh);
    }
}

function animate() {
    requestAnimationFrame(animate);
    
    // Animate floating puzzles
    floatingPuzzles.forEach(puzzle => {
        puzzle.rotation.x += puzzle.userData.rotationSpeed;
        puzzle.rotation.y += puzzle.userData.rotationSpeed;
        puzzle.position.x += puzzle.userData.speedX;
        puzzle.position.y += puzzle.userData.speedY;
        
        // Wrap around screen
        if (Math.abs(puzzle.position.x) > 6) puzzle.userData.speedX *= -1;
        if (Math.abs(puzzle.position.y) > 6) puzzle.userData.speedY *= -1;
    });
    
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Initialize Puzzle Board
function initPuzzleBoard() {
    const board = document.getElementById('puzzle-board');
    board.innerHTML = '';
    
    for (let i = 0; i < PUZZLE_SIZE; i++) {
        const slot = document.createElement('div');
        slot.className = 'puzzle-slot empty';
        slot.dataset.index = i;
        slot.innerHTML = '❓';
        
        // Add drop event listeners
        slot.addEventListener('dragover', handleDragOver);
        slot.addEventListener('drop', handleDrop);
        slot.addEventListener('touchmove', handleTouchMove);
        slot.addEventListener('touchend', handleTouchEnd);
        
        board.appendChild(slot);
    }
}

// Initialize Treasure Chests
function initTreasureChests() {
    const container = document.getElementById('treasure-chests');
    container.innerHTML = '';
    
    for (let i = 1; i <= PUZZLE_SIZE; i++) {
        const chest = document.createElement('div');
        chest.className = 'treasure-chest';
        chest.dataset.number = i;
        chest.innerHTML = '🎁';
        chest.setAttribute('data-number', i);
        
        chest.addEventListener('click', () => openTreasureChest(i));
        chest.addEventListener('touchstart', () => openTreasureChest(i));
        
        container.appendChild(chest);
    }
}

// Open Treasure Chest
function openTreasureChest(number) {
    if (gameState.discoveredPuzzles.has(number)) {
        return; // Already discovered
    }
    
    // Special handling for puzzle #1 - AR Minigame
    if (number === 1) {
        // Show AR minigame option
        showARMinigamePrompt(number);
        return;
    }
    
    // Mark as discovered
    gameState.discoveredPuzzles.add(number);
    
    // Update chest appearance
    const chest = document.querySelector(`.treasure-chest[data-number="${number}"]`);
    chest.classList.add('opened');
    chest.innerHTML = '📦';
    
    // Play discover sound
    if (gameState.audio.discover) {
        gameState.audio.discover();
    }
    
    // Haptic feedback
    try {
        Haptics.impact({ style: ImpactStyle.Medium });
    } catch (e) {
        // Haptics not available in web browsers
        console.debug('Haptics not available:', e.message);
    }
    
    // Create draggable puzzle piece
    createPuzzlePiece(number);
    
    // Update stats
    updateStats();
    
    // Show mini-game link notification (placeholder for now)
    showNotification(`پازل ${number} کشف شد! 🎉`);
}

// Show AR Minigame Prompt
function showARMinigamePrompt(number) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
        background: linear-gradient(135deg, #1a1a2e, #16213e);
        border: 3px solid #00ffff;
        border-radius: 20px;
        padding: 2rem;
        max-width: 400px;
        text-align: center;
        box-shadow: 0 0 50px rgba(0, 255, 255, 0.5);
    `;
    
    content.innerHTML = `
        <h2 style="font-size: 2rem; margin-bottom: 1rem; color: #00ffff;">
            🌟 تجربه AR/VR 🌟
        </h2>
        <p style="font-size: 1.1rem; margin-bottom: 1.5rem; line-height: 1.6;">
            برای دریافت این پازل، یک تجربه هولوگرافیک فوق‌العاده را تکمیل کنید!
        </p>
        <p style="font-size: 0.95rem; color: #aaa; margin-bottom: 1.5rem;">
            از دوربین گوشی خود برای مشاهده اشیاء سه‌بعدی استفاده کنید
        </p>
        <div style="display: flex; gap: 1rem; justify-content: center;">
            <button id="start-ar-minigame" style="
                background: linear-gradient(45deg, #00ffff, #ff00ff);
                border: none;
                padding: 1rem 2rem;
                font-size: 1.1rem;
                font-weight: 700;
                color: white;
                border-radius: 50px;
                cursor: pointer;
                font-family: 'Vazirmatn', sans-serif;
                box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
            ">
                🚀 شروع تجربه AR
            </button>
            <button id="skip-ar-minigame" style="
                background: transparent;
                border: 2px solid #666;
                padding: 1rem 2rem;
                font-size: 1.1rem;
                color: #999;
                border-radius: 50px;
                cursor: pointer;
                font-family: 'Vazirmatn', sans-serif;
            ">
                رد کردن
            </button>
        </div>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // Start AR minigame
    document.getElementById('start-ar-minigame').addEventListener('click', () => {
        window.location.href = '/minigames/ar-hologram/index.html';
    });
    
    // Skip and get puzzle directly
    document.getElementById('skip-ar-minigame').addEventListener('click', () => {
        modal.remove();
        
        // Mark as discovered
        gameState.discoveredPuzzles.add(number);
        
        // Update chest appearance
        const chest = document.querySelector(`.treasure-chest[data-number="${number}"]`);
        chest.classList.add('opened');
        chest.innerHTML = '📦';
        
        // Play discover sound
        if (gameState.audio.discover) {
            gameState.audio.discover();
        }
        
        // Haptic feedback
        try {
            Haptics.impact({ style: ImpactStyle.Medium });
        } catch (e) {
            console.debug('Haptics not available:', e.message);
        }
        
        // Create draggable puzzle piece
        createPuzzlePiece(number);
        
        // Update stats
        updateStats();
        
        showNotification(`پازل ${number} کشف شد! 🎉`);
    });
}

// Create Puzzle Piece
function createPuzzlePiece(number) {
    const piece = document.createElement('div');
    piece.className = 'puzzle-piece';
    piece.dataset.number = number;
    piece.innerHTML = `🧩<div class="puzzle-number">${number}</div>`;
    piece.style.left = '50%';
    piece.style.top = '50%';
    piece.style.transform = 'translate(-50%, -50%)';
    
    // Drag events
    piece.draggable = true;
    piece.addEventListener('dragstart', handleDragStart);
    piece.addEventListener('touchstart', handleTouchStart);
    
    document.body.appendChild(piece);
    
    // Animate entrance
    piece.style.animation = 'success-pulse 0.6s ease';
}

// Drag and Drop Handlers
function handleDragStart(e) {
    gameState.draggingPiece = {
        element: e.target,
        number: parseInt(e.target.dataset.number)
    };
    e.target.classList.add('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('highlight');
}

function handleDrop(e) {
    e.preventDefault();
    const slot = e.currentTarget;
    slot.classList.remove('highlight');
    
    if (!gameState.draggingPiece) return;
    
    const slotIndex = parseInt(slot.dataset.index);
    const pieceNumber = gameState.draggingPiece.number;
    
    // Check if placement is correct
    if (gameState.solution[slotIndex] === pieceNumber) {
        // Correct placement
        placePuzzlePiece(slot, pieceNumber);
        gameState.draggingPiece.element.remove();
        
        if (gameState.audio.success) {
            gameState.audio.success();
        }
        
        try {
            Haptics.impact({ style: ImpactStyle.Light });
        } catch (e) {
            console.debug('Haptics not available:', e.message);
        }
        
    } else {
        // Wrong placement
        showErrorFeedback(slot);
    }
    
    gameState.draggingPiece.element.classList.remove('dragging');
    gameState.draggingPiece = null;
}

// Touch handlers for mobile
let touchPiece = null;
let touchOffset = { x: 0, y: 0 };

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    touchPiece = {
        element: e.currentTarget,
        number: parseInt(e.currentTarget.dataset.number)
    };
    
    const rect = e.currentTarget.getBoundingClientRect();
    touchOffset = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
    };
    
    e.currentTarget.classList.add('dragging');
    gameState.draggingPiece = touchPiece;
}

function handleTouchMove(e) {
    if (!touchPiece) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    touchPiece.element.style.left = `${touch.clientX - touchOffset.x}px`;
    touchPiece.element.style.top = `${touch.clientY - touchOffset.y}px`;
    touchPiece.element.style.transform = 'none';
}

function handleTouchEnd(e) {
    if (!touchPiece) return;
    e.preventDefault();
    
    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (element && element.classList.contains('puzzle-slot')) {
        const slotIndex = parseInt(element.dataset.index);
        const pieceNumber = touchPiece.number;
        
        if (gameState.solution[slotIndex] === pieceNumber) {
            placePuzzlePiece(element, pieceNumber);
            touchPiece.element.remove();
            
            if (gameState.audio.success) {
                gameState.audio.success();
            }
            
            try {
                Haptics.impact({ style: ImpactStyle.Light });
            } catch (e) {
                console.debug('Haptics not available:', e.message);
            }
        } else {
            showErrorFeedback(element);
            // Return piece to center
            touchPiece.element.style.left = '50%';
            touchPiece.element.style.top = '50%';
            touchPiece.element.style.transform = 'translate(-50%, -50%)';
        }
    }
    
    touchPiece.element.classList.remove('dragging');
    touchPiece = null;
    gameState.draggingPiece = null;
}

// Place puzzle piece in slot
function placePuzzlePiece(slot, number) {
    const slotIndex = parseInt(slot.dataset.index);
    gameState.puzzleBoard[slotIndex] = number;
    
    slot.className = 'puzzle-slot filled success-animation';
    slot.innerHTML = `🧩<div class="puzzle-number">${number}</div>`;
    
    updateStats();
    checkCompletion();
}

// Show error feedback
function showErrorFeedback(slot) {
    // Visual feedback
    slot.classList.add('error');
    setTimeout(() => slot.classList.remove('error'), 500);
    
    // Flash overlay
    const overlay = document.getElementById('feedback-overlay');
    overlay.style.display = 'block';
    setTimeout(() => overlay.style.display = 'none', 500);
    
    // Audio feedback
    if (gameState.audio.error) {
        gameState.audio.error();
    }
    
    // Haptic feedback
    try {
        Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (e) {
        console.debug('Haptics not available:', e.message);
    }
}

// Update stats
function updateStats() {
    const filledCount = gameState.puzzleBoard.filter(p => p !== null).length;
    document.getElementById('discovered-count').textContent = `${filledCount}/9`;
}

// Check if puzzle is complete
function checkCompletion() {
    const isComplete = gameState.puzzleBoard.every(p => p !== null);
    
    if (isComplete) {
        setTimeout(() => {
            showNotification('🎉 تبریک! پازل کامل شد! 🎉', 3000);
            celebrateCompletion();
        }, 500);
    }
}

// Celebration animation
function celebrateCompletion() {
    // Make all floating puzzles colorful
    floatingPuzzles.forEach((puzzle, i) => {
        setTimeout(() => {
            puzzle.material.color.setHSL(Math.random(), 1, 0.5);
            puzzle.material.emissive.setHSL(Math.random(), 1, 0.3);
        }, i * 50);
    });
    
    // Play success sounds
    [0, 200, 400].forEach(delay => {
        setTimeout(() => {
            if (gameState.audio.success) gameState.audio.success();
        }, delay);
    });
}

// Show notification
function showNotification(message, duration = 2000) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
        color: white;
        padding: 1.5rem 2rem;
        border-radius: 1rem;
        font-size: 1.5rem;
        font-weight: 700;
        z-index: 10000;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        animation: success-pulse 0.6s ease;
        text-align: center;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'flash 0.5s ease reverse';
        setTimeout(() => notification.remove(), 500);
    }, duration);
}

// Load game state from localStorage
function loadGameState() {
    const saved = localStorage.getItem('infernal-puzzle-game');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            gameState.discoveredPuzzles = new Set(data.discoveredPuzzles || []);
            gameState.puzzleBoard = data.puzzleBoard || Array(PUZZLE_SIZE).fill(null);
            
            // Restore UI
            gameState.discoveredPuzzles.forEach(number => {
                const chest = document.querySelector(`.treasure-chest[data-number="${number}"]`);
                if (chest) {
                    chest.classList.add('opened');
                    chest.innerHTML = '📦';
                }
            });
            
            gameState.puzzleBoard.forEach((number, index) => {
                if (number) {
                    const slot = document.querySelector(`.puzzle-slot[data-index="${index}"]`);
                    if (slot) {
                        slot.className = 'puzzle-slot filled';
                        slot.innerHTML = `🧩<div class="puzzle-number">${number}</div>`;
                    }
                }
            });
            
            updateStats();
        } catch (e) {
            console.error('Failed to load game state:', e);
        }
    }
}

// Save game state to localStorage
function saveGameState() {
    const data = {
        discoveredPuzzles: Array.from(gameState.discoveredPuzzles),
        puzzleBoard: gameState.puzzleBoard
    };
    localStorage.setItem('infernal-puzzle-game', JSON.stringify(data));
}

// Auto-save on changes
setInterval(saveGameState, AUTO_SAVE_INTERVAL);

// Initialize game
function initGame() {
    initAudio();
    init3DScene();
    initPuzzleBoard();
    initTreasureChests();
    loadGameState();
    
    // Check if returning from AR minigame
    checkARMinigameCompletion();
    
    // Hide loading screen
    setTimeout(() => {
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('game-container').style.display = 'flex';
    }, 1500);
}

// Check if AR minigame was completed
function checkARMinigameCompletion() {
    const completed = localStorage.getItem('ar-minigame-completed');
    if (completed) {
        try {
            JSON.parse(completed); // Validate JSON format
            const puzzleNumber = 1; // AR minigame awards puzzle #1
            
            if (!gameState.discoveredPuzzles.has(puzzleNumber)) {
                // Mark as discovered
                gameState.discoveredPuzzles.add(puzzleNumber);
                
                // Update chest appearance
                const chest = document.querySelector(`.treasure-chest[data-number="${puzzleNumber}"]`);
                if (chest) {
                    chest.classList.add('opened');
                    chest.innerHTML = '📦';
                }
                
                // Create draggable puzzle piece
                setTimeout(() => {
                    createPuzzlePiece(puzzleNumber);
                    updateStats();
                    showNotification(`🎉 تبریک! پازل ${puzzleNumber} از AR دریافت شد! 🌟`);
                    
                    // Play discover sound
                    if (gameState.audio.discover) {
                        gameState.audio.discover();
                    }
                }, 2000);
            }
            
            // Clear the completion flag
            localStorage.removeItem('ar-minigame-completed');
        } catch (e) {
            console.error('Failed to process AR completion:', e);
            // Clear corrupted data to allow future attempts
            localStorage.removeItem('ar-minigame-completed');
        }
    }
}

// Start game when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}
