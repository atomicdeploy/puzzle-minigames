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
    availablePieces: [], // Track pieces that haven't been placed yet
    draggingPiece: null,
    selectedPiece: null, // For click-to-place mode
    audio: {
        error: null,
        success: null,
        discover: null,
        pickup: null
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
    
    // Create pickup sound (short beep)
    gameState.audio.pickup = () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
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
        
        // Add event listeners for click-to-place
        slot.addEventListener('click', handleSlotClick);
        
        // Keep drag/drop listeners for compatibility
        slot.addEventListener('dragover', handleDragOver);
        slot.addEventListener('drop', handleDrop);
        slot.addEventListener('touchmove', handleTouchMove);
        slot.addEventListener('touchend', handleTouchEnd);
        
        board.appendChild(slot);
    }
}

// Handle click on puzzle slot for click-to-place mode
function handleSlotClick(e) {
    if (!gameState.selectedPiece) return;
    
    const slot = e.currentTarget;
    const slotIndex = parseInt(slot.dataset.index);
    
    // Check if slot is already occupied
    if (gameState.puzzleBoard[slotIndex] !== null) {
        // Play error sound
        if (gameState.audio.error) {
            gameState.audio.error();
        }
        return;
    }
    
    // Place the piece
    const pieceNumber = gameState.selectedPiece.number;
    const pieceElement = gameState.selectedPiece.element;
    
    // Animate snap to slot
    animateSnapToSlot(pieceElement, slot, pieceNumber, slotIndex);
    
    // Clear selection
    gameState.selectedPiece = null;
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
    
    // Add to available pieces
    gameState.availablePieces.push(number);
    
    // Position pieces above the treasure chest area in a horizontal line
    const chestsContainer = document.getElementById('treasure-chests');
    const chestsRect = chestsContainer.getBoundingClientRect();
    const pieceWidth = 80;
    const spacing = 10;
    
    // Count existing pieces to position new one
    const existingPieces = document.querySelectorAll('.puzzle-piece').length;
    
    // Position in a row above the treasure chests (centered for transform)
    piece.style.position = 'fixed';
    piece.style.left = `${chestsRect.left + existingPieces * (pieceWidth + spacing) + pieceWidth / 2}px`;
    piece.style.top = `${chestsRect.top - 100 + 40}px`;
    piece.style.transform = 'translate(-50%, -50%)';
    
    // Drag events - disable native HTML5 drag
    piece.draggable = false;
    piece.addEventListener('mousedown', handlePieceMouseDown);
    piece.addEventListener('click', handlePieceClick);
    piece.addEventListener('touchstart', handleTouchStart, { passive: false });
    
    // Prevent clicks on the number badge from propagating
    const numberBadge = piece.querySelector('.puzzle-number');
    if (numberBadge) {
        numberBadge.addEventListener('click', (e) => e.stopPropagation());
        numberBadge.addEventListener('mousedown', (e) => e.stopPropagation());
        numberBadge.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: false });
    }
    
    document.body.appendChild(piece);
    
    // Animate entrance with bounce
    piece.style.animation = 'piece-entrance 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
    
    // Save state after adding piece
    saveGameState();
}

// Drag and Drop Handlers
function handlePieceMouseDown(e) {
    // Only start drag on left mouse button
    if (e.button !== 0) return;
    
    e.preventDefault();
    const element = e.currentTarget;
    const rect = element.getBoundingClientRect();
    
    // Play pickup sound and haptic
    if (gameState.audio.pickup) {
        gameState.audio.pickup();
    }
    
    try {
        Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
        console.debug('Haptics not available:', error.message);
    }
    
    gameState.draggingPiece = {
        element: element,
        number: parseInt(element.dataset.number)
    };
    
    // Initialize physics for mouse drag
    dragPhysics.currentX = rect.left;
    dragPhysics.currentY = rect.top;
    dragPhysics.targetX = rect.left;
    dragPhysics.targetY = rect.top;
    dragPhysics.velocityX = 0;
    dragPhysics.velocityY = 0;
    dragPhysics.rotation = 0;
    dragPhysics.targetRotation = 0;
    
    element.classList.add('dragging');
    element.style.transition = 'none';
    
    // Start physics animation
    if (dragPhysics.animationFrame) {
        cancelAnimationFrame(dragPhysics.animationFrame);
    }
    
    // Use a temporary container for desktop drag
    touchPiece = gameState.draggingPiece;
    dragPhysics.animationFrame = requestAnimationFrame(animateDrag);
    
    // Track mouse movement during drag
    document.addEventListener('mousemove', handleMouseDrag);
    document.addEventListener('mouseup', handleMouseDrop);
}

