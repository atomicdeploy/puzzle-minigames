import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Game from '#models/game'
import MinigameAnswer from '#models/minigame_answer'
import QrAccessLog from '#models/qr_access_log'
import PlayerProgress from '#models/player_progress'
import UserSession from '#models/user_session'
import PageVisit from '#models/page_visit'
import { DateTime } from 'luxon'
import logger from '#services/logger'

export default class AdminAnalyticsController {
  /**
   * Get dashboard overview statistics
   */
  async dashboard({ response }: HttpContext) {
    const now = DateTime.now()
    const last24h = now.minus({ hours: 24 })
    const last7d = now.minus({ days: 7 })
    const last30d = now.minus({ days: 30 })

    // Total counts
    const totalUsers = await User.query().count('* as total')
    const totalGames = await Game.query().count('* as total')
    const totalAttempts = await MinigameAnswer.query().count('* as total')
    const totalQrAccess = await QrAccessLog.query()
      .where('access_status', 'granted')
      .count('* as total')

    // Recent activity (last 24 hours)
    const recentUsers = await User.query()
      .where('created_at', '>', last24h.toSQL()!)
      .count('* as total')
    const recentAttempts = await MinigameAnswer.query()
      .where('created_at', '>', last24h.toSQL()!)
      .count('* as total')
    const recentQrAccess = await QrAccessLog.query()
      .where('accessed_at', '>', last24h.toSQL()!)
      .where('access_status', 'granted')
      .count('* as total')

    // Success rates
    const correctAnswers = await MinigameAnswer.query()
      .where('is_correct', true)
      .count('* as total')
    const successRate =
      totalAttempts[0].$extras.total > 0
        ? ((correctAnswers[0].$extras.total / totalAttempts[0].$extras.total) * 100).toFixed(2)
        : 0

    // Active users (users with activity in last 7 days)
    const activeUsers = await User.query()
      .whereHas('sessions', (builder) => {
        builder.where('created_at', '>', last7d.toSQL()!)
      })
      .count('* as total')

    return response.ok({
      success: true,
      overview: {
        totalUsers: totalUsers[0].$extras.total,
        totalGames: totalGames[0].$extras.total,
        totalAttempts: totalAttempts[0].$extras.total,
        totalQrAccess: totalQrAccess[0].$extras.total,
        successRate: parseFloat(successRate),
        activeUsers: activeUsers[0].$extras.total,
      },
      recent24h: {
        newUsers: recentUsers[0].$extras.total,
        attempts: recentAttempts[0].$extras.total,
        qrAccess: recentQrAccess[0].$extras.total,
      },
    })
  }

