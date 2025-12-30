import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import PlayerProgress from '#models/player_progress'
import MinigameAnswer from '#models/minigame_answer'
import PageVisit from '#models/page_visit'
import UserSession from '#models/user_session'
import QrAccessLog from '#models/qr_access_log'
import vine from '@vinejs/vine'
import logger from '#services/logger'

export default class AdminUsersController {
  /**
   * Get all users with pagination, filtering, and sorting
   */
  async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const perPage = request.input('perPage', 20)
    const sortBy = request.input('sortBy', 'created_at')
    const sortOrder = request.input('sortOrder', 'desc') as 'asc' | 'desc'
    const search = request.input('search', '')
    const status = request.input('status') // approved, pending, blocked
    const hasProgress = request.input('hasProgress') // true/false

    const query = User.query()

    // Apply search filter
    if (search) {
      query.where((builder) => {
        builder
          .where('full_name', 'LIKE', `%${search}%`)
          .orWhere('email', 'LIKE', `%${search}%`)
          .orWhere('phone_number', 'LIKE', `%${search}%`)
      })
    }

    // Apply status filter
    if (status === 'approved') {
      query.where('is_approved', true)
    } else if (status === 'pending') {
      query.where('is_approved', false)
    } else if (status === 'blocked') {
      query.where('is_blocked', true)
    }

    // Apply progress filter
    if (hasProgress === 'true') {
      query.whereHas('playerProgress', (builder) => {
        builder.whereNotNull('id')
      })
    }

    // Apply sorting
    query.orderBy(sortBy, sortOrder)

    // Paginate with relationships
    const users = await query
      .preload('playerProgress')
      .preload('sessions', (builder) => {
        builder.where('is_active', true).limit(1)
      })
      .paginate(page, perPage)

    // Add computed fields
    const usersData = users.serialize()
    usersData.data = await Promise.all(
      usersData.data.map(async (user: any) => {
        const minigameCount = await MinigameAnswer.query()
          .where('user_id', user.id)
          .where('is_correct', true)
          .count('* as total')

        return {
          ...user,
          solvedMinigames: minigameCount[0].$extras.total || 0,
          hasActiveSession: user.sessions?.length > 0,
        }
      })
    )