// Click handler for click-to-place mode
function handlePieceClick(e) {
    e.stopPropagation();
    
    const element = e.currentTarget;
    const number = parseInt(element.dataset.number);
    
    // Deselect if clicking the same piece
    if (gameState.selectedPiece && gameState.selectedPiece.number === number) {
        element.classList.remove('selected');
        gameState.selectedPiece = null;
        return;
    }
    
    // Deselect previous piece
    if (gameState.selectedPiece) {
        gameState.selectedPiece.element.classList.remove('selected');
    }
    
    // Select this piece
    element.classList.add('selected');
    gameState.selectedPiece = {
        element: element,
        number: number
    };
    
    // Play pickup sound
    if (gameState.audio.pickup) {
        gameState.audio.pickup();
    }
    
    try {
        Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
        console.debug('Haptics not available:', error.message);
    }
}

function handleDragStart(e) {
    // This is kept for compatibility but main handler is handlePieceMouseDown
    handlePieceMouseDown(e);
}

function handleMouseDrag(e) {
    if (!touchPiece) return;
    
    // Update target position for physics
    const rect = touchPiece.element.getBoundingClientRect();
    dragPhysics.targetX = e.clientX - rect.width / 2;
    dragPhysics.targetY = e.clientY - rect.height / 2;
}

function handleMouseDrop(e) {
    document.removeEventListener('mousemove', handleMouseDrag);
    document.removeEventListener('mouseup', handleMouseDrop);
    
    if (!touchPiece) return;
    
    // Stop animation
    if (dragPhysics.animationFrame) {
        cancelAnimationFrame(dragPhysics.animationFrame);
        dragPhysics.animationFrame = null;
    }
    
    const element = document.elementFromPoint(e.clientX, e.clientY);
    
    if (element && element.classList.contains('puzzle-slot')) {
        const slotIndex = parseInt(element.dataset.index);
        const pieceNumber = touchPiece.number;
        
        if (gameState.puzzleBoard[slotIndex] !== null) {
            animateReturnToPosition(touchPiece.element, pieceNumber);
        } else {
            animateSnapToSlot(touchPiece.element, element, pieceNumber, slotIndex);
        }
    } else {
        animateReturnToPosition(touchPiece.element, touchPiece.number);
    }
    
    touchPiece.element.classList.remove('dragging');
    touchPiece = null;
    gameState.draggingPiece = null;
}

function handleDragOver(e) {
    e.preventDefault();
    // Highlighting is now handled in mouse/touch move handlers
}

function handleDrop(e) {
    e.preventDefault();
    // Drop handling is now done in handleMouseDrop
}

