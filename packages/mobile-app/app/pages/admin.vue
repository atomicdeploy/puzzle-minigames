<template>
  <div class="admin-panel" :class="{ 'dark-mode': darkMode, 'rtl-mode': rtlMode }">
    <!-- Top Navigation Bar -->
    <header class="admin-header">
      <div class="header-content">
        <div class="logo-section">
          <h1>⚡ پنل مدیریت اینفرنال</h1>
        </div>
        <div class="header-actions">
          <button @click="toggleDarkMode" class="btn-icon" :title="darkMode ? 'حالت روز' : 'حالت شب'">
            {{ darkMode ? '☀️' : '🌙' }}
          </button>
          <button @click="toggleRTL" class="btn-icon" :title="rtlMode ? 'LTR' : 'RTL'">
            {{ rtlMode ? '→' : '←' }}
          </button>
          <button @click="refreshData" class="btn-icon" title="بروزرسانی">
            🔄
          </button>
          <div class="user-menu">
            <span class="user-name">مدیر سیستم</span>
            <button @click="logout" class="btn-logout">خروج</button>
          </div>
        </div>
      </div>
    </header>

    <!-- Sidebar Navigation -->
    <aside class="admin-sidebar">
      <nav class="sidebar-nav">
        <a
          v-for="item in menuItems"
          :key="item.id"
          @click.prevent="currentView = item.id"
          :class="{ active: currentView === item.id }"
          class="nav-item"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ item.label }}</span>
        </a>
      </nav>
    </aside>

    <!-- Main Content Area -->
    <main class="admin-main">
      <!-- Dashboard View -->
      <div v-if="currentView === 'dashboard'" class="view-content">
        <h2 class="view-title">📊 داشبورد</h2>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.connectedClients }}</div>
              <div class="stat-label">کلاینت‌های متصل</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">🎮</div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.activeGames }}</div>
              <div class="stat-label">بازی‌های فعال</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">🔑</div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.qrTokens }}</div>
              <div class="stat-label">توکن‌های QR</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">📱</div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.totalUsers }}</div>
              <div class="stat-label">کاربران ثبت‌نام</div>
            </div>
          </div>
        </div>

        <div class="charts-section">
          <div class="chart-card">
            <h3>📈 فعالیت کلاینت‌ها</h3>
            <div class="device-breakdown">
              <div class="device-item" v-for="(count, type) in clientsByDevice" :key="type">
                <span class="device-label">{{ getDeviceLabel(type) }}:</span>
                <span class="device-count">{{ count }}</span>
                <div class="device-bar" :style="{ width: `${(count / stats.connectedClients) * 100}%` }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Connected Clients View -->
      <div v-else-if="currentView === 'clients'" class="view-content">
        <h2 class="view-title">👥 کلاینت‌های متصل</h2>
        
        <div class="table-actions">
          <button @click="refreshClients" class="btn-primary">🔄 بروزرسانی</button>
          <input
            v-model="clientSearch"
            type="text"
            placeholder="جستجو..."
            class="search-input"
          />
        </div>

        <div class="data-table">
          <table>
            <thead>
              <tr>
                <th>شناسه Socket</th>
                <th>کاربر</th>
                <th>دستگاه</th>
                <th>مرورگر</th>
                <th>سیستم‌عامل</th>
                <th>IP</th>
                <th>آخرین فعالیت</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="client in filteredClients" :key="client.socketId">
                <td><code>{{ client.socketId.substring(0, 12) }}...</code></td>
                <td>
                  <span v-if="client.userId">👤 کاربر {{ client.userId }}</span>
                  <span v-else class="text-muted">👻 ناشناس</span>
                </td>
                <td>{{ getDeviceIcon(client.deviceType) }} {{ client.deviceType }}</td>
                <td>{{ client.browser }}</td>
                <td>{{ client.os }}</td>
                <td>{{ client.ipAddress }}</td>
                <td>{{ formatTimeAgo(client.lastActivity) }}</td>
              </tr>
            </tbody>
          </table>
          
          <div v-if="filteredClients.length === 0" class="empty-state">
            <p>هیچ کلاینتی متصل نیست</p>
          </div>
        </div>
      </div>

      <!-- QR Management View -->
      <div v-else-if="currentView === 'qr'" class="view-content">
        <h2 class="view-title">🔑 مدیریت QR</h2>
        
        <div class="table-actions">
          <button @click="showGenerateQR = true" class="btn-primary">➕ تولید QR جدید</button>
          <button @click="refreshQRTokens" class="btn-secondary">🔄 بروزرسانی</button>
        </div>

        <div class="data-table">
          <table>
            <thead>
              <tr>
                <th>شماره بازی</th>
                <th>توکن</th>
                <th>وضعیت</th>
                <th>استفاده شده</th>
                <th>تعداد دسترسی</th>
                <th>تاریخ ایجاد</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="token in qrTokens" :key="token.id">
                <td><strong>بازی {{ token.gameNumber }}</strong></td>
                <td><code>{{ token.token.substring(0, 16) }}...</code></td>
                <td>
                  <span :class="['badge', token.isActive ? 'badge-success' : 'badge-danger']">
                    {{ token.isActive ? 'فعال' : 'غیرفعال' }}
                  </span>
                </td>
                <td>
                  <span :class="['badge', token.isUsed ? 'badge-warning' : 'badge-info']">
                    {{ token.isUsed ? 'بله' : 'خیر' }}
                  </span>
                </td>
                <td>{{ token.accessCount }}</td>
                <td>{{ formatDate(token.createdAt) }}</td>
                <td>
                  <button @click="toggleTokenStatus(token)" class="btn-sm">
                    {{ token.isActive ? '❌ غیرفعال' : '✅ فعال' }}
                  </button>
                  <button @click="viewTokenLogs(token)" class="btn-sm">📋 لاگ‌ها</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Users View -->
      <div v-else-if="currentView === 'users'" class="view-content">
        <h2 class="view-title">👤 مدیریت کاربران</h2>
        <p class="coming-soon">🚧 این بخش در حال توسعه است...</p>
      </div>

      <!-- Sessions View -->
      <div v-else-if="currentView === 'sessions'" class="view-content">
        <h2 class="view-title">📊 تحلیل جلسات</h2>
        <p class="coming-soon">🚧 این بخش در حال توسعه است...</p>
      </div>

      <!-- Logs View -->
      <div v-else-if="currentView === 'logs'" class="view-content">
        <h2 class="view-title">📜 لاگ‌های سیستم</h2>
        
        <div class="logs-container">
          <div v-for="log in systemLogs" :key="log.id" :class="['log-entry', `log-${log.level}`]">
            <span class="log-time">{{ formatTime(log.timestamp) }}</span>
            <span class="log-level">{{ log.level }}</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
        </div>
      </div>

      <!-- Settings View -->
      <div v-else-if="currentView === 'settings'" class="view-content">
        <h2 class="view-title">⚙️ تنظیمات</h2>
        
        <div class="settings-section">
          <h3>تنظیمات نمایش</h3>
          <div class="setting-item">
            <label>
              <input type="checkbox" v-model="darkMode" />
              حالت تاریک
            </label>
          </div>
          <div class="setting-item">
            <label>
              <input type="checkbox" v-model="rtlMode" />
              حالت راست‌چین (RTL)
            </label>
          </div>
        </div>

        <div class="settings-section">
          <h3>اعلان‌ها</h3>
          <div class="setting-item">
            <label>
              <input type="checkbox" v-model="notificationsEnabled" />
              فعال‌سازی اعلان‌های سیستم
            </label>
          </div>
        </div>
      </div>
    </main>

    <!-- Generate QR Modal -->
    <div v-if="showGenerateQR" class="modal-overlay" @click="showGenerateQR = false">
      <div class="modal-content" @click.stop>
        <h3>تولید QR جدید</h3>
        <form @submit.prevent="generateQR">
          <div class="form-group">
            <label>تعداد QR:</label>
            <input v-model.number="qrForm.count" type="number" min="1" max="20" />
          </div>
          <div class="form-group">
            <label>یادداشت:</label>
            <textarea v-model="qrForm.notes" rows="3"></textarea>
          </div>
          <div class="modal-actions">
            <button type="submit" class="btn-primary">تولید</button>
            <button type="button" @click="showGenerateQR = false" class="btn-secondary">انصراف</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { io } from 'socket.io-client'