    return response.ok({
      success: true,
      ...usersData,
    })
  }

  /**
   * Get detailed user profile
   */
  async show({ params, response }: HttpContext) {
    const user = await User.query()
      .where('id', params.id)
      .preload('playerProgress')
      .preload('sessions', (builder) => {
        builder.orderBy('created_at', 'desc').limit(10)
      })
      .preload('pageVisits', (builder) => {
        builder.orderBy('created_at', 'desc').limit(20)
      })
      .firstOrFail()

    // Get minigame progress
    const minigameAnswers = await MinigameAnswer.query()
      .where('user_id', user.id)
      .preload('game')
      .orderBy('created_at', 'desc')

    // Get QR access logs
    const qrAccesses = await QrAccessLog.query()
      .where('user_id', user.id)
      .preload('qrToken')
      .orderBy('accessed_at', 'desc')
      .limit(50)

    // Compute statistics
    const stats = {
      totalVisits: await PageVisit.query().where('user_id', user.id).count('* as total'),
      totalSessions: await UserSession.query().where('user_id', user.id).count('* as total'),
      solvedMinigames: await MinigameAnswer.query()
        .where('user_id', user.id)
        .where('is_correct', true)
        .count('* as total'),
      qrAccessCount: await QrAccessLog.query()
        .where('user_id', user.id)
        .where('access_status', 'granted')
        .count('* as total'),
    }

    return response.ok({
      success: true,
      user: user.serialize(),
      minigameAnswers: minigameAnswers.map((a) => a.serialize()),
      qrAccesses: qrAccesses.map((a) => a.serialize()),
      stats: {
        totalVisits: stats.totalVisits[0].$extras.total || 0,
        totalSessions: stats.totalSessions[0].$extras.total || 0,
        solvedMinigames: stats.solvedMinigames[0].$extras.total || 0,
        qrAccessCount: stats.qrAccessCount[0].$extras.total || 0,
      },
    })
  }

  /**
   * Create a new user
   */
  async store({ request, response }: HttpContext) {
    const createSchema = vine.object({
      fullName: vine.string().trim(),
      email: vine.string().email().optional(),
      phoneNumber: vine.string().optional(),
      password: vine.string().minLength(6).optional(),
      isApproved: vine.boolean().optional(),
      isBlocked: vine.boolean().optional(),
    })

    const data = await vine.validate({ schema: createSchema, data: request.all() })

    const user = await User.create({
      fullName: data.fullName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      password: data.password,
      isApproved: data.isApproved ?? false,
      isBlocked: data.isBlocked ?? false,
    })

    logger.success(`User ${user.id} created by admin`, { context: 'AdminUsers' })

    return response.created({
      success: true,
      user: user.serialize(),
    })
  }

  /**
   * Update user details
   */
  async update({ params, request, response }: HttpContext) {
    const updateSchema = vine.object({
      fullName: vine.string().trim().optional(),
      email: vine.string().email().optional(),
      phoneNumber: vine.string().optional(),
      password: vine.string().minLength(6).optional(),
      isApproved: vine.boolean().optional(),
      isBlocked: vine.boolean().optional(),
    })

    const data = await vine.validate({ schema: updateSchema, data: request.all() })
    const user = await User.findOrFail(params.id)

    if (data.fullName !== undefined) user.fullName = data.fullName
    if (data.email !== undefined) user.email = data.email
    if (data.phoneNumber !== undefined) user.phoneNumber = data.phoneNumber
    if (data.password !== undefined) user.password = data.password
    if (data.isApproved !== undefined) user.isApproved = data.isApproved
    if (data.isBlocked !== undefined) user.isBlocked = data.isBlocked

    await user.save()

    logger.success(`User ${user.id} updated by admin`, { context: 'AdminUsers' })

    return response.ok({
      success: true,
      user: user.serialize(),
    })
  }

  /**
   * Delete a user
   */
  async destroy({ params, response }: HttpContext) {
    const user = await User.findOrFail(params.id)
    await user.delete()

    logger.warning(`User ${params.id} deleted by admin`, { context: 'AdminUsers' })

    return response.ok({
      success: true,
      message: 'User deleted successfully',
    })
  }

  /**
   * Approve/confirm a user
   */
  async approve({ params, response }: HttpContext) {
    const user = await User.findOrFail(params.id)
    user.isApproved = true
    await user.save()

    logger.success(`User ${user.id} approved`, { context: 'AdminUsers' })

    return response.ok({
      success: true,
      user: user.serialize(),
    })
  }

  /**
   * Block a user
   */
  async block({ params, response }: HttpContext) {
    const user = await User.findOrFail(params.id)
    user.isBlocked = true
    await user.save()

    logger.warning(`User ${user.id} blocked`, { context: 'AdminUsers' })

    return response.ok({
      success: true,
      user: user.serialize(),
    })
  }

  /**
   * Unblock a user
   */
  async unblock({ params, response }: HttpContext) {
    const user = await User.findOrFail(params.id)
    user.isBlocked = false
    await user.save()

    logger.success(`User ${user.id} unblocked`, { context: 'AdminUsers' })

    return response.ok({
      success: true,
      user: user.serialize(),
    })
  }

  /**
   * Get user's minigame progress
   */
  async minigameProgress({ params, request, response }: HttpContext) {
    const page = request.input('page', 1)
    const perPage = request.input('perPage', 20)

    const answers = await MinigameAnswer.query()
      .where('user_id', params.id)
      .preload('game')
      .orderBy('created_at', 'desc')
      .paginate(page, perPage)

    return response.ok({
      success: true,
      ...answers.serialize(),
    })
  }

  /**
   * Get user's sessions
   */
  async sessions({ params, request, response }: HttpContext) {
    const page = request.input('page', 1)
    const perPage = request.input('perPage', 20)

    const sessions = await UserSession.query()
      .where('user_id', params.id)
      .orderBy('created_at', 'desc')
      .paginate(page, perPage)

    return response.ok({
      success: true,
      ...sessions.serialize(),
    })
  }

  /**
   * Get user's page visits
   */
  async visits({ params, request, response }: HttpContext) {
    const page = request.input('page', 1)
    const perPage = request.input('perPage', 20)

    const visits = await PageVisit.query()
      .where('user_id', params.id)
      .orderBy('created_at', 'desc')
      .paginate(page, perPage)

    return response.ok({
      success: true,
      ...visits.serialize(),
    })
  }

  /**
   * Get user's QR access logs
   */
  async qrAccess({ params, request, response }: HttpContext) {
    const page = request.input('page', 1)
    const perPage = request.input('perPage', 20)

    const logs = await QrAccessLog.query()
      .where('user_id', params.id)
      .preload('qrToken')
      .orderBy('accessed_at', 'desc')
      .paginate(page, perPage)

    return response.ok({
      success: true,
      ...logs.serialize(),
    })
  }

  /**
   * Bulk operations
   */
  async bulk({ request, response }: HttpContext) {
    const bulkSchema = vine.object({
      action: vine.enum(['approve', 'block', 'unblock', 'delete']),
      userIds: vine.array(vine.number()),
    })

    const data = await vine.validate({ schema: bulkSchema, data: request.all() })

    const users = await User.query().whereIn('id', data.userIds)

    for (const user of users) {
      switch (data.action) {
        case 'approve':
          user.isApproved = true
          break
        case 'block':
          user.isBlocked = true
          break
        case 'unblock':
          user.isBlocked = false
          break
        case 'delete':
          await user.delete()
          continue
      }
      await user.save()
    }

    logger.success(`Bulk ${data.action} performed on ${data.userIds.length} users`, {
      context: 'AdminUsers',
    })

    return response.ok({
      success: true,
      message: `${data.action} performed on ${data.userIds.length} users`,
    })
  }
}