// Touch handlers for mobile with physics
let touchPiece = null;
let touchOffset = { x: 0, y: 0 };
let dragPhysics = {
    currentX: 0,
    currentY: 0,
    targetX: 0,
    targetY: 0,
    velocityX: 0,
    velocityY: 0,
    rotation: 0,
    targetRotation: 0,
    animationFrame: null
};

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const element = e.currentTarget;
    
    // Play pickup sound and haptic
    if (gameState.audio.pickup) {
        gameState.audio.pickup();
    }
    
    try {
        Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
        console.debug('Haptics not available:', error.message);
    }
    
    touchPiece = {
        element: element,
        number: parseInt(element.dataset.number)
    };
    
    const rect = element.getBoundingClientRect();
    touchOffset = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
    };
    
    // Initialize physics
    dragPhysics.currentX = rect.left;
    dragPhysics.currentY = rect.top;
    dragPhysics.targetX = rect.left;
    dragPhysics.targetY = rect.top;
    dragPhysics.velocityX = 0;
    dragPhysics.velocityY = 0;
    dragPhysics.rotation = 0;
    dragPhysics.targetRotation = 0;
    
    element.classList.add('dragging');
    element.style.transition = 'none';
    gameState.draggingPiece = touchPiece;
    
    // Start animation loop
    if (dragPhysics.animationFrame) {
        cancelAnimationFrame(dragPhysics.animationFrame);
    }
    lastFrameTime = 0;
    dragPhysics.animationFrame = requestAnimationFrame(animateDrag);
}

// Physics-based animation loop for smooth dragging
let lastFrameTime = 0;

function animateDrag(timestamp) {
    if (!touchPiece) return;
    
    // Calculate delta time for frame-independent animation
    if (!lastFrameTime) lastFrameTime = timestamp;
    const deltaTime = Math.min((timestamp - lastFrameTime) / 16.67, 2); // Normalize to 60fps
    lastFrameTime = timestamp;
    
    const element = touchPiece.element;
    
    // Spring physics constants
    const springStrength = 0.3;
    const damping = 0.7;
    const rotationDamping = 0.85;
    
    // Calculate spring force
    const dx = dragPhysics.targetX - dragPhysics.currentX;
    const dy = dragPhysics.targetY - dragPhysics.currentY;
    
    // Update velocity with spring force
    dragPhysics.velocityX += dx * springStrength * deltaTime;
    dragPhysics.velocityY += dy * springStrength * deltaTime;
    
    // Apply damping
    dragPhysics.velocityX *= Math.pow(damping, deltaTime);
    dragPhysics.velocityY *= Math.pow(damping, deltaTime);
    
    // Update position
    dragPhysics.currentX += dragPhysics.velocityX * deltaTime;
    dragPhysics.currentY += dragPhysics.velocityY * deltaTime;
    
    // Wobble rotation based on velocity
    const velocityMagnitude = Math.sqrt(
        dragPhysics.velocityX * dragPhysics.velocityX + 
        dragPhysics.velocityY * dragPhysics.velocityY
    );
    dragPhysics.targetRotation = Math.sin(timestamp / 100) * velocityMagnitude * 0.5;
    
    // Smooth rotation interpolation
    dragPhysics.rotation += (dragPhysics.targetRotation - dragPhysics.rotation) * 0.2 * deltaTime;
    dragPhysics.rotation *= Math.pow(rotationDamping, deltaTime);
    
    // Apply transforms
    element.style.position = 'fixed';
    element.style.left = `${dragPhysics.currentX}px`;
    element.style.top = `${dragPhysics.currentY}px`;
    element.style.transform = `rotate(${dragPhysics.rotation}deg)`;
    element.style.zIndex = '10000';
    
    // Continue animation
    dragPhysics.animationFrame = requestAnimationFrame(animateDrag);
}

function handleTouchMove(e) {
    if (!touchPiece) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    
    // Update target position for physics
    dragPhysics.targetX = touch.clientX - touchOffset.x;
    dragPhysics.targetY = touch.clientY - touchOffset.y;
    
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
    
    // Stop animation loop
    if (dragPhysics.animationFrame) {
        cancelAnimationFrame(dragPhysics.animationFrame);
        dragPhysics.animationFrame = null;
    }
    
    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (element && element.classList.contains('puzzle-slot')) {
        const slotIndex = parseInt(element.dataset.index);
        const pieceNumber = touchPiece.number;
        
        // Check if slot is already occupied
        if (gameState.puzzleBoard[slotIndex] !== null) {
            // Slot is occupied, animate return to original position
            animateReturnToPosition(touchPiece.element, pieceNumber);
        } else {
            // Allow placement at any position with snap animation
            animateSnapToSlot(touchPiece.element, element, pieceNumber, slotIndex);
        }
    } else {
        // Return piece to original position if dropped outside
        animateReturnToPosition(touchPiece.element, touchPiece.number);
    }
    
    touchPiece.element.classList.remove('dragging');
    touchPiece = null;
    gameState.draggingPiece = null;
}

