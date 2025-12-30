import type { HttpContext } from '@adonisjs/core/http'
import QrToken from '#models/qr_token'
import QrAccessLog from '#models/qr_access_log'
import { DateTime } from 'luxon'
import vine from '@vinejs/vine'
import { v4 as uuidv4 } from 'uuid'
import clientInfoCollector from '#services/client_info_collector'
import logger from '#services/logger'
import notificationService from '#services/notification_service'
import { io } from '#start/socket'

export default class QrController {
  /**
   * Validate QR token and grant/deny access
   */
  async validate({ request, response, auth }: HttpContext) {
    const validateSchema = vine.object({
      token: vine.string(),
      game: vine.number(),
    })

    const data = await vine.validate({ schema: validateSchema, data: request.all() })
    const userId = auth.user?.id || null
    const sessionToken = request.header('x-session-token')

    // Collect client information
    const clientInfo = clientInfoCollector.collectFromHttp(request)

    // Look up the QR token
    const qrToken = await QrToken.query()
      .where('token', data.token)
      .where('game_number', data.game)
      .first()

    let accessStatus: 'granted' | 'denied' | 'invalid' = 'invalid'
    let denialReason: string | null = null

    if (!qrToken) {
      accessStatus = 'invalid'
      denialReason = 'Token not found'
    } else if (!qrToken.isActive) {
      accessStatus = 'denied'
      denialReason = 'Token is inactive'
    } else if (qrToken.isUsed) {
      accessStatus = 'denied'
      denialReason = 'Token has already been used'
    } else {
      accessStatus = 'granted'

      // Update token usage
      qrToken.accessCount += 1
      if (!qrToken.firstAccessedAt) {
        qrToken.firstAccessedAt = DateTime.now()
      }
      qrToken.lastAccessedAt = DateTime.now()

      // Mark as used if this is a single-use token
      qrToken.isUsed = true
      qrToken.usedAt = DateTime.now()
      qrToken.usedByUserId = userId

      await qrToken.save()
    }

    // Log the access attempt
    await QrAccessLog.create({
      qrTokenId: qrToken?.id || null,
      token: data.token,
      gameNumber: data.game,
      userId,
      sessionToken,
      accessStatus,
      denialReason,
      ipAddress: clientInfo.ipAddress,
      realIp: clientInfo.realIp,
      userAgent: clientInfo.userAgent,
      deviceType: clientInfo.deviceType,
      browser: clientInfo.browser,
      os: clientInfo.os,
      clientInfo: JSON.parse(clientInfoCollector.toJSON(clientInfo)),
      accessedAt: DateTime.now(),
    })

    // Log with emoji
    logger.qr.accessed(data.game, data.token, accessStatus === 'granted')

    // Send notification
    await notificationService.notifyQrAccessed(
      data.game,
      accessStatus,
      userId || undefined
    )

    // Emit socket event for QR access
    if (io) {
      io.emit('qr:accessed', {
        gameNumber: data.game,
        token: data.token,
        accessStatus,
        userId,
        timestamp: new Date().toISOString(),
      })
    }

    if (accessStatus === 'granted') {
      return response.ok({
        success: true,
        accessGranted: true,
        gameNumber: data.game,
        message: 'Access granted',
      })
    } else {
      return response.forbidden({
        success: false,
        accessGranted: false,
        reason: denialReason,
        message: 'Access denied',
      })
    }
  }

  /**
   * Generate new QR tokens
   */
  async generate({ request, response }: HttpContext) {
    const generateSchema = vine.object({
      count: vine.number().min(1).max(20).optional(),
      gameNumbers: vine.array(vine.number()).optional(),
      notes: vine.string().optional(),
    })

    const data = await vine.validate({ schema: generateSchema, data: request.all() })

    const gameNumbers = data.gameNumbers || Array.from({ length: data.count || 9 }, (_, i) => i + 1)
    const tokens: QrToken[] = []

    for (const gameNumber of gameNumbers) {
      const token = uuidv4()
      
      const qrToken = await QrToken.create({
        token,
        gameNumber,
        isActive: true,
        isUsed: false,
        accessCount: 0,
        notes: data.notes,
      })

      tokens.push(qrToken)
    }

    logger.qr.generated(tokens.length)

    return response.created({
      success: true,
      count: tokens.length,
      tokens: tokens.map(t => ({
        id: t.id,
        token: t.token,
        gameNumber: t.gameNumber,
        url: `${request.header('origin') || 'http://localhost:3000'}/minigame-access?game=${t.gameNumber}&token=${t.token}`,
      })),
    })
  }

  /**
   * Get all QR tokens
   */
  async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const perPage = request.input('perPage', 20)
    const isActive = request.input('isActive')
    const isUsed = request.input('isUsed')
    const gameNumber = request.input('gameNumber')

    const query = QrToken.query()

    if (isActive !== undefined) {
      query.where('is_active', isActive === 'true' || isActive === true)
    }

    if (isUsed !== undefined) {
      query.where('is_used', isUsed === 'true' || isUsed === true)
    }

    if (gameNumber) {
      query.where('game_number', gameNumber)
    }

    const tokens = await query
      .orderBy('created_at', 'desc')
      .paginate(page, perPage)

    return response.ok({
      success: true,
      ...tokens.serialize(),
    })
  }

  /**
   * Get a specific QR token
   */
  async show({ params, response }: HttpContext) {
    const qrToken = await QrToken.query()
      .where('id', params.id)
      .preload('usedByUser')
      .firstOrFail()

    return response.ok({
      success: true,
      token: qrToken,
    })
  }

  /**
   * Update a QR token
   */
  async update({ params, request, response }: HttpContext) {
    const updateSchema = vine.object({
      isActive: vine.boolean().optional(),
      notes: vine.string().optional(),
    })

    const data = await vine.validate({ schema: updateSchema, data: request.all() })
    const qrToken = await QrToken.findOrFail(params.id)

    if (data.isActive !== undefined) {
      qrToken.isActive = data.isActive
    }

    if (data.notes !== undefined) {
      qrToken.notes = data.notes
    }

    await qrToken.save()

    logger.info(`QR token ${qrToken.id} updated`, { context: 'QR' })

    return response.ok({
      success: true,
      token: qrToken,
    })
  }

  /**
   * Delete a QR token
   */
  async destroy({ params, response }: HttpContext) {
    const qrToken = await QrToken.findOrFail(params.id)
    await qrToken.delete()

    logger.info(`QR token ${params.id} deleted`, { context: 'QR' })

    return response.ok({
      success: true,
      message: 'Token deleted',
    })
  }

  /**
   * Get access logs for a QR token
   */
  async logs({ params, request, response }: HttpContext) {
    const page = request.input('page', 1)
    const perPage = request.input('perPage', 20)

    const logs = await QrAccessLog.query()
      .where('qr_token_id', params.id)
      .preload('user')
      .orderBy('accessed_at', 'desc')
      .paginate(page, perPage)

    return response.ok({
      success: true,
      ...logs.serialize(),
    })
  }

  /**
   * Get all access logs
   */
  async allLogs({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const perPage = request.input('perPage', 20)
    const accessStatus = request.input('accessStatus')
    const gameNumber = request.input('gameNumber')

    const query = QrAccessLog.query()

    if (accessStatus) {
      query.where('access_status', accessStatus)
    }

    if (gameNumber) {
      query.where('game_number', gameNumber)
    }

    const logs = await query
      .preload('user')
      .preload('qrToken')
      .orderBy('accessed_at', 'desc')
      .paginate(page, perPage)

    return response.ok({
      success: true,
      ...logs.serialize(),
    })
  }
}
