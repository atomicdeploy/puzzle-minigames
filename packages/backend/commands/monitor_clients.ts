#!/usr/bin/env node
/**
 * TUI (Terminal User Interface) for monitoring connected clients
 * Run with: node commands/monitor_clients.ts
 */

import blessed from 'blessed'
import { io } from 'socket.io-client'

// Configuration
const API_URL = process.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
const SOCKET_URL = process.env.VITE_SOCKET_URL || 'http://localhost:3001'
const REFRESH_INTERVAL = 5000 // 5 seconds

// Create screen
const screen = blessed.screen({
  smartCSR: true,
  title: '🎮 Connected Clients Monitor',
})

// Header box
const header = blessed.box({
  top: 0,
  left: 0,
  width: '100%',
  height: 3,
  content: '{center}🎮 {bold}Connected Clients Monitor{/bold} - Press {bold}q{/bold} to quit, {bold}r{/bold} to refresh{/center}',
  tags: true,
  border: {
    type: 'line',
  },
  style: {
    fg: 'white',
    bg: 'blue',
    border: {
      fg: 'blue',
    },
  },
})

// Stats box
const statsBox = blessed.box({
  top: 3,
  left: 0,
  width: '100%',
  height: 5,
  content: 'Loading statistics...',
  tags: true,
  border: {
    type: 'line',
  },
  style: {
    fg: 'white',
    border: {
      fg: 'cyan',
    },
  },
  label: ' 📊 Statistics ',
})

// Clients list
const clientsList = blessed.list({
  top: 8,
  left: 0,
  width: '100%',
  height: '100%-8',
  keys: true,
  mouse: true,
  scrollable: true,
  alwaysScroll: true,
  scrollbar: {
    ch: '█',
    style: {
      fg: 'cyan',
    },
  },
  border: {
    type: 'line',
  },
  style: {
    fg: 'white',
    border: {
      fg: 'cyan',
    },
    selected: {
      bg: 'blue',
      fg: 'white',
      bold: true,
    },
  },
  label: ' 👥 Connected Clients ',
})

screen.append(header)
screen.append(statsBox)
screen.append(clientsList)

// Status message
let statusMsg = blessed.message({
  parent: screen,
  top: 'center',
  left: 'center',
  width: '50%',
  height: '30%',
  border: 'line',
  hidden: true,
})

// Quit on q or Ctrl-C
screen.key(['q', 'C-c'], () => {
  return process.exit(0)
})

// Refresh on r
screen.key(['r'], () => {
  fetchClients()
})

// Focus clients list for scrolling
clientsList.focus()

// Fetch clients data
async function fetchClients() {
  try {
    const response = await fetch(`${API_URL}/connected-clients`)
    const data = await response.json()

    if (data.success) {
      updateStats(data.stats)
      updateClientsList(data.clients)
    } else {
      showError('Failed to fetch clients data')
    }
  } catch (error) {
    showError(`Error: ${error.message}`)
  }
}

// Update statistics box
function updateStats(stats: any) {
  const content = [
    `{cyan-fg}Total Clients:{/cyan-fg} {bold}${stats.total}{/bold}`,
    `{green-fg}Authenticated:{/green-fg} ${stats.authenticated}`,
    `{yellow-fg}Anonymous:{/yellow-fg} ${stats.anonymous}`,
    '',
    `{cyan-fg}By Device:{/cyan-fg}`,
    `  📱 Mobile: ${stats.byDeviceType.mobile}`,
    `  📱 Tablet: ${stats.byDeviceType.tablet}`,
    `  💻 Desktop: ${stats.byDeviceType.desktop}`,
    `  ❓ Unknown: ${stats.byDeviceType.unknown}`,
  ].join('\n')

  statsBox.setContent(content)
  screen.render()
}

// Update clients list
function updateClientsList(clients: any[]) {
  const items = clients.map((client) => {
    const deviceIcon = {
      mobile: '📱',
      tablet: '📱',
      desktop: '💻',
      unknown: '❓',
    }[client.deviceType] || '❓'

    const userIcon = client.userId ? '👤' : '👻'
    const userId = client.userId ? `User ${client.userId}` : 'Anonymous'

    const parts = [
      `${deviceIcon} ${userIcon} ${userId}`,
      `| 🔌 ${client.socketId.substring(0, 8)}...`,
      `| 🔍 ${client.browser}`,
      `| ⚙️ ${client.os}`,
      `| 🌐 ${client.ipAddress}`,
      `| ⏱️ ${formatTimeAgo(new Date(client.lastActivity))}`,
    ]

    return parts.join(' ')
  })

  clientsList.setItems(items)
  screen.render()
}

// Format time ago
function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

// Show error message
function showError(message: string) {
  statusMsg.display(message, 3)
}

// Connect to Socket.io for real-time updates
function connectSocket() {
  const socket = io(SOCKET_URL, {
    transports: ['websocket'],
    reconnection: true,
  })

  socket.on('connect', () => {
    header.setContent(
      '{center}🎮 {bold}Connected Clients Monitor{/bold} {green-fg}[LIVE]{/green-fg} - Press {bold}q{/bold} to quit, {bold}r{/bold} to refresh{/center}'
    )
    screen.render()
  })

  socket.on('disconnect', () => {
    header.setContent(
      '{center}🎮 {bold}Connected Clients Monitor{/bold} {red-fg}[DISCONNECTED]{/red-fg} - Press {bold}q{/bold} to quit, {bold}r{/bold} to refresh{/center}'
    )
    screen.render()
  })

  // Listen for client connection events
  socket.on('player:joined', () => {
    fetchClients()
  })

  socket.on('player:left', () => {
    fetchClients()
  })
}

// Initial fetch
fetchClients()

// Auto-refresh
setInterval(() => {
  fetchClients()
}, REFRESH_INTERVAL)

// Try to connect to socket for real-time updates
try {
  connectSocket()
} catch (error) {
  // Socket connection is optional
  console.error('Could not connect to socket:', error)
}

// Render screen
screen.render()