// Utility function for promise-based delays
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Animate piece snapping to slot
async function animateSnapToSlot(pieceElement, slotElement, pieceNumber, slotIndex) {
    const slotRect = slotElement.getBoundingClientRect();
    const targetX = slotRect.left + slotRect.width / 2;
    const targetY = slotRect.top + slotRect.height / 2;
    
    pieceElement.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
    pieceElement.style.left = `${targetX}px`;
    pieceElement.style.top = `${targetY}px`;
    pieceElement.style.transform = 'translate(-50%, -50%) scale(1.1) rotate(0deg)';
    
    await delay(50);
    
    pieceElement.style.transform = 'translate(-50%, -50%) scale(1) rotate(0deg)';
    
    await delay(150);
    
    // Remove from available pieces
    const index = gameState.availablePieces.indexOf(pieceNumber);
    if (index > -1) {
        gameState.availablePieces.splice(index, 1);
    }
    
    placePuzzlePiece(slotElement, pieceNumber);
    pieceElement.remove();
    
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
    
    // Save state
    saveGameState();
}

// Animate piece returning to original position
async function animateReturnToPosition(pieceElement, pieceNumber) {
    const chestsContainer = document.getElementById('treasure-chests');
    const chestsRect = chestsContainer.getBoundingClientRect();
    const pieceWidth = 80;
    const spacing = 10;
    
    // Find the index of this piece among all pieces
    const allPieces = Array.from(document.querySelectorAll('.puzzle-piece'));
    const pieceIndex = allPieces.indexOf(pieceElement);
    
    const targetX = chestsRect.left + pieceIndex * (pieceWidth + spacing) + pieceWidth / 2;
    const targetY = chestsRect.top - 100 + 40;
    
    pieceElement.style.transition = 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    pieceElement.style.left = `${targetX}px`;
    pieceElement.style.top = `${targetY}px`;
    pieceElement.style.transform = 'translate(-50%, -50%) rotate(0deg)';
    
    await delay(400);
    
    pieceElement.style.transition = '';
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
    });
    
    // Only validate if all slots are filled
    if (board.every(p => p !== null)) {
        const MAGIC_SUM = 15;
        const validSlots = new Set();
        const invalidSlots = new Set();
        
        // Check rows
        for (let row = 0; row < 3; row++) {
            const sum = board[row * 3] + board[row * 3 + 1] + board[row * 3 + 2];
            const isValid = sum === MAGIC_SUM;
            for (let col = 0; col < 3; col++) {
                const index = row * 3 + col;
                if (isValid) {
                    validSlots.add(index);
                } else {
                    invalidSlots.add(index);
                }
            }
        }
        
        // Check columns
        for (let col = 0; col < 3; col++) {
            const sum = board[col] + board[col + 3] + board[col + 6];
            const isValid = sum === MAGIC_SUM;
            for (let row = 0; row < 3; row++) {
                const index = row * 3 + col;
                if (!isValid) {
                    invalidSlots.add(index);
                    validSlots.delete(index);
                } else if (!invalidSlots.has(index)) {
                    validSlots.add(index);
                }
            }
        }
        
        // Check main diagonal (top-left to bottom-right: مورب)
        const mainDiagonalSum = board[0] + board[4] + board[8];
        const isMainDiagonalValid = mainDiagonalSum === MAGIC_SUM;
        [0, 4, 8].forEach(index => {
            if (!isMainDiagonalValid) {
                invalidSlots.add(index);
                validSlots.delete(index);
            } else if (!invalidSlots.has(index)) {
                validSlots.add(index);
            }
        });
        
        // Check anti-diagonal (top-right to bottom-left: مورب)
        const antiDiagonalSum = board[2] + board[4] + board[6];
        const isAntiDiagonalValid = antiDiagonalSum === MAGIC_SUM;
        [2, 4, 6].forEach(index => {
            if (!isAntiDiagonalValid) {
                invalidSlots.add(index);
                validSlots.delete(index);
            } else if (!invalidSlots.has(index)) {
                validSlots.add(index);
            }
        });
        
        // Apply validation classes
        validSlots.forEach(index => {
            const slot = document.querySelector(`.puzzle-slot[data-index="${index}"]`);
            if (slot) slot.classList.add('valid');
        });
        
        invalidSlots.forEach(index => {
            const slot = document.querySelector(`.puzzle-slot[data-index="${index}"]`);
            if (slot) slot.classList.add('invalid');
        });
    }
}

