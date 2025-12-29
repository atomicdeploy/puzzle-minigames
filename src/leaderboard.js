import './leaderboard.css';

// Constants
const LEADERBOARD_KEY = 'infernal-leaderboard';
const USERNAME_KEY = 'infernal-username';
const REFRESH_INTERVAL = 5000; // 5 seconds

// State
let leaderboardData = [];
let currentUsername = '';

// Initialize leaderboard
function init() {
    loadUsername();
    loadLeaderboard();
    setupEventListeners();
    startAutoRefresh();
    updateStats();
}

// Load username from localStorage
function loadUsername() {
    currentUsername = localStorage.getItem(USERNAME_KEY) || '';
    const usernameInput = document.getElementById('username-input');
    usernameInput.value = currentUsername;
    
    if (currentUsername) {
        updateUserAvatar(currentUsername);
    }
}

// Load leaderboard data from localStorage
function loadLeaderboard() {
    try {
        const data = localStorage.getItem(LEADERBOARD_KEY);
        leaderboardData = data ? JSON.parse(data) : [];
        
        // Sort by score (descending)
        leaderboardData.sort((a, b) => b.score - a.score);
        
        renderLeaderboard();
    } catch (e) {
        console.error('Failed to load leaderboard:', e);
        leaderboardData = [];
        renderLeaderboard();
    }
}

// Render leaderboard table
function renderLeaderboard() {
    const tbody = document.getElementById('leaderboard-body');
    const emptyState = document.getElementById('empty-state');
    
    if (leaderboardData.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    tbody.innerHTML = leaderboardData.map((entry, index) => {
        const rank = index + 1;
        const rankClass = `rank-${Math.min(rank, 3)}`;
        const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
        
        return `
            <tr class="${rankClass}">
                <td class="rank-cell">${rankEmoji} ${rank}</td>
                <td>
                    <div class="player-cell">
                        <div class="player-avatar">${getAvatarEmoji(entry.userName)}</div>
                        <div class="player-name">${escapeHtml(entry.userName)}</div>
                    </div>
                </td>
                <td class="score-cell">${formatNumber(entry.score)}</td>
                <td class="time-cell">${formatTime(entry.completionTime)}</td>
                <td class="attempts-cell">${formatNumber(entry.attempts)}</td>
                <td>
                    <span class="status-badge status-${entry.status}">
                        ${entry.status === 'completed' ? '✓ تکمیل' : '▶ در حال بازی'}
                    </span>
                </td>
                <td class="date-cell">${formatDate(entry.timestamp)}</td>
            </tr>
        `;
    }).join('');
    
    // Add animation class with delay for each row
    const rows = tbody.querySelectorAll('tr');
    rows.forEach((row, index) => {
        row.style.animationDelay = `${index * 0.05}s`;
    });
}

// Update statistics
function updateStats() {
    const totalPlayers = new Set(leaderboardData.map(e => e.userName)).size;
    const totalGames = leaderboardData.length;
    const avgTime = leaderboardData.length > 0
        ? leaderboardData.reduce((sum, e) => sum + e.completionTime, 0) / leaderboardData.length
        : 0;
    
    document.getElementById('total-players').textContent = formatNumber(totalPlayers);
    document.getElementById('total-games').textContent = formatNumber(totalGames);
    document.getElementById('avg-time').textContent = formatTime(avgTime);
}

// Setup event listeners
function setupEventListeners() {
    // Back button
    document.getElementById('back-btn').addEventListener('click', () => {
        window.location.href = '/';
    });
    
    // Refresh button
    document.getElementById('refresh-btn').addEventListener('click', () => {
        refreshLeaderboard();
    });
    
    // Save username button
    document.getElementById('save-username-btn').addEventListener('click', () => {
        saveUsername();
    });
    
    // Username input - save on Enter
    document.getElementById('username-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveUsername();
        }
    });
}

// Save username
function saveUsername() {
    const usernameInput = document.getElementById('username-input');
    const newUsername = usernameInput.value.trim();
    
    if (!newUsername) {
        showNotification('لطفا یک نام وارد کنید', 'error');
        return;
    }
    
    if (newUsername.length > 20) {
        showNotification('نام باید کمتر از ۲۰ کاراکتر باشد', 'error');
        return;
    }
    
    localStorage.setItem(USERNAME_KEY, newUsername);
    currentUsername = newUsername;
    updateUserAvatar(newUsername);
    showNotification('✓ نام شما ذخیره شد!', 'success');
}

// Update user avatar
function updateUserAvatar(username) {
    const avatar = document.getElementById('user-avatar');
    avatar.textContent = getAvatarEmoji(username);
}

// Get avatar emoji based on username
function getAvatarEmoji(username) {
    const emojis = ['👤', '👨', '👩', '🧑', '👨‍💻', '👩‍💻', '🧙', '🦸', '🎮', '🏆', '⚡', '🔥', '✨', '🌟', '💎'];
    const index = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % emojis.length;
    return emojis[index];
}

// Refresh leaderboard
function refreshLeaderboard() {
    const refreshBtn = document.getElementById('refresh-btn');
    refreshBtn.style.animation = 'none';
    setTimeout(() => {
        refreshBtn.style.animation = '';
    }, 10);
    
    loadLeaderboard();
    updateStats();
    showNotification('🔄 جدول بروزرسانی شد', 'success');
}

// Start auto-refresh
function startAutoRefresh() {
    setInterval(() => {
        loadLeaderboard();
        updateStats();
    }, REFRESH_INTERVAL);
}

// Format number with monospace styling
function formatNumber(num) {
    return num.toLocaleString('fa-IR');
}

// Format time (milliseconds to readable format)
function formatTime(ms) {
    if (!ms || ms === 0) return '۰ ثانیه';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
        const remainingMinutes = minutes % 60;
        return `${formatNumber(hours)}:${String(remainingMinutes).padStart(2, '0')} ساعت`;
    } else if (minutes > 0) {
        const remainingSeconds = seconds % 60;
        return `${formatNumber(minutes)}:${String(remainingSeconds).padStart(2, '0')} دقیقه`;
    } else {
        return `${formatNumber(seconds)} ثانیه`;
    }
}

// Format date
function formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) {
        return 'الان';
    } else if (diffMins < 60) {
        return `${formatNumber(diffMins)} دقیقه پیش`;
    } else if (diffHours < 24) {
        return `${formatNumber(diffHours)} ساعت پیش`;
    } else if (diffDays < 7) {
        return `${formatNumber(diffDays)} روز پیش`;
    } else {
        return new Intl.DateTimeFormat('fa-IR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(date);
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 2rem;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? 'var(--success-color)' : type === 'error' ? 'var(--error-color)' : 'var(--info-color)'};
        color: white;
        padding: 1rem 2rem;
        border-radius: 0.75rem;
        font-size: 1.1rem;
        font-weight: 600;
        z-index: 10000;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        animation: slideDown 0.5s ease;
        max-width: 90%;
        text-align: center;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideUp 0.5s ease';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from { transform: translate(-50%, -100%); opacity: 0; }
        to { transform: translate(-50%, 0); opacity: 1; }
    }
    @keyframes slideUp {
        from { transform: translate(-50%, 0); opacity: 1; }
        to { transform: translate(-50%, -100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
