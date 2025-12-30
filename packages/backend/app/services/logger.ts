/**
 * Enhanced logging utility with emoji support
 * Provides consistent, visually appealing logs throughout the application
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export interface LogOptions {
  context?: string
  metadata?: Record<string, any>
  timestamp?: boolean
}

class Logger {
  private getEmoji(level: LogLevel): string {
    const emojiMap: Record<LogLevel, string> = {
      [LogLevel.DEBUG]: '🔍',
      [LogLevel.INFO]: 'ℹ️',
      [LogLevel.SUCCESS]: '✅',
      [LogLevel.WARNING]: '⚠️',
      [LogLevel.ERROR]: '❌',
      [LogLevel.CRITICAL]: '🚨',
    }
    return emojiMap[level]
  }

  private formatMessage(level: LogLevel, message: string, options?: LogOptions): string {
    const emoji = this.getEmoji(level)
    const timestamp = options?.timestamp !== false ? new Date().toISOString() : ''
    const context = options?.context ? `[${options.context}]` : ''
    
    let formatted = `${emoji} ${level.toUpperCase()}`
    if (timestamp) formatted += ` [${timestamp}]`
    if (context) formatted += ` ${context}`
    formatted += ` ${message}`
    
    return formatted
  }

  debug(message: string, options?: LogOptions): void {
    const formatted = this.formatMessage(LogLevel.DEBUG, message, options)
    console.log(formatted)
    if (options?.metadata) {
      console.log('  └─ Metadata:', options.metadata)
    }
  }

  info(message: string, options?: LogOptions): void {
    const formatted = this.formatMessage(LogLevel.INFO, message, options)
    console.log(formatted)
    if (options?.metadata) {
      console.log('  └─ Metadata:', options.metadata)
    }
  }

  success(message: string, options?: LogOptions): void {
    const formatted = this.formatMessage(LogLevel.SUCCESS, message, options)
    console.log(formatted)
    if (options?.metadata) {
      console.log('  └─ Metadata:', options.metadata)
    }
  }

  warning(message: string, options?: LogOptions): void {
    const formatted = this.formatMessage(LogLevel.WARNING, message, options)
    console.warn(formatted)
    if (options?.metadata) {
      console.warn('  └─ Metadata:', options.metadata)
    }
  }

  error(message: string, options?: LogOptions): void {
    const formatted = this.formatMessage(LogLevel.ERROR, message, options)
    console.error(formatted)
    if (options?.metadata) {
      console.error('  └─ Metadata:', options.metadata)
    }
  }

  critical(message: string, options?: LogOptions): void {
    const formatted = this.formatMessage(LogLevel.CRITICAL, message, options)
    console.error(formatted)
    if (options?.metadata) {
      console.error('  └─ Metadata:', options.metadata)
    }
  }

  // Socket-specific logging helpers
  socket = {
    connect: (socketId: string, userId?: number) => {
      this.success(`Client connected: ${socketId}`, {
        context: 'Socket',
        metadata: { socketId, userId },
      })
    },
    disconnect: (socketId: string, userId?: number) => {
      this.info(`Client disconnected: ${socketId}`, {
        context: 'Socket',
        metadata: { socketId, userId },
      })
    },
    event: (event: string, socketId: string, data?: any) => {
      this.debug(`Event '${event}' from ${socketId}`, {
        context: 'Socket',
        metadata: { event, socketId, data },
      })
    },
    error: (message: string, socketId?: string, error?: any) => {
      this.error(message, {
        context: 'Socket',
        metadata: { socketId, error },
      })
    },
  }

  // HTTP-specific logging helpers
  http = {
    request: (method: string, path: string, ip?: string) => {
      this.info(`${method} ${path}`, {
        context: 'HTTP',
        metadata: { method, path, ip },
      })
    },
    response: (method: string, path: string, status: number) => {
      const level = status >= 400 ? LogLevel.WARNING : LogLevel.SUCCESS
      const message = `${method} ${path} → ${status}`
      
      if (level === LogLevel.WARNING) {
        this.warning(message, { context: 'HTTP' })
      } else {
        this.success(message, { context: 'HTTP' })
      }
    },
    error: (method: string, path: string, error: any) => {
      this.error(`${method} ${path}`, {
        context: 'HTTP',
        metadata: { error: error.message || error },
      })
    },
  }

  // QR-specific logging helpers
  qr = {
    accessed: (gameNumber: number, token: string, success: boolean) => {
      const level = success ? LogLevel.SUCCESS : LogLevel.WARNING
      const message = `QR Code access for game ${gameNumber}: ${success ? 'GRANTED' : 'DENIED'}`
      
      if (success) {
        this.success(message, {
          context: 'QR',
          metadata: { gameNumber, token },
        })
      } else {
        this.warning(message, {
          context: 'QR',
          metadata: { gameNumber, token },
        })
      }
    },
    generated: (count: number) => {
      this.success(`Generated ${count} QR code(s)`, { context: 'QR' })
    },
  }

  // Database-specific logging helpers
  db = {
    query: (operation: string, table: string) => {
      this.debug(`DB ${operation} on ${table}`, { context: 'Database' })
    },
    error: (operation: string, table: string, error: any) => {
      this.error(`DB ${operation} failed on ${table}`, {
        context: 'Database',
        metadata: { error: error.message || error },
      })
    },
  }

  // Auth-specific logging helpers
  auth = {
    login: (userId: number, method: string) => {
      this.success(`User ${userId} logged in via ${method}`, { context: 'Auth' })
    },
    logout: (userId: number) => {
      this.info(`User ${userId} logged out`, { context: 'Auth' })
    },
    failed: (identifier: string, reason: string) => {
      this.warning(`Login failed for ${identifier}: ${reason}`, { context: 'Auth' })
    },
  }
}

// Export singleton instance
export const logger = new Logger()
export default logger