// Helper function to check if board is a valid magic square
function isValidMagicSquare(board) {
    const MAGIC_SUM = 15;
    
    // Check rows
    for (let row = 0; row < 3; row++) {
        const sum = board[row * 3] + board[row * 3 + 1] + board[row * 3 + 2];
        if (sum !== MAGIC_SUM) return false;
    }
    
    // Check columns
    for (let col = 0; col < 3; col++) {
        const sum = board[col] + board[col + 3] + board[col + 6];
        if (sum !== MAGIC_SUM) return false;
    }
    
    // Check diagonals (مورب)
    const mainDiagonalSum = board[0] + board[4] + board[8];
    const antiDiagonalSum = board[2] + board[4] + board[6];
    
    return mainDiagonalSum === MAGIC_SUM && antiDiagonalSum === MAGIC_SUM;
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
        if (isValidMagicSquare(gameState.puzzleBoard)) {
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
            gameState.availablePieces = data.availablePieces || [];
            
            // Restore UI - treasure chests
            gameState.discoveredPuzzles.forEach(number => {
                const chest = document.querySelector(`.treasure-chest[data-number="${number}"]`);
                if (chest) {
                    chest.classList.add('opened');
                    chest.innerHTML = '📦';
                }
            });
            
            // Restore UI - puzzle board
            gameState.puzzleBoard.forEach((number, index) => {
                if (number) {
                    const slot = document.querySelector(`.puzzle-slot[data-index="${index}"]`);
                    if (slot) {
                        slot.className = 'puzzle-slot filled';
                        slot.innerHTML = `🧩<div class="puzzle-number">${number}</div>`;
                    }
                }
            });
            
            // Restore available pieces (recreate them without saving)
            gameState.availablePieces.forEach(number => {
                recreatePuzzlePiece(number);
            });
            
            updateStats();
            validateMagicSquare();
        } catch (e) {
            console.error('Failed to load game state:', e);
        }
    }
}

// Recreate puzzle piece from saved state (without adding to availablePieces again)
function recreatePuzzlePiece(number) {
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
    
    // Position in a row above the treasure chests (centered for transform)
    piece.style.position = 'fixed';
    piece.style.left = `${chestsRect.left + existingPieces * (pieceWidth + spacing) + pieceWidth / 2}px`;
    piece.style.top = `${chestsRect.top - 100 + 40}px`;
    piece.style.transform = 'translate(-50%, -50%)';
    
    // Drag events - disable native HTML5 drag
    piece.draggable = false;
    piece.addEventListener('mousedown', handlePieceMouseDown);
    piece.addEventListener('click', handlePieceClick);
    piece.addEventListener('touchstart', handleTouchStart, { passive: false });
    
    // Prevent clicks on the number badge from propagating
    const numberBadge = piece.querySelector('.puzzle-number');
    if (numberBadge) {
        numberBadge.addEventListener('click', (e) => e.stopPropagation());
        numberBadge.addEventListener('mousedown', (e) => e.stopPropagation());
        numberBadge.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: false });
    }
    
    document.body.appendChild(piece);
}

// Save game state to localStorage
function saveGameState() {
    const data = {
        discoveredPuzzles: Array.from(gameState.discoveredPuzzles),
        puzzleBoard: gameState.puzzleBoard,
        availablePieces: gameState.availablePieces
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
