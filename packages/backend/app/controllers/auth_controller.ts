import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Otp from '#models/otp'
import SmsService from '#services/sms_service'
import rateLimiter from '#services/rate_limiter'
import { DateTime } from 'luxon'
import { randomBytes } from 'crypto'
import vine from '@vinejs/vine'

export default class AuthController {
  private smsService = new SmsService()

  /**
   * Register a new user
   */
  async register({ request, response, auth }: HttpContext) {
    const registerSchema = vine.object({
      email: vine.string().email(),
      password: vine.string().minLength(8),
      fullName: vine.string().optional(),
      phoneNumber: vine.string().optional(),
    })

    const data = await vine.validate({ schema: registerSchema, data: request.all() })

    // Check if user already exists
    const existingUser = await User.findBy('email', data.email)
    if (existingUser) {
      return response.conflict({ error: 'Email already registered' })
    }

    // Create user
    const user = await User.create({
      email: data.email,
      password: data.password,
      fullName: data.fullName,
      phoneNumber: data.phoneNumber,
      isPhoneVerified: false,
      isEmailVerified: false,
    })

    // Log the user in
    await auth.use('web').login(user)

    return response.created({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
      },
    })
  }

  /**
   * Login user
   * Rate limiting: 10 failed attempts per email per hour
   */
  async login({ request, response, auth }: HttpContext) {
    const loginSchema = vine.object({
      email: vine.string().email(),
      password: vine.string(),
    })

    const { email, password } = await vine.validate({ schema: loginSchema, data: request.all() })

    // Rate limiting: 10 attempts per hour per email
    const rateLimitKey = `login:${email}`
    if (rateLimiter.isRateLimited(rateLimitKey, 10, 60 * 60 * 1000)) {
      const timeUntilReset = rateLimiter.getTimeUntilReset(rateLimitKey)
      return response.tooManyRequests({
        error: 'Too many login attempts',
        message: `Please try again in ${Math.ceil(timeUntilReset / 60)} minutes`,
        retryAfter: timeUntilReset,
      })
    }

    try {
      const user = await User.verifyCredentials(email, password)
      await auth.use('web').login(user)

      // Clear rate limit on successful login
      rateLimiter.clear(rateLimitKey)

      // Update last login
      user.lastLoginAt = DateTime.now()
      await user.save()

      return response.ok({
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          phoneNumber: user.phoneNumber,
        },
      })
    } catch {
      return response.unauthorized({ error: 'Invalid credentials' })
    }
  }

  /**
   * Logout user
   */
  async logout({ response, auth }: HttpContext) {
    await auth.use('web').logout()
    return response.ok({ success: true, message: 'Logged out successfully' })
  }

  /**
   * Send OTP to phone number
   * Rate limiting: 5 OTP requests per phone number per hour
   */
  async sendOtp({ request, response }: HttpContext) {
    const otpSchema = vine.object({
      phoneNumber: vine.string().regex(/^(\+98|0)?9\d{9}$/),
    })

    const { phoneNumber } = await vine.validate({ schema: otpSchema, data: request.all() })

    // Normalize phone number
    const normalizedPhone = phoneNumber.replace(/^(\+98|0)/, '0')

    // Rate limiting: 5 OTP requests per hour per phone
    const rateLimitKey = `otp:send:${normalizedPhone}`
    if (rateLimiter.isRateLimited(rateLimitKey, 5, 60 * 60 * 1000)) {
      const timeUntilReset = rateLimiter.getTimeUntilReset(rateLimitKey)
      return response.tooManyRequests({
        error: 'Too many OTP requests',
        message: `Please try again in ${Math.ceil(timeUntilReset / 60)} minutes`,
        retryAfter: timeUntilReset,
      })
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    // Create OTP record
    await Otp.create({
      phoneNumber: normalizedPhone,
      code,
      isUsed: false,
      expiresAt: DateTime.now().plus({ minutes: 5 }),
    })

    // Send SMS
    const result = await this.smsService.sendOtp(normalizedPhone, code)

    if (result.success) {
      return response.ok({
        success: true,
        message: 'OTP sent successfully',
        expiresIn: 300, // 5 minutes in seconds
      })
    } else {
      return response.badRequest({
        success: false,
        error: 'Failed to send OTP',
        details: result.error,
      })
    }
  }

  /**
   * Verify OTP
   * Rate limiting: 5 failed attempts per phone number per OTP session
   */
  async verifyOtp({ request, response, auth }: HttpContext) {
    const verifySchema = vine.object({
      phoneNumber: vine.string(),
      code: vine.string().fixedLength(6),
    })

    const { phoneNumber, code } = await vine.validate({ schema: verifySchema, data: request.all() })

    // Normalize phone number
    const normalizedPhone = phoneNumber.replace(/^(\+98|0)/, '0')

    // Rate limiting: 5 failed attempts per 15 minutes per phone
    const rateLimitKey = `otp:verify:${normalizedPhone}`
    if (rateLimiter.isRateLimited(rateLimitKey, 5, 15 * 60 * 1000)) {
      const timeUntilReset = rateLimiter.getTimeUntilReset(rateLimitKey)
      return response.tooManyRequests({
        error: 'Too many verification attempts',
        message: `Please try again in ${Math.ceil(timeUntilReset / 60)} minutes`,
        retryAfter: timeUntilReset,
      })
    }

    // Find valid OTP
    const otp = await Otp.query()
      .where('phone_number', normalizedPhone)
      .where('code', code)
      .where('is_used', false)
      .where('expires_at', '>', DateTime.now().toSQL())
      .first()

    if (!otp) {
      return response.badRequest({ error: 'Invalid or expired OTP' })
    }

    // Mark OTP as used
    otp.isUsed = true
    await otp.save()

    // Clear rate limit on successful verification
    rateLimiter.clear(rateLimitKey)

    // Find or create user with this phone number
    let user = await User.findBy('phone_number', normalizedPhone)
    
    if (!user) {
      // Create a new user with phone number
      // Use phone number as username part in email for uniqueness
      const emailUsername = normalizedPhone.replace(/\D/g, '')
      user = await User.create({
        email: `${emailUsername}@phone.user`,
        phoneNumber: normalizedPhone,
        password: randomBytes(32).toString('hex'), // Random password
        isPhoneVerified: true,
      })
    } else {
      // Mark phone as verified
      user.isPhoneVerified = true
      await user.save()
    }

    // Log the user in
    await auth.use('web').login(user)

    return response.ok({
      success: true,
      message: 'OTP verified successfully',
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        isPhoneVerified: user.isPhoneVerified,
      },
    })
  }
}