// Set page metadata
useHead({
  title: 'پنل مدیریت',
  meta: [
    { name: 'description', content: 'پنل مدیریت اینفرنال' }
  ]
})

// Configuration
const config = useRuntimeConfig()
const apiBaseUrl = config.public.apiBaseUrl || 'http://localhost:3001/api'
const socketUrl = config.public.socketUrl || 'http://localhost:3001'

// State
const darkMode = ref(true)
const rtlMode = ref(true)
const currentView = ref('dashboard')
const clientSearch = ref('')
const showGenerateQR = ref(false)
const notificationsEnabled = ref(true)

// Data
const stats = ref({
  connectedClients: 0,
  activeGames: 0,
  qrTokens: 0,
  totalUsers: 0,
})

const clientsByDevice = ref({
  mobile: 0,
  tablet: 0,
  desktop: 0,
  unknown: 0,
})

const clients = ref([])
const qrTokens = ref([])
const systemLogs = ref([])

const qrForm = ref({
  count: 9,
  notes: '',
})

// Menu items
const menuItems = [
  { id: 'dashboard', icon: '📊', label: 'داشبورد' },
  { id: 'clients', icon: '👥', label: 'کلاینت‌های متصل' },
  { id: 'qr', icon: '🔑', label: 'مدیریت QR' },
  { id: 'users', icon: '👤', label: 'کاربران' },
  { id: 'sessions', icon: '📊', label: 'تحلیل جلسات' },
  { id: 'logs', icon: '📜', label: 'لاگ‌ها' },
  { id: 'settings', icon: '⚙️', label: 'تنظیمات' },
]

