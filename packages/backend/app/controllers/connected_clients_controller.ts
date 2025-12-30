import type { HttpContext } from '@adonisjs/core/http'
import connectedClientsManager from '#services/connected_clients_manager'
import logger from '#services/logger'

export default class ConnectedClientsController {
  /**
   * Get list of all connected clients
   */
  async index({ response }: HttpContext) {
    const clients = connectedClientsManager.getAll()
    const stats = connectedClientsManager.getStats()

    logger.info('Connected clients list requested', { context: 'Clients' })

    return response.ok({
      success: true,
      count: clients.length,
      stats,
      clients: clients.map(client => ({
        socketId: client.socketId,
        userId: client.userId,
        deviceType: client.deviceType,
        browser: `${client.browser} ${client.browserVersion}`,
        os: `${client.os} ${client.osVersion}`,
        device: client.device,
        deviceVendor: client.deviceVendor,
        ipAddress: client.realIp || client.ipAddress,
        connectedAt: client.connectedAt,
        lastActivity: client.lastActivity,
        screenResolution: client.screenResolution,
        language: client.language,
        timezone: client.timezone,
      })),
    })
  }

  /**
   * Get statistics about connected clients
   */
  async stats({ response }: HttpContext) {
    const stats = connectedClientsManager.getStats()

    return response.ok({
      success: true,
      stats,
    })
  }

  /**
   * Get a specific connected client by socket ID
   */
  async show({ params, response }: HttpContext) {
    const client = connectedClientsManager.get(params.socketId)

    if (!client) {
      return response.notFound({
        success: false,
        error: 'Client not found',
      })
    }

    return response.ok({
      success: true,
      client,
    })
  }

  /**
   * Get connected clients for a specific user
   */
  async byUser({ params, response }: HttpContext) {
    const userId = parseInt(params.userId)
    const clients = connectedClientsManager.getByUserId(userId)

    return response.ok({
      success: true,
      count: clients.length,
      clients,
    })
  }

  /**
   * Cleanup stale connections
   */
  async cleanup({ request, response }: HttpContext) {
    const inactiveMinutes = request.input('inactiveMinutes', 30)
    const cleaned = connectedClientsManager.cleanupStale(inactiveMinutes)

    logger.success(`Cleaned up ${cleaned} stale connections`, { context: 'Clients' })

    return response.ok({
      success: true,
      cleanedCount: cleaned,
    })
  }
}
