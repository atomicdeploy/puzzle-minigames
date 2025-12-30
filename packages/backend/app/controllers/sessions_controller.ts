import type { HttpContext } from '@adonisjs/core/http'
import UserSession from '#models/user_session'
import PageVisit from '#models/page_visit'
import { DateTime } from 'luxon'
import { randomBytes } from 'crypto'
import vine from '@vinejs/vine'
import clientInfoCollector from '#services/client_info_collector'
import logger from '#services/logger'

export default class SessionsController {
  /**
   * Track page visit and session
   */
  async track({ request, response, auth }: HttpContext) {
    const trackSchema = vine.object({
      pagePath: vine.string(),
      pageTitle: vine.string().optional(),
      referrer: vine.string().optional(),
      deviceInfo: vine.string().optional(),
      // Enhanced client info from browser
      screenResolution: vine.string().optional(),
      colorDepth: vine.number().optional(),
      pixelRatio: vine.number().optional(),
      touchSupport: vine.boolean().optional(),
      platform: vine.string().optional(),
      timezone: vine.string().optional(),
      timezoneOffset: vine.number().optional(),
      connectionType: vine.string().optional(),
    })

    const data = await vine.validate({ schema: trackSchema, data: request.all() })

    const userId = auth.user?.id || null
    const sessionToken = request.header('x-session-token') || randomBytes(32).toString('hex')
    
    // Collect comprehensive client information
    const clientInfo = clientInfoCollector.collectFromHttp(request, {
      screenResolution: data.screenResolution,
      colorDepth: data.colorDepth,
      pixelRatio: data.pixelRatio,
      touchSupport: data.touchSupport,
      platform: data.platform,
      timezone: data.timezone,
      timezoneOffset: data.timezoneOffset,
      connectionType: data.connectionType,
    })

    // Create or update session
    let session = await UserSession.query()
      .where('session_token', sessionToken)
      .where('is_active', true)
      .first()

    if (!session) {
      session = await UserSession.create({
        userId,
        sessionToken,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        deviceInfo: data.deviceInfo,
        isActive: true,
        expiresAt: DateTime.now().plus({ hours: 24 }),
        // Enhanced client info
        realIp: clientInfo.realIp,
        forwardedFor: clientInfo.forwardedFor,
        browser: clientInfo.browser,
        browserVersion: clientInfo.browserVersion,
        os: clientInfo.os,
        osVersion: clientInfo.osVersion,
        device: clientInfo.device,
        deviceType: clientInfo.deviceType,
        deviceVendor: clientInfo.deviceVendor,
        screenResolution: clientInfo.screenResolution,
        colorDepth: clientInfo.colorDepth,
        pixelRatio: clientInfo.pixelRatio,
        touchSupport: clientInfo.touchSupport,
        platform: clientInfo.platform,
        language: clientInfo.language,
        languages: clientInfo.languages,
        timezone: clientInfo.timezone,
        timezoneOffset: clientInfo.timezoneOffset,
        connectionType: clientInfo.connectionType,
        clientInfoJson: JSON.parse(clientInfoCollector.toJSON(clientInfo)),
      })
      
      logger.success('New session created', {
        context: 'Session',
        metadata: {
          sessionToken: sessionToken.substring(0, 8) + '...',
          userId,
          deviceType: clientInfo.deviceType,
        },
      })
    }

    // Track page visit
    await PageVisit.create({
      userId,
      sessionToken,
      pagePath: data.pagePath,
      pageTitle: data.pageTitle,
      referrer: data.referrer,
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      deviceInfo: data.deviceInfo,
    })

    logger.info(`Page visit tracked: ${data.pagePath}`, {
      context: 'Session',
      metadata: { userId, pagePath: data.pagePath },
    })

    return response.ok({
      success: true,
      sessionToken: session.sessionToken,
    })
  }

  /**
   * Get current session info
   */
  async current({ request, response, auth }: HttpContext) {
    const sessionToken = request.header('x-session-token')

    if (!sessionToken) {
      return response.badRequest({ error: 'No session token provided' })
    }

    const session = await UserSession.query()
      .where('session_token', sessionToken)
      .where('is_active', true)
      .preload('user', (query) => {
        query.select('id', 'fullName', 'email')
      })
      .first()

    if (!session) {
      return response.notFound({ error: 'Session not found' })
    }

    return response.ok({
      success: true,
      session: {
        id: session.id,
        userId: session.userId,
        user: session.user,
        isActive: session.isActive,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt,
        // Include device info in response
        deviceInfo: {
          deviceType: session.deviceType,
          browser: session.browser,
          browserVersion: session.browserVersion,
          os: session.os,
          osVersion: session.osVersion,
          device: session.device,
        },
      },
    })
  }
}
