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
import logger from '#services/logger'
import clientInfoCollector from '#services/client_info_collector'
import connectedClientsManager from '#services/connected_clients_manager'
import notificationService from '#services/notification_service'

let io: Server | null = null

app.ready(() => {
  const server = app.server

  if (!server) {
    logger.critical('HTTP server not available')
    return
  }

  const httpServer = server.getNodeServer()

  if (!httpServer) {
    logger.critical('Node HTTP server not available')
    return
  }

  // Use the same CORS configuration as the rest of the application
  const corsOrigin = env.get('CORS_ORIGIN')
  
  // Safely parse CORS origin with the same logic as config/cors.ts
  const getSocketOrigin = () => {
    if (!corsOrigin || corsOrigin === '*') {
      return '*' // Allow all origins
    }
    
    try {
      const origins = corsOrigin.split(',').map(o => o.trim()).filter(o => o.length > 0)
      return origins.length > 0 ? origins : ['http://localhost:3000']
    } catch {
      return ['http://localhost:3000'] // Fallback to localhost
    }
  }
  
  const allowedOrigins = getSocketOrigin()

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
    
    // Collect comprehensive client information
    const clientInfo = clientInfoCollector.collectFromSocket(socket)
    
    // Add to connected clients manager
    connectedClientsManager.add({
      ...clientInfo,
      userId,
      sessionToken: socket.data.session?.sessionToken || null,
      lastActivity: new Date(),
    })
    
    // Log with emoji and detailed info
    logger.socket.connect(socket.id, userId || undefined)
    logger.info(clientInfoCollector.formatForDisplay(clientInfo), { context: 'Socket' })
    
    // Send OS notification for new connection
    notificationService.notifyClientConnected(
      socket.id,
      userId || undefined,
      `${clientInfo.deviceType} - ${clientInfo.browser} on ${clientInfo.os}`
    )

    // Handle player join
    socket.on('player:join', (data) => {
      if (!data || typeof data !== 'object') {
        socket.emit('error', { message: 'Invalid player:join data' })
        return
      }
      
      connectedClientsManager.updateActivity(socket.id)
      logger.socket.event('player:join', socket.id, data)
      
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
      
      connectedClientsManager.updateActivity(socket.id)
      logger.socket.event('game:start', socket.id, data)
      
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
      
      connectedClientsManager.updateActivity(socket.id)
      logger.socket.event('game:move', socket.id, data)
      
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
      
      connectedClientsManager.updateActivity(socket.id)
      logger.socket.event('game:complete', socket.id, data)
      
      // Send notification for game completion
      notificationService.notifyGameCompleted(
        data.gameId || 0,
        userId || undefined,
        data.score
      )
      
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
      
      connectedClientsManager.updateActivity(socket.id)
      logger.socket.event('puzzle:discovered', socket.id, data)
      
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
      
      connectedClientsManager.updateActivity(socket.id)
      logger.socket.event('chat:message', socket.id, { messageLength: data.message.length })
      
      io!.emit('chat:message', {
        playerId: socket.id,
        userId: userId,
        message: data.message,
        timestamp: new Date().toISOString(),
      })
    })

    // Handle disconnection
    socket.on('disconnect', () => {
      connectedClientsManager.remove(socket.id)
      logger.socket.disconnect(socket.id, userId || undefined)
      io!.emit('player:left', { playerId: socket.id, userId: userId })
    })

    // Error handling
    socket.on('error', (error) => {
      logger.socket.error(`Socket error for ${socket.id}`, socket.id, error)
    })
  })

  logger.success('Socket.io server ready with authentication', { context: 'Socket' })
  
  // Start cleanup interval for stale connections
  setInterval(() => {
    connectedClientsManager.cleanupStale(30)
  }, 5 * 60 * 1000) // Every 5 minutes
})

export { io }
