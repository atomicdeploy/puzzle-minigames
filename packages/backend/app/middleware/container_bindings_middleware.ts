import { HttpContext } from '@adonisjs/core/http'
import { NextFn } from '@adonisjs/core/types/http'
import { inject } from '@adonisjs/core'

/**
 * Middleware to bind container instances to the HTTP context
 */
@inject()
export default class ContainerBindingsMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    await next()
  }
}
