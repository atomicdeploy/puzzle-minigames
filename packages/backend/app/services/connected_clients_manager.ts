/**
 * Connected clients manager
 * Keeps track of active socket connections and their information
 */

import type { SocketClientInfo } from './client_info_collector.js'
import logger from './logger.js'

export interface ConnectedClient extends SocketClientInfo {
  userId: number | null
  sessionToken: string | null
  lastActivity: Date
}

class ConnectedClientsManager {
  private clients: Map<string, ConnectedClient> = new Map()

  /**
   * Add a new connected client
   */
  add(client: ConnectedClient): void {
    this.clients.set(client.socketId, client)
    logger.socket.connect(client.socketId, client.userId || undefined)
    logger.info(`Total connected clients: ${this.clients.size}`, { context: 'ClientManager' })
  }

  /**
   * Update client's last activity
   */
  updateActivity(socketId: string): void {
    const client = this.clients.get(socketId)
    if (client) {
      client.lastActivity = new Date()
    }
  }

  /**
   * Remove a connected client
   */
  remove(socketId: string): void {
    const client = this.clients.get(socketId)
    if (client) {
      this.clients.delete(socketId)
      logger.socket.disconnect(socketId, client.userId || undefined)
      logger.info(`Total connected clients: ${this.clients.size}`, { context: 'ClientManager' })
    }
  }

  /**
   * Get a specific client by socket ID
   */
  get(socketId: string): ConnectedClient | undefined {
    return this.clients.get(socketId)
  }

  /**
   * Get all connected clients
   */
  getAll(): ConnectedClient[] {
    return Array.from(this.clients.values())
  }

  /**
   * Get clients by user ID
   */
  getByUserId(userId: number): ConnectedClient[] {
    return this.getAll().filter(client => client.userId === userId)
  }

  /**
   * Get count of connected clients
   */
  count(): number {
    return this.clients.size
  }

  /**
   * Get count of authenticated clients
   */
  countAuthenticated(): number {
    return this.getAll().filter(client => client.userId !== null).length
  }

  /**
   * Get count of anonymous clients
   */
  countAnonymous(): number {
    return this.getAll().filter(client => client.userId === null).length
  }

  /**
   * Get clients grouped by device type
   */
  getByDeviceType(): Record<string, ConnectedClient[]> {
    const grouped: Record<string, ConnectedClient[]> = {
      mobile: [],
      tablet: [],
      desktop: [],
      unknown: [],
    }

    for (const client of this.getAll()) {
      grouped[client.deviceType].push(client)
    }

    return grouped
  }

  /**
   * Get statistics about connected clients
   */
  getStats() {
    const all = this.getAll()
    const byDeviceType = this.getByDeviceType()

    return {
      total: this.count(),
      authenticated: this.countAuthenticated(),
      anonymous: this.countAnonymous(),
      byDeviceType: {
        mobile: byDeviceType.mobile.length,
        tablet: byDeviceType.tablet.length,
        desktop: byDeviceType.desktop.length,
        unknown: byDeviceType.unknown.length,
      },
      browsers: this.groupBy(all, 'browser'),
      operatingSystems: this.groupBy(all, 'os'),
      countries: this.groupBy(all, 'realIp'), // Could be enhanced with IP geolocation
    }
  }

  /**
   * Group clients by a specific field
   */
  private groupBy(clients: ConnectedClient[], field: keyof ConnectedClient): Record<string, number> {
    const grouped: Record<string, number> = {}

    for (const client of clients) {
      const value = String(client[field] || 'Unknown')
      grouped[value] = (grouped[value] || 0) + 1
    }

    return grouped
  }

  /**
   * Get clients list formatted for display
   */
  getFormattedList(): string[] {
    return this.getAll().map(client => {
      const parts = [
        `🔌 ${client.socketId.substring(0, 8)}...`,
        client.userId ? `👤 User ${client.userId}` : '👤 Anonymous',
        `💻 ${client.deviceType}`,
        `🔍 ${client.browser} ${client.browserVersion}`,
        `🌐 ${client.realIp || client.ipAddress}`,
        `⏱️ Active ${this.getTimeAgo(client.lastActivity)}`,
      ]
      return parts.join(' | ')
    })
  }

  /**
   * Get time ago string
   */
  private getTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
    
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  /**
   * Clean up stale connections (inactive for more than specified minutes)
   */
  cleanupStale(inactiveMinutes: number = 30): number {
    const now = Date.now()
    const threshold = inactiveMinutes * 60 * 1000
    let cleaned = 0

    for (const [socketId, client] of this.clients.entries()) {
      if (now - client.lastActivity.getTime() > threshold) {
        this.clients.delete(socketId)
        cleaned++
        logger.warning(`Cleaned up stale connection: ${socketId}`, { context: 'ClientManager' })
      }
    }

    if (cleaned > 0) {
      logger.info(`Cleaned up ${cleaned} stale connection(s)`, { context: 'ClientManager' })
    }

    return cleaned
  }
}

// Export singleton instance
export const connectedClientsManager = new ConnectedClientsManager()
export default connectedClientsManager
