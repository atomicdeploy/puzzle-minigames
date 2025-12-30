import type { HttpContext } from '@adonisjs/core/http'
import Game from '#models/game'

export default class GamesController {
  /**
   * Get all games
   */
  async index({ response }: HttpContext) {
    const games = await Game.all()

    return response.ok({
      success: true,
      data: games,
    })
  }

  /**
   * Get a single game
   */
  async show({ params, response }: HttpContext) {
    const game = await Game.find(params.id)

    if (!game) {
      return response.notFound({ error: 'Game not found' })
    }

    return response.ok({
      success: true,
      data: game,
    })
  }
}
