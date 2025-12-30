/*
|--------------------------------------------------------------------------
| Socket.io setup
|--------------------------------------------------------------------------
*/

import app from '@adonisjs/core/services/app'
import env from '#start/env'
import { Server } from 'socket.io'
import UserSession from '#models/user_session'
import { DateTime } from 'luxon'

let io: Server | null = null

app.ready(() => {
  const server = app.server

  if (!server) {
    console.error('HTTP server not available')
    return
  }

  const httpServer = server.getNodeServer()

  if (!httpServer) {
    console.error('Node HTTP server not available')
    return
  }

  // Use the same CORS configuration as the rest of the application
  const corsOrigin = env.get('CORS_ORIGIN')
  const allowedOrigins = corsOrigin === '*' ? '*' : corsOrigin.split(',').map(o => o.trim())

  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  })

  // Authentication middleware for Socket.io
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers['x-session-token']

    if (!token) {
      return next(new Error('Authentication token required'))
    }

    // Verify session token
    const session = await UserSession.query()
      .where('session_token', token)
      .where('is_active', true)
      .where('expires_at', '>', DateTime.now().toSQL())
      .first()

    if (!session) {
      return next(new Error('Invalid or expired session'))
    }

    // Attach session and user to socket
    socket.data.session = session
    socket.data.userId = session.userId

    next()
  })

  io.on('connection', (socket) => {
    const userId = socket.data.userId
    console.log(`✅ Client connected: ${socket.id}, User ID: ${userId || 'anonymous'}`)

    // Handle player join
    socket.on('player:join', (data) => {
      if (!data || typeof data !== 'object') {
        socket.emit('error', { message: 'Invalid player:join data' })
        return
      }
      console.log(`Player joined:`, data)
      socket.emit('player:joined', {
        playerId: socket.id,
        userId: userId,
        timestamp: new Date().toISOString(),
      })
    })

    // Handle game events
    socket.on('game:start', (data) => {
      if (!data || typeof data !== 'object') {
        socket.emit('error', { message: 'Invalid game:start data' })
        return
      }
      console.log(`Game started by ${socket.id}:`, data)
      io!.emit('game:started', {
        gameId: data.gameId,
        playerId: socket.id,
        userId: userId,
      })
    })

    socket.on('game:move', (data) => {
      if (!data || typeof data !== 'object') {
        socket.emit('error', { message: 'Invalid game:move data' })
        return
      }
      console.log(`Game move from ${socket.id}:`, data)
      socket.broadcast.emit('game:move', {
        playerId: socket.id,
        userId: userId,
        move: data,
      })
    })

    socket.on('game:complete', (data) => {
      if (!data || typeof data !== 'object' || typeof data.score !== 'number') {
        socket.emit('error', { message: 'Invalid game:complete data' })
        return
      }
      console.log(`Game completed by ${socket.id}:`, data)
      io!.emit('game:completed', {
        playerId: socket.id,
        userId: userId,
        score: data.score,
      })
    })

    // Handle puzzle discovery
    socket.on('puzzle:discovered', (data) => {
      if (!data || typeof data !== 'object' || typeof data.puzzleNumber !== 'number') {
        socket.emit('error', { message: 'Invalid puzzle:discovered data' })
        return
      }
      console.log(`Puzzle discovered by ${socket.id}:`, data)
      socket.emit('puzzle:saved', {
        puzzleNumber: data.puzzleNumber,
        success: true,
      })
    })

    // Handle chat messages
    socket.on('chat:message', (data) => {
      if (!data || typeof data !== 'object' || typeof data.message !== 'string') {
        socket.emit('error', { message: 'Invalid chat:message data' })
        return
      }
      console.log(`Chat message from ${socket.id}:`, data)
      io!.emit('chat:message', {
        playerId: socket.id,
        userId: userId,
        message: data.message,
        timestamp: new Date().toISOString(),
      })
    })

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`)
      io!.emit('player:left', { playerId: socket.id, userId: userId })
    })

    // Error handling
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error)
    })
  })

  console.log('📡 Socket.io server ready with authentication')
})

export { io }
