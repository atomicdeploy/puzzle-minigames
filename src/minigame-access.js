// Timing constants for validation flow
const VALIDATION_DELAYS = {
    INVALID_URL: 1000,
    VALIDATION_CHECK: 1000,
    ACCESS_GRANT: 1500,
    AUTO_UNLOCK: 2000
};

// Parse URL parameters
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        game: params.get('game'),
        token: params.get('token')
    };
}

// Validate UUID format
function isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

// Validate game number
function isValidGameNumber(gameNumber) {
    const num = parseInt(gameNumber);
    return !isNaN(num) && num >= 1 && num <= 9;
}

// Get game descriptions
function getGameDescription(gameNumber) {
    const descriptions = {
        1: 'پازل منطقی - سطح ساده',
        2: 'معمای کلمات - سطح متوسط',
        3: 'بازی حافظه - سطح ساده',
        4: 'پازل تصویری - سطح سخت',
        5: 'معمای ریاضی - سطح متوسط',
        6: 'بازی پیدا کردن تفاوت - سطح ساده',
        7: 'معمای منطقی - سطح سخت',
        8: 'پازل سودوکو - سطح متوسط',
        9: 'بازی نهایی - سطح خیلی سخت'
    };
    return descriptions[gameNumber] || 'مینی‌گیم جذاب';
}

// Show specific state
function showState(stateName) {
    const states = ['loading', 'access-granted', 'access-denied', 'invalid-url'];
    states.forEach(state => {
        document.getElementById(state).style.display = state === stateName ? 'flex' : 'none';
    });
}

// Validate access and show appropriate page
async function validateAccess() {
    const params = getUrlParams();

    // Check if URL has required parameters
    if (!params.game || !params.token) {
        setTimeout(() => showState('invalid-url'), VALIDATION_DELAYS.INVALID_URL);
        return;
    }

    // Validate game number
    if (!isValidGameNumber(params.game)) {
        setTimeout(() => {
            showState('access-denied');
            document.getElementById('errorMessage').textContent = 
                'شماره مینی‌گیم نامعتبر است. شماره باید بین 1 تا 9 باشد.';
        }, VALIDATION_DELAYS.VALIDATION_CHECK);
        return;
    }

    // Validate token format (UUID v4)
    if (!isValidUUID(params.token)) {
        setTimeout(() => {
            showState('access-denied');
            document.getElementById('errorMessage').textContent = 
                'فرمت توکن دسترسی نامعتبر است. لطفاً از کد QR معتبر استفاده کنید.';
        }, VALIDATION_DELAYS.VALIDATION_CHECK);
        return;
    }

    // Here you would typically verify the token with a backend server
    // For now, we'll simulate validation with stored tokens
    const isValid = await verifyToken(params.game, params.token);

    setTimeout(() => {
        if (isValid) {
            // Access granted
            showState('access-granted');
            document.getElementById('gameNumber').textContent = params.game;
            document.getElementById('gameDescription').textContent = getGameDescription(params.game);
            document.getElementById('tokenDisplay').textContent = params.token;
            
            // Setup start game button
            document.getElementById('startGameBtn').addEventListener('click', () => {
                startGame(params.game, params.token);
            });
        } else {
            // Access denied
            showState('access-denied');
        }
    }, VALIDATION_DELAYS.ACCESS_GRANT);
}

// Verify token (this would typically be a server-side check)
async function verifyToken(gameNumber, token) {
    // For demonstration purposes, we'll accept any valid UUID format
    // In a real application, you would:
    // 1. Send the token to your backend server
    // 2. Check if it exists in your database
    // 3. Verify it hasn't been used (if single-use)
    // 4. Check if it hasn't expired (if time-limited)
    // 5. Return the validation result

    // Simulate server delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Store access in localStorage (for tracking purposes)
    const accessKey = `minigame_access_${gameNumber}`;
    const accessData = {
        token: token,
        timestamp: new Date().toISOString(),
        gameNumber: gameNumber
    };
    
    try {
        // Check if this token has been used before
        const existingAccess = localStorage.getItem(accessKey);
        if (existingAccess) {
            const existing = JSON.parse(existingAccess);
            // Allow re-access with same token (for development/testing)
            // In production, you might want to make tokens single-use
            if (existing.token === token) {
                return true;
            }
        }

        // Store the access
        localStorage.setItem(accessKey, JSON.stringify(accessData));
        return true;
    } catch (e) {
        console.error('Error storing access data:', e);
        return true; // Still allow access even if localStorage fails
    }
}

// Start the game
function startGame(gameNumber, token) {
    // Store the token for the game to use
    sessionStorage.setItem('currentGameToken', token);
    sessionStorage.setItem('currentGameNumber', gameNumber);

    // Navigate to the main game with the puzzle unlocked
    // For now, we'll redirect to the main page with a special parameter
    const mainGameUrl = new URL('/', window.location.origin);
    mainGameUrl.searchParams.set('unlock', gameNumber);
    mainGameUrl.searchParams.set('token', token);
    
    window.location.href = mainGameUrl.toString();
}

// Setup retry button
function setupRetryButton() {
    document.getElementById('retryBtn').addEventListener('click', () => {
        location.reload();
    });
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0%, 100% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.05);
        }
    }
    
    .btn-primary:active,
    .btn-secondary:active {
        animation: pulse 0.3s ease;
    }
`;
document.head.appendChild(style);

// Initialize when DOM is ready
function init() {
    setupRetryButton();
    validateAccess();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        isValidUUID,
        isValidGameNumber,
        getGameDescription,
        getUrlParams
    };
}