// Computed
const filteredClients = computed(() => {
  if (!clientSearch.value) return clients.value
  
  const search = clientSearch.value.toLowerCase()
  return clients.value.filter(client => 
    client.socketId.toLowerCase().includes(search) ||
    client.browser.toLowerCase().includes(search) ||
    client.os.toLowerCase().includes(search) ||
    client.ipAddress.includes(search)
  )
})

// Socket connection
let socket = null

// Methods
function toggleDarkMode() {
  darkMode.value = !darkMode.value
  if (process.client) {
    localStorage.setItem('adminDarkMode', darkMode.value)
  }
}

function toggleRTL() {
  rtlMode.value = !rtlMode.value
  if (process.client) {
    localStorage.setItem('adminRTLMode', rtlMode.value)
  }
}

async function refreshData() {
  await Promise.all([
    fetchStats(),
    fetchClients(),
    fetchQRTokens(),
  ])
}

async function fetchStats() {
  try {
    const response = await fetch(`${apiBaseUrl}/connected-clients/stats`)
    const data = await response.json()
    
    if (data.success) {
      stats.value.connectedClients = data.stats.total
      clientsByDevice.value = data.stats.byDeviceType
    }
  } catch (error) {
    console.error('Error fetching stats:', error)
  }
}

async function fetchClients() {
  try {
    const response = await fetch(`${apiBaseUrl}/connected-clients`)
    const data = await response.json()
    
    if (data.success) {
      clients.value = data.clients
    }
  } catch (error) {
    console.error('Error fetching clients:', error)
  }
}

async function refreshClients() {
  await fetchClients()
}

async function fetchQRTokens() {
  try {
    const sessionToken = process.client ? localStorage.getItem('sessionToken') : null
    const headers = {
      'Content-Type': 'application/json',
    }
    
    if (sessionToken) {
      headers['x-session-token'] = sessionToken
    }
    
    const response = await fetch(`${apiBaseUrl}/qr`, { headers })
    const data = await response.json()
    
    if (data.success) {
      qrTokens.value = data.data
      stats.value.qrTokens = data.meta?.total || qrTokens.value.length
    }
  } catch (error) {
    console.error('Error fetching QR tokens:', error)
  }
}

async function refreshQRTokens() {
  await fetchQRTokens()
}

