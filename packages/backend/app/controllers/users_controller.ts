import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import PageVisit from '#models/page_visit'

export default class UsersController {
  /**
   * Get current user profile
   */
  async profile({ auth, response }: HttpContext) {
    const user = auth.user!

    return response.ok({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        isPhoneVerified: user.isPhoneVerified,
        isEmailVerified: user.isEmailVerified,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      },
    })
  }

  /**
   * Update user profile
   */
  async updateProfile({ request, response, auth }: HttpContext) {
    const user = auth.user!

    const data = request.only(['fullName', 'email'])

    if (data.fullName) {
      user.fullName = data.fullName
    }

    if (data.email && data.email !== user.email) {
      // Check if email is already taken
      const existing = await User.findBy('email', data.email)
      if (existing) {
        return response.conflict({ error: 'Email already taken' })
      }
      user.email = data.email
      user.isEmailVerified = false
    }

    await user.save()

    return response.ok({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      },
    })
  }

  /**
   * Get user's page visits
   */
  async visits({ auth, response, request }: HttpContext) {
    const user = auth.user!
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)

    const visits = await PageVisit.query()
      .where('user_id', user.id)
      .orderBy('created_at', 'desc')
      .paginate(page, limit)

    return response.ok({
      success: true,
      visits: visits.serialize(),
    })
  }
}
