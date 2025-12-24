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

// Create Puzzle Piece
function createPuzzlePiece(number) {
    const piece = document.createElement('div');
    piece.className = 'puzzle-piece';
    piece.dataset.number = number;
    piece.innerHTML = `🧩<div class="puzzle-number">${number}</div>`;
    
    // Position pieces above the treasure chest area in a horizontal line
    const chestsContainer = document.getElementById('treasure-chests');
    const chestsRect = chestsContainer.getBoundingClientRect();
    const pieceWidth = 80;
    const spacing = 10;
    
    // Count existing pieces to position new one
    const existingPieces = document.querySelectorAll('.puzzle-piece').length;
    
    // Position in a row above the treasure chests
    piece.style.position = 'fixed';
    piece.style.left = `${chestsRect.left + existingPieces * (pieceWidth + spacing)}px`;
    piece.style.top = `${chestsRect.top - 100}px`;
    piece.style.transform = 'none';
    
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
    
    // Check if slot is already occupied
    if (gameState.puzzleBoard[slotIndex] !== null) {
        // Slot is occupied, don't allow placement
        gameState.draggingPiece.element.classList.remove('dragging');
        gameState.draggingPiece = null;
        return;
    }
    
    // Allow placement at any position
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
    
    gameState.draggingPiece.element.classList.remove('dragging');
    gameState.draggingPiece = null;
    
    // Validate magic square after placement
    validateMagicSquare();
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
    const pieceElement = touchPiece.element;
    
    // Update position to follow touch
    pieceElement.style.position = 'fixed';
    pieceElement.style.left = `${touch.clientX - touchOffset.x}px`;
    pieceElement.style.top = `${touch.clientY - touchOffset.y}px`;
    pieceElement.style.transform = 'none';
    pieceElement.style.zIndex = '10000';
    
    // Highlight the slot under the touch point
    const elementUnder = document.elementFromPoint(touch.clientX, touch.clientY);
    
    // Remove highlight from all slots
    document.querySelectorAll('.puzzle-slot').forEach(slot => {
        slot.classList.remove('highlight');
    });
    
    // Add highlight to the slot under the touch if it exists and is empty
    if (elementUnder && elementUnder.classList.contains('puzzle-slot')) {
        const slotIndex = parseInt(elementUnder.dataset.index);
        if (gameState.puzzleBoard[slotIndex] === null) {
            elementUnder.classList.add('highlight');
        }
    }
}

function handleTouchEnd(e) {
    if (!touchPiece) return;
    e.preventDefault();
    
    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (element && element.classList.contains('puzzle-slot')) {
        const slotIndex = parseInt(element.dataset.index);
        const pieceNumber = touchPiece.number;
        
        // Check if slot is already occupied
        if (gameState.puzzleBoard[slotIndex] !== null) {
            // Slot is occupied, return piece to original position
            returnPieceToOriginalPosition(touchPiece.element, pieceNumber);
        } else {
            // Allow placement at any position
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
            
            // Validate magic square after placement
            validateMagicSquare();
        }
    } else {
        // Return piece to original position if dropped outside
        returnPieceToOriginalPosition(touchPiece.element, touchPiece.number);
    }
    
    touchPiece.element.classList.remove('dragging');
    touchPiece = null;
    gameState.draggingPiece = null;
}