async function generateQR() {
  try {
    const sessionToken = process.client ? localStorage.getItem('sessionToken') : null
    const headers = {
      'Content-Type': 'application/json',
    }
    
    if (sessionToken) {
      headers['x-session-token'] = sessionToken
    }
    
    const response = await fetch(`${apiBaseUrl}/qr/generate`, {
      method: 'POST',
      headers,
      body: JSON.stringify(qrForm.value),
    })
    
    const data = await response.json()
    
    if (data.success) {
      showGenerateQR.value = false
      await refreshQRTokens()
      alert(`${data.count} QR Code تولید شد!`)
    }
  } catch (error) {
    console.error('Error generating QR:', error)
    alert('خطا در تولید QR Code')
  }
}

async function toggleTokenStatus(token) {
  try {
    const sessionToken = process.client ? localStorage.getItem('sessionToken') : null
    const headers = {
      'Content-Type': 'application/json',
    }
    
    if (sessionToken) {
      headers['x-session-token'] = sessionToken
    }
    
    const response = await fetch(`${apiBaseUrl}/qr/${token.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        isActive: !token.isActive,
      }),
    })
    
    if (response.ok) {
      await refreshQRTokens()
    }
  } catch (error) {
    console.error('Error toggling token:', error)
  }
}

function viewTokenLogs(token) {
  // TODO: Implement log viewer
  alert(`نمایش لاگ‌های توکن ${token.id}`)
}

function logout() {
  if (process.client) {
    localStorage.removeItem('sessionToken')
    window.location.href = '/'
  }
}

function getDeviceLabel(type) {
  const labels = {
    mobile: '📱 موبایل',
    tablet: '📱 تبلت',
    desktop: '💻 دسکتاپ',
    unknown: '❓ نامشخص',
  }
  return labels[type] || type
}

function getDeviceIcon(type) {
  const icons = {
    mobile: '📱',
    tablet: '📱',
    desktop: '💻',
    unknown: '❓',
  }
  return icons[type] || '❓'
}

function formatTimeAgo(date) {
  if (!date) return ''
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  
  if (seconds < 60) return `${seconds} ثانیه پیش`
  if (seconds < 3600) return `${Math.floor(seconds / 60)} دقیقه پیش`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} ساعت پیش`
  return `${Math.floor(seconds / 86400)} روز پیش`
}

function formatDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleString('fa-IR')
}

function formatTime(timestamp) {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleTimeString('fa-IR')
}

function connectSocket() {
  socket = io(socketUrl, {
    transports: ['websocket'],
    reconnection: true,
  })

  socket.on('connect', () => {
    console.log('Socket connected')
  })

  socket.on('player:joined', () => {
    fetchClients()
  })

  socket.on('player:left', () => {
    fetchClients()
  })

  socket.on('qr:accessed', (data) => {
    systemLogs.value.unshift({
      id: Date.now(),
      level: data.accessStatus === 'granted' ? 'success' : 'warning',
      message: `QR دسترسی - بازی ${data.gameNumber}: ${data.accessStatus}`,
      timestamp: new Date(),
    })
    
    // Keep only last 100 logs
    if (systemLogs.value.length > 100) {
      systemLogs.value = systemLogs.value.slice(0, 100)
    }
  })
}

// Lifecycle
onMounted(() => {
  if (process.client) {
    // Load preferences
    const savedDarkMode = localStorage.getItem('adminDarkMode')
    if (savedDarkMode !== null) {
      darkMode.value = savedDarkMode === 'true'
    }
    
    const savedRTLMode = localStorage.getItem('adminRTLMode')
    if (savedRTLMode !== null) {
      rtlMode.value = savedRTLMode === 'true'
    }
  }
  
  // Initial data fetch
  refreshData()
  
  // Connect to socket
  connectSocket()
  
  // Auto-refresh every 10 seconds
  const refreshInterval = setInterval(() => {
    fetchClients()
    fetchStats()
  }, 10000)
  
  onUnmounted(() => {
    clearInterval(refreshInterval)
    if (socket) {
      socket.disconnect()
    }
  })
})
</script>

<style lang="scss" scoped>
@import '@/assets/scss/admin-panel.scss';
</style>
