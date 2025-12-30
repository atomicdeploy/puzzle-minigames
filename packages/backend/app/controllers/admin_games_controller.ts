import type { HttpContext } from '@adonisjs/core/http'
import Game from '#models/game'
import MinigameAnswer from '#models/minigame_answer'
import PlayerProgress from '#models/player_progress'
import User from '#models/user'
import vine from '@vinejs/vine'
import logger from '#services/logger'

export default class AdminGamesController {
  /**
   * Get all games with statistics
   */
  async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const perPage = request.input('perPage', 20)
    const sortBy = request.input('sortBy', 'game_number')
    const sortOrder = request.input('sortOrder', 'asc') as 'asc' | 'desc'

    const query = Game.query()

    // Apply sorting
    query.orderBy(sortBy, sortOrder)

    const games = await query.paginate(page, perPage)

    // Add statistics for each game
    const gamesData = games.serialize()
    gamesData.data = await Promise.all(
      gamesData.data.map(async (game: any) => {
        const stats = await MinigameAnswer.query()
          .where('game_id', game.id)
          .select('is_correct')
          .groupBy('is_correct')
          .count('* as total')

        const correctAnswers = stats.find((s: any) => s.is_correct === true)?.$extras.total || 0
        const incorrectAnswers = stats.find((s: any) => s.is_correct === false)?.$extras.total || 0
        const totalAttempts = correctAnswers + incorrectAnswers
        const uniqueUsers = await MinigameAnswer.query()
          .where('game_id', game.id)
          .countDistinct('user_id as total')

        return {
          ...game,
          stats: {
            totalAttempts,
            correctAnswers,
            incorrectAnswers,
            uniqueUsers: uniqueUsers[0].$extras.total || 0,
            successRate:
              totalAttempts > 0 ? ((correctAnswers / totalAttempts) * 100).toFixed(2) : 0,
          },
        }
      })
    )

    return response.ok({
      success: true,
      ...gamesData,
    })
  }

  /**
   * Get detailed game information
   */
  async show({ params, response }: HttpContext) {
    const game = await Game.findOrFail(params.id)

    // Get all answers for this game
    const answers = await MinigameAnswer.query()
      .where('game_id', game.id)
      .preload('user')
      .orderBy('created_at', 'desc')
      .limit(100)

    // Get statistics
    const stats = await MinigameAnswer.query()
      .where('game_id', game.id)
      .select('is_correct')
      .groupBy('is_correct')
      .count('* as total')

    const correctAnswers = stats.find((s: any) => s.isCorrect === true)?.$extras.total || 0
    const incorrectAnswers = stats.find((s: any) => s.isCorrect === false)?.$extras.total || 0
    const totalAttempts = correctAnswers + incorrectAnswers
    const uniqueUsers = await MinigameAnswer.query()
      .where('game_id', game.id)
      .countDistinct('user_id as total')

    return response.ok({
      success: true,
      game: game.serialize(),
      answers: answers.map((a) => a.serialize()),
      stats: {
        totalAttempts,
        correctAnswers,
        incorrectAnswers,
        uniqueUsers: uniqueUsers[0].$extras.total || 0,
        successRate: totalAttempts > 0 ? ((correctAnswers / totalAttempts) * 100).toFixed(2) : 0,
      },
    })
  }

  /**
   * Create a new game
   */
  async store({ request, response }: HttpContext) {
    const createSchema = vine.object({
      gameNumber: vine.number(),
      gameName: vine.string(),
      gameDescription: vine.string().optional(),
      difficulty: vine.enum(['easy', 'medium', 'hard']).optional(),
      maxScore: vine.number().optional(),
      timeLimit: vine.number().optional(),
    })

    const data = await vine.validate({ schema: createSchema, data: request.all() })

    const game = await Game.create({
      gameNumber: data.gameNumber,
      gameName: data.gameName,
      gameDescription: data.gameDescription,
      difficulty: data.difficulty,
      maxScore: data.maxScore,
      timeLimit: data.timeLimit,
    })

    logger.success(`Game ${game.id} created`, { context: 'AdminGames' })

    return response.created({
      success: true,
      game: game.serialize(),
    })
  }

  /**
   * Update game details
   */
  async update({ params, request, response }: HttpContext) {
    const updateSchema = vine.object({
      gameName: vine.string().optional(),
      gameDescription: vine.string().optional(),
      difficulty: vine.enum(['easy', 'medium', 'hard']).optional(),
      maxScore: vine.number().optional(),
      timeLimit: vine.number().optional(),
    })

    const data = await vine.validate({ schema: updateSchema, data: request.all() })
    const game = await Game.findOrFail(params.id)

    if (data.gameName !== undefined) game.gameName = data.gameName
    if (data.gameDescription !== undefined) game.gameDescription = data.gameDescription
    if (data.difficulty !== undefined) game.difficulty = data.difficulty
    if (data.maxScore !== undefined) game.maxScore = data.maxScore
    if (data.timeLimit !== undefined) game.timeLimit = data.timeLimit

    await game.save()

    logger.success(`Game ${game.id} updated`, { context: 'AdminGames' })

    return response.ok({
      success: true,
      game: game.serialize(),
    })
  }

  /**
   * Delete a game
   */
  async destroy({ params, response }: HttpContext) {
    const game = await Game.findOrFail(params.id)
    await game.delete()

    logger.warning(`Game ${params.id} deleted`, { context: 'AdminGames' })

    return response.ok({
      success: true,
      message: 'Game deleted successfully',
    })
  }

  /**
   * Get all answers/attempts for a specific game with user details
   */
  async answers({ params, request, response }: HttpContext) {
    const page = request.input('page', 1)
    const perPage = request.input('perPage', 50)
    const isCorrect = request.input('isCorrect') // filter by correct/incorrect
    const userId = request.input('userId') // filter by user

    const query = MinigameAnswer.query()
      .where('game_id', params.id)
      .preload('user')

    if (isCorrect !== undefined) {
      query.where('is_correct', isCorrect === 'true')
    }

    if (userId) {
      query.where('user_id', userId)
    }

    const answers = await query.orderBy('created_at', 'desc').paginate(page, perPage)

    return response.ok({
      success: true,
      ...answers.serialize(),
    })
  }

  /**
   * Get users who solved a specific game
   */
  async solvers({ params, request, response }: HttpContext) {
    const page = request.input('page', 1)
    const perPage = request.input('perPage', 50)

    // Get unique users who correctly answered this game
    const userIds = await MinigameAnswer.query()
      .where('game_id', params.id)
      .where('is_correct', true)
      .distinct('user_id')
      .pluck('user_id')

    const users = await User.query()
      .whereIn('id', userIds)
      .preload('playerProgress')
      .paginate(page, perPage)

    return response.ok({
      success: true,
      ...users.serialize(),
    })
  }

  /**
   * Get leaderboard for a specific game
   */
  async leaderboard({ params, request, response }: HttpContext) {
    const limit = request.input('limit', 50)

    const leaderboard = await MinigameAnswer.query()
      .where('game_id', params.id)
      .where('is_correct', true)
      .preload('user')
      .orderBy('score', 'desc')
      .orderBy('time_taken', 'asc')
      .limit(limit)

    return response.ok({
      success: true,
      leaderboard: leaderboard.map((a) => a.serialize()),
    })
  }
}
