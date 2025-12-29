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
    
    // Icon mapping for special puzzles
    const iconMap = {
        3: '🪞' // Mirror icon for puzzle 3
    };
    
    for (let i = 1; i <= PUZZLE_SIZE; i++) {
        const chest = document.createElement('div');
        chest.className = 'treasure-chest';
        chest.dataset.number = i;
        chest.innerHTML = iconMap[i] || '🎁';
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
    
    // Haptic feedback
    try {
        Haptics.impact({ style: ImpactStyle.Medium });
    } catch (e) {
        // Haptics not available in web browsers
        console.debug('Haptics not available:', e.message);
    }
    
    // Check if this puzzle has a minigame
    const minigames = {
        2: '/minigames/minigame-2/index.html',
        3: '/minigames/minigame-mirror/index.html'
        // Add more minigames here
    };
    
    if (minigames[number]) {
        // Open minigame
        openMinigame(number, minigames[number]);
    } else {
        // Directly unlock puzzle piece (for puzzles without minigames)
        unlockPuzzlePiece(number);
    }
}

// Open a minigame
function openMinigame(puzzleNumber, minigameUrl) {
    // Create minigame modal
    const modal = document.createElement('div');
    modal.id = 'minigame-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        z-index: 10000;
        display: flex;
        flex-direction: column;
    `;
    
    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.setAttribute('aria-label', 'Close minigame');
    closeBtn.style.cssText = `
        position: absolute;
        top: 1rem;
        left: 1rem;
        width: 50px;
        height: 50px;
        background: rgba(214, 48, 49, 0.9);
        color: white;
        border: none;
        border-radius: 50%;
        font-size: 2rem;
        cursor: pointer;
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    `;
    // Listen for minigame completion
    function handleMinigameMessage(event) {
        // Validate message origin for security
        // Minigames are served from same origin, so this prevents external malicious messages
        if (event.origin !== window.location.origin) {
            return;
        }
        
        if (event.data.type === 'minigame-complete') {
            if (event.data.success && event.data.puzzleNumber === puzzleNumber) {
                // Close modal
                modal.remove();
                
                // Unlock puzzle piece
                unlockPuzzlePiece(puzzleNumber);
                
                // Remove this listener
                window.removeEventListener('message', handleMinigameMessage);
            }
        } else if (event.data.type === 'minigame-exit') {
            modal.remove();
            window.removeEventListener('message', handleMinigameMessage);
        }
    }
    
    closeBtn.addEventListener('click', () => {
        modal.remove();
        // Clean up message event listener when modal is manually closed
        window.removeEventListener('message', handleMinigameMessage);
    });
    
    // Create iframe for minigame
    const iframe = document.createElement('iframe');
    iframe.src = minigameUrl;
    iframe.setAttribute('title', 'بازی کوچک وزن توپ سفید');
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    iframe.style.cssText = `
        width: 100%;
        height: 100%;
        border: none;
    `;
    
    modal.appendChild(closeBtn);
    modal.appendChild(iframe);
    document.body.appendChild(modal);
    
    // Add message event listener
    window.addEventListener('message', handleMinigameMessage);
}

// Unlock a puzzle piece (separated from treasure chest opening)
function unlockPuzzlePiece(number) {
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
    
    // Create draggable puzzle piece
    createPuzzlePiece(number);
    
    // Update stats
    updateStats();
    
    // Show notification
    showNotification(`پازل ${number} کشف شد! 🎉`);
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
    initUI();
    
    // Hide loading screen
    setTimeout(() => {
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('game-container').style.display = 'flex';
        
        // Show welcome modal on first visit
        showWelcomeModal();
    }, 1500);
}

// UI Initialization
function initUI() {
    const menuBtn = document.getElementById('menu-btn');
    const menuCloseBtn = document.getElementById('menu-close-btn');
    const sideMenu = document.getElementById('side-menu');
    const welcomeModal = document.getElementById('welcome-modal');
    const startGameBtn = document.getElementById('start-game-btn');
    const contactLink = document.getElementById('contact-link');
    const homeLink = document.getElementById('home-link');
    const aboutLink = document.getElementById('about-link');
    const contactPage = document.getElementById('contact-page');
    
    // Null checks for required elements
    if (!menuBtn || !menuCloseBtn || !sideMenu || !welcomeModal || !startGameBtn || 
        !contactLink || !homeLink || !aboutLink || !contactPage) {
        console.error('Required UI elements not found');
        return;
    }
    
    const modalClose = welcomeModal.querySelector('.modal-close');
    const pageClose = contactPage.querySelector('.page-close');
    
    if (!modalClose || !pageClose) {
        console.error('Required close buttons not found');
        return;
    }
    
    // Create or get menu overlay (prevent duplicate creation)
    let menuOverlay = document.querySelector('.menu-overlay');
    if (!menuOverlay) {
        menuOverlay = document.createElement('div');
        menuOverlay.className = 'menu-overlay';
        document.body.appendChild(menuOverlay);
    }
    
    // Store the last focused element for focus management
    let lastFocusedElement = null;
    
    // Delay for focus after DOM updates/animations (in milliseconds)
    const FOCUS_DELAY = 100;
    
    // Keyboard accessibility - Escape key handler
    const handleEscapeKey = (event) => {
        if (event.key === 'Escape' || event.key === 'Esc') {
            // Close modal if open
            if (welcomeModal.style.display !== 'none') {
                welcomeModal.style.display = 'none';
                try {
                    localStorage.setItem('infernal-welcome-shown', 'true');
                } catch (e) {
                    console.warn('localStorage not available:', e);
                }
                if (lastFocusedElement) {
                    lastFocusedElement.focus();
                    lastFocusedElement = null;
                }
            }
            // Close side menu if open
            else if (sideMenu.classList.contains('open')) {
                sideMenu.classList.remove('open');
                menuOverlay.classList.remove('active');
                if (lastFocusedElement) {
                    lastFocusedElement.focus();
                    lastFocusedElement = null;
                }
            }
            // Close contact page if open
            else if (contactPage.style.display !== 'none') {
                contactPage.style.display = 'none';
                updateMenuActive('home-link');
                if (lastFocusedElement) {
                    lastFocusedElement.focus();
                    lastFocusedElement = null;
                }
            }
        }
    };
    
    // Add global escape key listener
    document.addEventListener('keydown', handleEscapeKey);
    
    // Menu toggle
    menuBtn.addEventListener('click', () => {
        lastFocusedElement = document.activeElement;
        sideMenu.classList.add('open');
        menuOverlay.classList.add('active');
        // Focus first menu item for keyboard navigation
        setTimeout(() => homeLink.focus(), FOCUS_DELAY);
    });
    
    menuCloseBtn.addEventListener('click', () => {
        sideMenu.classList.remove('open');
        menuOverlay.classList.remove('active');
        if (lastFocusedElement) {
            lastFocusedElement.focus();
            lastFocusedElement = null;
        }
    });
    
    menuOverlay.addEventListener('click', () => {
        sideMenu.classList.remove('open');
        menuOverlay.classList.remove('active');
        if (lastFocusedElement) {
            lastFocusedElement.focus();
            lastFocusedElement = null;
        }
    });
    
    // Welcome modal
    startGameBtn.addEventListener('click', () => {
        welcomeModal.style.display = 'none';
        try {
            localStorage.setItem('infernal-welcome-shown', 'true');
        } catch (e) {
            console.warn('localStorage not available:', e);
        }
        if (lastFocusedElement) {
            lastFocusedElement.focus();
            lastFocusedElement = null;
        }
    });
    
    modalClose.addEventListener('click', () => {
        welcomeModal.style.display = 'none';
        try {
            localStorage.setItem('infernal-welcome-shown', 'true');
        } catch (e) {
            console.warn('localStorage not available:', e);
        }
        if (lastFocusedElement) {
            lastFocusedElement.focus();
            lastFocusedElement = null;
        }
    });
    
    // Close welcome modal when clicking on the backdrop (outside modal content)
    welcomeModal.addEventListener('click', (event) => {
        if (event.target === welcomeModal) {
            welcomeModal.style.display = 'none';
            try {
                localStorage.setItem('infernal-welcome-shown', 'true');
            } catch (e) {
                console.warn('localStorage not available:', e);
            }
            if (lastFocusedElement) {
                lastFocusedElement.focus();
                lastFocusedElement = null;
            }
        }
    });
    
    // Contact page
    contactLink.addEventListener('click', (e) => {
        e.preventDefault();
        lastFocusedElement = document.activeElement;
        contactPage.style.display = 'block';
        sideMenu.classList.remove('open');
        menuOverlay.classList.remove('active');
        updateMenuActive('contact-link');
        // Focus close button for keyboard navigation
        setTimeout(() => pageClose.focus(), FOCUS_DELAY);
    });
    
    homeLink.addEventListener('click', (e) => {
        e.preventDefault();
        contactPage.style.display = 'none';
        sideMenu.classList.remove('open');
        menuOverlay.classList.remove('active');
        updateMenuActive('home-link');
        if (lastFocusedElement) {
            lastFocusedElement.focus();
            lastFocusedElement = null;
        }
    });
    
    aboutLink.addEventListener('click', (e) => {
        e.preventDefault();
        lastFocusedElement = document.activeElement;
        showAboutModal();
        sideMenu.classList.remove('open');
        menuOverlay.classList.remove('active');
        // Focus close button for keyboard navigation
        setTimeout(() => modalClose.focus(), FOCUS_DELAY);
    });
    
    pageClose.addEventListener('click', () => {
        contactPage.style.display = 'none';
        updateMenuActive('home-link');
        if (lastFocusedElement) {
            lastFocusedElement.focus();
            lastFocusedElement = null;
        }
    });
}

// Show/hide welcome modal
function setWelcomeModalVisibility(visible) {
    const welcomeModal = document.getElementById('welcome-modal');
    if (!welcomeModal) {
        return;
    }
    welcomeModal.style.display = visible ? 'flex' : 'none';
}

// Show welcome modal on first visit
function showWelcomeModal() {
    try {
        const hasShown = localStorage.getItem('infernal-welcome-shown');
        if (hasShown !== 'true') {
            setWelcomeModalVisibility(true);
        }
    } catch (e) {
        console.warn('localStorage not available:', e);
        // Show modal by default if localStorage is not available
        setWelcomeModalVisibility(true);
    }
}

// Show about modal (same as welcome but can be triggered from menu)
function showAboutModal() {
    setWelcomeModalVisibility(true);
}

// Update active menu item
function updateMenuActive(activeId) {
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    const activeElement = document.getElementById(activeId);
    if (activeElement) {
        activeElement.classList.add('active');
    }
}

// Start game when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}
