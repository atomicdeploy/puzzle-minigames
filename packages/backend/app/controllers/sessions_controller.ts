import type { HttpContext } from '@adonisjs/core/http'
import UserSession from '#models/user_session'
import PageVisit from '#models/page_visit'
import { DateTime } from 'luxon'
import { randomBytes } from 'crypto'
import vine from '@vinejs/vine'

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
    })

    const data = await vine.validate({ schema: trackSchema, data: request.all() })

    const userId = auth.user?.id || null
    const sessionToken = request.header('x-session-token') || randomBytes(32).toString('hex')
    const ipAddress = request.ip()
    const userAgent = request.header('user-agent')

    // Create or update session
    let session = await UserSession.query()
      .where('session_token', sessionToken)
      .where('is_active', true)
      .first()

    if (!session) {
      session = await UserSession.create({
        userId,
        sessionToken,
        ipAddress,
        userAgent,
        deviceInfo: data.deviceInfo,
        isActive: true,
        expiresAt: DateTime.now().plus({ hours: 24 }),
      })
    }

    // Track page visit
    await PageVisit.create({
      userId,
      sessionToken,
      pagePath: data.pagePath,
      pageTitle: data.pageTitle,
      referrer: data.referrer,
      ipAddress,
      userAgent,
      deviceInfo: data.deviceInfo,
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
      },
    })
  }
}