// Helper function to return piece to its original position
function returnPieceToOriginalPosition(pieceElement, pieceNumber) {
    const chestsContainer = document.getElementById('treasure-chests');
    const chestsRect = chestsContainer.getBoundingClientRect();
    const pieceWidth = 80;
    const spacing = 10;
    
    // Find the index of this piece among all pieces
    const allPieces = Array.from(document.querySelectorAll('.puzzle-piece'));
    const pieceIndex = allPieces.indexOf(pieceElement);
    
    pieceElement.style.position = 'fixed';
    pieceElement.style.left = `${chestsRect.left + pieceIndex * (pieceWidth + spacing)}px`;
    pieceElement.style.top = `${chestsRect.top - 100}px`;
    pieceElement.style.transform = 'none';
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

// Validate Magic Square (rows, columns, and diagonals must sum to 15)
function validateMagicSquare() {
    const board = gameState.puzzleBoard;
    
    // Clear previous validation classes
    document.querySelectorAll('.puzzle-slot').forEach(slot => {
        slot.classList.remove('valid', 'invalid');
        if (slot.classList.contains('filled')) {
            slot.classList.add('filled');
        }
    });
    
    // Only validate if all slots are filled
    if (board.every(p => p !== null)) {
        const MAGIC_SUM = 15;
        
        // Check rows
        for (let row = 0; row < 3; row++) {
            const sum = board[row * 3] + board[row * 3 + 1] + board[row * 3 + 2];
            const isValid = sum === MAGIC_SUM;
            for (let col = 0; col < 3; col++) {
                const slot = document.querySelector(`.puzzle-slot[data-index="${row * 3 + col}"]`);
                slot.classList.add(isValid ? 'valid' : 'invalid');
            }
        }
        
        // Check columns
        for (let col = 0; col < 3; col++) {
            const sum = board[col] + board[col + 3] + board[col + 6];
            const isValid = sum === MAGIC_SUM;
            for (let row = 0; row < 3; row++) {
                const slot = document.querySelector(`.puzzle-slot[data-index="${row * 3 + col}"]`);
                // Only mark as invalid if not already valid from row check
                if (!slot.classList.contains('valid')) {
                    slot.classList.add(isValid ? 'valid' : 'invalid');
                } else if (!isValid) {
                    // If row was valid but column is not, mark as invalid
                    slot.classList.remove('valid');
                    slot.classList.add('invalid');
                }
            }
        }
        
        // Check main diagonal (top-left to bottom-right: مورب)
        const mainDiagonalSum = board[0] + board[4] + board[8];
        const isMainDiagonalValid = mainDiagonalSum === MAGIC_SUM;
        [0, 4, 8].forEach(index => {
            const slot = document.querySelector(`.puzzle-slot[data-index="${index}"]`);
            if (!slot.classList.contains('valid')) {
                slot.classList.add(isMainDiagonalValid ? 'valid' : 'invalid');
            } else if (!isMainDiagonalValid) {
                slot.classList.remove('valid');
                slot.classList.add('invalid');
            }
        });
        
        // Check anti-diagonal (top-right to bottom-left: مورب)
        const antiDiagonalSum = board[2] + board[4] + board[6];
        const isAntiDiagonalValid = antiDiagonalSum === MAGIC_SUM;
        [2, 4, 6].forEach(index => {
            const slot = document.querySelector(`.puzzle-slot[data-index="${index}"]`);
            if (!slot.classList.contains('valid')) {
                slot.classList.add(isAntiDiagonalValid ? 'valid' : 'invalid');
            } else if (!isAntiDiagonalValid) {
                slot.classList.remove('valid');
                slot.classList.add('invalid');
            }
        });
    }
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
        // Check if it's a valid magic square
        const MAGIC_SUM = 15;
        const board = gameState.puzzleBoard;
        let isValidMagicSquare = true;
        
        // Check rows
        for (let row = 0; row < 3; row++) {
            const sum = board[row * 3] + board[row * 3 + 1] + board[row * 3 + 2];
            if (sum !== MAGIC_SUM) isValidMagicSquare = false;
        }
        
        // Check columns
        for (let col = 0; col < 3; col++) {
            const sum = board[col] + board[col + 3] + board[col + 6];
            if (sum !== MAGIC_SUM) isValidMagicSquare = false;
        }
        
        // Check diagonals (مورب)
        const mainDiagonalSum = board[0] + board[4] + board[8];
        const antiDiagonalSum = board[2] + board[4] + board[6];
        if (mainDiagonalSum !== MAGIC_SUM || antiDiagonalSum !== MAGIC_SUM) {
            isValidMagicSquare = false;
        }
        
        if (isValidMagicSquare) {
            setTimeout(() => {
                showNotification('🎉 تبریک! مربع جادویی درست است! 🎉', 3000);
                celebrateCompletion();
            }, 500);
        } else {
            setTimeout(() => {
                showNotification('❌ مجموع ردیف‌ها، ستون‌ها و مورب‌ها باید ۱۵ باشد', 2500);
            }, 500);
        }
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
            validateMagicSquare();
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
    
    // Hide loading screen
    setTimeout(() => {
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('game-container').style.display = 'flex';
    }, 1500);
}

// Start game when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}
