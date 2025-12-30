import { HttpContext } from '@adonisjs/core/http'
import { NextFn } from '@adonisjs/core/types/http'
import logger from '#services/logger'

/**
 * Admin middleware checks if the authenticated user has admin privileges
 */
export default class AdminMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    // Ensure user is authenticated first
    if (!ctx.auth?.user) {
      logger.warning('Admin access attempted without authentication', { context: 'AdminAuth' })
      return ctx.response.unauthorized({
        success: false,
        error: 'Authentication required',
      })
    }

    // Check if user has admin privileges
    if (!ctx.auth.user.isAdmin) {
      logger.warning(`Non-admin user ${ctx.auth.user.id} attempted to access admin endpoint`, {
        context: 'AdminAuth',
        metadata: { userId: ctx.auth.user.id, path: ctx.request.url() },
      })
      
      return ctx.response.forbidden({
        success: false,
        error: 'Admin privileges required',
      })
    }

    logger.debug(`Admin ${ctx.auth.user.id} accessing ${ctx.request.url()}`, {
      context: 'AdminAuth',
    })

    return next()
  }
}
