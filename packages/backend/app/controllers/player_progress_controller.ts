import type { HttpContext } from '@adonisjs/core/http'
import PlayerProgress from '#models/player_progress'
import vine from '@vinejs/vine'

export default class PlayerProgressController {
  /**
   * Get player's progress
   */
  async show({ auth, response }: HttpContext) {
    const user = auth.user!

    const progress = await PlayerProgress.query().where('user_id', user.id).first()

    if (!progress) {
      return response.ok({
        success: true,
        data: null,
      })
    }

    return response.ok({
      success: true,
      data: progress,
    })
  }

  /**
   * Save player progress
   */
  async save({ request, response, auth }: HttpContext) {
    const user = auth.user!

    const progressSchema = vine.object({
      discoveredPuzzles: vine.array(vine.number()),
      puzzleBoard: vine.array(vine.number().nullable()),
      score: vine.number().min(0),
      completedGames: vine.number().min(0).optional(),
    })

    const data = await vine.validate({ schema: progressSchema, data: request.all() })

    // Find or create progress
    let progress = await PlayerProgress.query().where('user_id', user.id).first()

    if (!progress) {
      progress = await PlayerProgress.create({
        userId: user.id,
        discoveredPuzzles: data.discoveredPuzzles,
        puzzleBoard: data.puzzleBoard,
        score: data.score,
        completedGames: data.completedGames || 0,
      })
    } else {
      progress.discoveredPuzzles = data.discoveredPuzzles
      progress.puzzleBoard = data.puzzleBoard
      progress.score = data.score
      if (data.completedGames !== undefined) {
        progress.completedGames = data.completedGames
      }
      await progress.save()
    }

    return response.ok({
      success: true,
      message: 'Progress saved successfully',
      data: progress,
    })
  }

  /**
   * Get leaderboard
   */
  async leaderboard({ request, response }: HttpContext) {
    const limit = request.input('limit', 10)
    const page = request.input('page', 1)

    const leaderboard = await PlayerProgress.query()
      .preload('user', (query) => {
        query.select('id', 'fullName', 'email')
      })
      .orderBy('score', 'desc')
      .paginate(page, limit)

    return response.ok({
      success: true,
      data: leaderboard.serialize(),
    })
  }
}
