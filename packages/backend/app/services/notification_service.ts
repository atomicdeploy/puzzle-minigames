/**
 * OS Notification service
 * Send desktop notifications for important events
 */

import notifier from 'node-notifier'
import path from 'node:path'
import logger from './logger.js'

export interface NotificationOptions {
  title: string
  message: string
  sound?: boolean
  wait?: boolean
  icon?: string
}

class NotificationService {
  private enabled: boolean = true
  private defaultIcon: string

  constructor() {
    // Set default icon path (you can customize this)
    this.defaultIcon = path.join(process.cwd(), 'public', 'icon.png')
  }

  /**
   * Enable notifications
   */
  enable(): void {
    this.enabled = true
    logger.success('OS notifications enabled', { context: 'Notifications' })
  }

  /**
   * Disable notifications
   */
  disable(): void {
    this.enabled = false
    logger.info('OS notifications disabled', { context: 'Notifications' })
  }

  /**
   * Send a notification
   */
  async send(options: NotificationOptions): Promise<void> {
    if (!this.enabled) {
      return
    }

    try {
      notifier.notify({
        title: options.title,
        message: options.message,
        sound: options.sound ?? true,
        wait: options.wait ?? false,
        icon: options.icon || this.defaultIcon,
        timeout: 10, // Auto close after 10 seconds
      })

      logger.info(`Notification sent: ${options.title}`, {
        context: 'Notifications',
        metadata: { message: options.message },
      })
    } catch (error) {
      logger.error('Failed to send notification', {
        context: 'Notifications',
        metadata: { error, options },
      })
    }
  }

  /**
   * Send notification for new client connection
   */
  async notifyClientConnected(socketId: string, userId?: number, deviceInfo?: string): Promise<void> {
    await this.send({
      title: '🎮 New Client Connected',
      message: `Socket: ${socketId.substring(0, 8)}...\n${userId ? `User ID: ${userId}` : 'Anonymous'}\n${deviceInfo || ''}`,
      sound: true,
    })
  }

  /**
   * Send notification for QR code access
   */
  async notifyQrAccessed(gameNumber: number, status: 'granted' | 'denied', userId?: number): Promise<void> {
    const statusEmoji = status === 'granted' ? '✅' : '❌'
    await this.send({
      title: `${statusEmoji} QR Access ${status === 'granted' ? 'Granted' : 'Denied'}`,
      message: `Game ${gameNumber}\n${userId ? `User ID: ${userId}` : 'Anonymous user'}`,
      sound: status === 'granted',
    })
  }

  /**
   * Send notification for game completion
   */
  async notifyGameCompleted(gameNumber: number, userId?: number, score?: number): Promise<void> {
    await this.send({
      title: '🎯 Game Completed!',
      message: `Game ${gameNumber}\n${userId ? `User ID: ${userId}` : 'Anonymous'}\n${score ? `Score: ${score}` : ''}`,
      sound: true,
    })
  }

  /**
   * Send notification for critical error
   */
  async notifyError(errorMessage: string): Promise<void> {
    await this.send({
      title: '🚨 Critical Error',
      message: errorMessage,
      sound: true,
      wait: true, // Wait for user to dismiss
    })
  }

  /**
   * Send notification for admin alert
   */
  async notifyAdmin(title: string, message: string): Promise<void> {
    await this.send({
      title: `⚡ Admin Alert: ${title}`,
      message,
      sound: true,
      wait: true,
    })
  }

  /**
   * Send notification for high traffic
   */
  async notifyHighTraffic(connectionCount: number): Promise<void> {
    await this.send({
      title: '📊 High Traffic Alert',
      message: `${connectionCount} clients currently connected`,
      sound: false,
    })
  }
}

// Export singleton instance
export const notificationService = new NotificationService()
export default notificationService