  /**
   * Get comprehensive user-minigame matrix
   * Shows which users accessed/solved which minigames with timestamps and duration
   */
  async userMinigameMatrix({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const perPage = request.input('perPage', 50)
    const userId = request.input('userId') // filter by specific user
    const gameId = request.input('gameId') // filter by specific game
    const status = request.input('status') // 'solved', 'attempted', 'accessed'
    const sortBy = request.input('sortBy', 'accessed_at')
    const sortOrder = request.input('sortOrder', 'desc') as 'asc' | 'desc'

    // Build comprehensive query joining QR access and answers
    const query = `
      SELECT 
        u.id as user_id,
        u.full_name as user_name,
        u.email as user_email,
        g.id as game_id,
        g.game_number,
        g.game_name,
        qr.accessed_at as qr_accessed_at,
        qr.access_status as qr_status,
        ma.created_at as attempt_time,
        ma.is_correct,
        ma.score,
        ma.time_taken as completion_time_seconds,
        ma.answer_data,
        TIMESTAMPDIFF(SECOND, qr.accessed_at, ma.created_at) as time_from_access_to_completion
      FROM users u
      LEFT JOIN qr_access_logs qr ON qr.user_id = u.id
      LEFT JOIN games g ON g.game_number = qr.game_number
      LEFT JOIN minigame_answers ma ON ma.user_id = u.id AND ma.game_id = g.id
      WHERE 1=1
        ${userId ? `AND u.id = ${userId}` : ''}
        ${gameId ? `AND g.id = ${gameId}` : ''}
        ${status === 'solved' ? 'AND ma.is_correct = 1' : ''}
        ${status === 'attempted' ? 'AND ma.id IS NOT NULL' : ''}
        ${status === 'accessed' ? 'AND qr.access_status = "granted"' : ''}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ${perPage} OFFSET ${(page - 1) * perPage}
    `

    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      LEFT JOIN qr_access_logs qr ON qr.user_id = u.id
      LEFT JOIN games g ON g.game_number = qr.game_number
      LEFT JOIN minigame_answers ma ON ma.user_id = u.id AND ma.game_id = g.id
      WHERE 1=1
        ${userId ? `AND u.id = ${userId}` : ''}
        ${gameId ? `AND g.id = ${gameId}` : ''}
        ${status === 'solved' ? 'AND ma.is_correct = 1' : ''}
        ${status === 'attempted' ? 'AND ma.id IS NOT NULL' : ''}
        ${status === 'accessed' ? 'AND qr.access_status = "granted"' : ''}
    `

    const Database = (await import('@adonisjs/lucid/services/db')).default
    const results = await Database.rawQuery(query)
    const countResult = await Database.rawQuery(countQuery)

    const total = countResult[0][0]?.total || 0
    const lastPage = Math.ceil(total / perPage)

    return response.ok({
      success: true,
      data: results[0].map((row: any) => ({
        user: {
          id: row.user_id,
          name: row.user_name,
          email: row.user_email,
        },
        game: {
          id: row.game_id,
          number: row.game_number,
          name: row.game_name,
        },
        qrAccess: {
          accessedAt: row.qr_accessed_at,
          status: row.qr_status,
        },
        attempt: {
          attemptTime: row.attempt_time,
          isCorrect: Boolean(row.is_correct),
          score: row.score,
          completionTimeSeconds: row.completion_time_seconds,
          answerData: row.answer_data,
        },
        timing: {
          qrAccessedAt: row.qr_accessed_at,
          gameAttemptedAt: row.attempt_time,
          timeFromAccessToCompletion: row.time_from_access_to_completion,
          completionDuration: row.completion_time_seconds,
        },
      })),
      meta: {
        total,
        perPage,
        currentPage: page,
        lastPage,
        firstPage: 1,
        hasMorePages: page < lastPage,
      },
    })
  }

  /**
   * Get detailed timeline for a specific user
   * Shows complete journey through minigames with all timestamps
   */
  async userTimeline({ params, request, response }: HttpContext) {
    const userId = params.id
    const page = request.input('page', 1)
    const perPage = request.input('perPage', 50)

    // Get all QR accesses
    const qrAccesses = await QrAccessLog.query()
      .where('user_id', userId)
      .preload('qrToken')
      .orderBy('accessed_at', 'desc')

    // Get all minigame attempts
    const attempts = await MinigameAnswer.query()
      .where('user_id', userId)
      .preload('game')
      .orderBy('created_at', 'desc')

    // Combine and create timeline
    const timeline: any[] = []

    // Add QR accesses to timeline
    qrAccesses.forEach((access) => {
      timeline.push({
        type: 'qr_access',
        timestamp: access.accessedAt.toISO(),
        gameNumber: access.gameNumber,
        status: access.accessStatus,
        details: {
          token: access.token,
          denialReason: access.denialReason,
          deviceType: access.deviceType,
          browser: access.browser,
          ipAddress: access.realIp || access.ipAddress,
        },
      })
    })

    // Add attempts to timeline
    attempts.forEach((attempt) => {
      const qrAccess = qrAccesses.find(
        (qa) => qa.gameNumber === attempt.game.gameNumber && qa.accessStatus === 'granted'
      )

      timeline.push({
        type: 'minigame_attempt',
        timestamp: attempt.createdAt.toISO(),
        gameNumber: attempt.game.gameNumber,
        gameName: attempt.game.gameName,
        status: attempt.isCorrect ? 'solved' : 'failed',
        details: {
          score: attempt.score,
          timeTaken: attempt.timeTaken,
          isCorrect: attempt.isCorrect,
          answerData: attempt.answerData,
          qrAccessTime: qrAccess?.accessedAt.toISO(),
          timeFromQrAccess: qrAccess
            ? attempt.createdAt.diff(qrAccess.accessedAt, 'seconds').seconds
            : null,
        },
      })
    })

    // Sort by timestamp
    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Paginate
    const start = (page - 1) * perPage
    const paginatedTimeline = timeline.slice(start, start + perPage)

    return response.ok({
      success: true,
      timeline: paginatedTimeline,
      meta: {
        total: timeline.length,
        perPage,
        currentPage: page,
        lastPage: Math.ceil(timeline.length / perPage),
      },
    })
  }

  /**
   * Get game completion statistics with timing data
   */
  async gameCompletionStats({ params, response }: HttpContext) {
    const gameId = params.id

    const answers = await MinigameAnswer.query()
      .where('game_id', gameId)
      .where('is_correct', true)
      .preload('user')

    // Calculate statistics
    const timings = answers.map((a) => a.timeTaken).filter((t) => t !== null && t > 0)
    const scores = answers.map((a) => a.score).filter((s) => s !== null && s > 0)

    const avgTime = timings.length > 0 ? timings.reduce((a, b) => a + b, 0) / timings.length : 0
    const minTime = timings.length > 0 ? Math.min(...timings) : 0
    const maxTime = timings.length > 0 ? Math.max(...timings) : 0
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0

    // Get QR access data for this game
    const game = await Game.findOrFail(gameId)
    const qrAccesses = await QrAccessLog.query()
      .where('game_number', game.gameNumber)
      .where('access_status', 'granted')

    // Calculate time from QR access to completion
    const completionDelays: number[] = []
    for (const answer of answers) {
      const qrAccess = qrAccesses.find(
        (qa) => qa.userId === answer.userId && qa.accessedAt < answer.createdAt
      )
      if (qrAccess) {
        const delay = answer.createdAt.diff(qrAccess.accessedAt, 'seconds').seconds
        completionDelays.push(delay)
      }
    }

    const avgCompletionDelay =
      completionDelays.length > 0
        ? completionDelays.reduce((a, b) => a + b, 0) / completionDelays.length
        : 0

    return response.ok({
      success: true,
      stats: {
        totalSolvers: answers.length,
        totalQrAccesses: qrAccesses.length,
        timingStats: {
          averageCompletionTime: avgTime,
          minimumCompletionTime: minTime,
          maximumCompletionTime: maxTime,
          averageTimeFromQrAccessToCompletion: avgCompletionDelay,
        },
        scoreStats: {
          averageScore: avgScore,
        },
      },
      recentCompletions: answers
        .slice(0, 10)
        .map((a) => ({
          user: a.user.serialize(),
          completedAt: a.createdAt.toISO(),
          timeTaken: a.timeTaken,
          score: a.score,
        })),
    })
  }

  /**
   * Get activity heatmap data
   */
  async activityHeatmap({ request, response }: HttpContext) {
    const days = request.input('days', 30)
    const startDate = DateTime.now().minus({ days })

    // Get activity grouped by date
    const Database = (await import('@adonisjs/lucid/services/db')).default
    const activityQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        'attempt' as type
      FROM minigame_answers
      WHERE created_at >= ?
      GROUP BY DATE(created_at)
      UNION ALL
      SELECT 
        DATE(accessed_at) as date,
        COUNT(*) as count,
        'qr_access' as type
      FROM qr_access_logs
      WHERE accessed_at >= ?
      GROUP BY DATE(accessed_at)
      ORDER BY date DESC
    `

    const results = await Database.rawQuery(activityQuery, [startDate.toSQL()!, startDate.toSQL()!])

    return response.ok({
      success: true,
      heatmap: results[0],
    })
  }

  /**
   * Get user performance report
   */
  async userPerformanceReport({ params, response }: HttpContext) {
    const userId = params.id

    // Get all attempts with timing
    const attempts = await MinigameAnswer.query()
      .where('user_id', userId)
      .preload('game')
      .orderBy('created_at', 'asc')

    // Calculate performance metrics
    const totalAttempts = attempts.length
    const correctAttempts = attempts.filter((a) => a.isCorrect).length
    const successRate = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0

    const timings = attempts.map((a) => a.timeTaken).filter((t) => t !== null && t > 0)
    const avgTime = timings.length > 0 ? timings.reduce((a, b) => a + b, 0) / timings.length : 0

    // Get games solved
    const gamesSolved = [...new Set(attempts.filter((a) => a.isCorrect).map((a) => a.game.id))]

    return response.ok({
      success: true,
      performance: {
        totalAttempts,
        correctAttempts,
        successRate: successRate.toFixed(2),
        averageCompletionTime: avgTime.toFixed(2),
        gamesSolved: gamesSolved.length,
        totalScore: attempts.reduce((sum, a) => sum + (a.score || 0), 0),
      },
      attemptHistory: attempts.map((a) => ({
        gameName: a.game.gameName,
        gameNumber: a.game.gameNumber,
        attemptedAt: a.createdAt.toISO(),
        isCorrect: a.isCorrect,
        timeTaken: a.timeTaken,
        score: a.score,
      })),
    })
  }

  /**
   * Export data for reporting
   */
  async exportData({ request, response }: HttpContext) {
    const type = request.input('type', 'all') // all, users, games, attempts, qr_access
    const format = request.input('format', 'json') // json, csv

    let data: any = {}

    if (type === 'all' || type === 'users') {
      const users = await User.query().preload('playerProgress')
      data.users = users.map((u) => u.serialize())
    }

    if (type === 'all' || type === 'games') {
      const games = await Game.query()
      data.games = games.map((g) => g.serialize())
    }

    if (type === 'all' || type === 'attempts') {
      const attempts = await MinigameAnswer.query().preload('user').preload('game')
      data.attempts = attempts.map((a) => ({
        ...a.serialize(),
        user: a.user.serialize(),
        game: a.game.serialize(),
      }))
    }

    if (type === 'all' || type === 'qr_access') {
      const qrAccess = await QrAccessLog.query().preload('user')
      data.qrAccess = qrAccess.map((q) => q.serialize())
    }

    logger.info(`Data exported: ${type}`, { context: 'Analytics' })

    return response.ok({
      success: true,
      data,
      exportedAt: new Date().toISOString(),
    })
  }
}
