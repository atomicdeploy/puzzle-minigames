import type { HttpContext } from '@adonisjs/core/http'
import CaptchaService from '#services/captcha_service'
import vine from '@vinejs/vine'

/**
 * Controller for CAPTCHA generation and verification
 */
export default class CaptchaController {
  private captchaService = new CaptchaService()

  /**
   * Generate a new CAPTCHA
   * Stores the code in the session for later verification
   */
  async generate({ session, response }: HttpContext) {
    try {
      // Generate CAPTCHA
      const captcha = await this.captchaService.generate({
        width: 400,
        height: 150,
        length: 6,
      })

      // Store code in session (not sent to client)
      session.put('captcha_code', captcha.code)
      session.put('captcha_generated_at', Date.now())

      // Return only the image
      return response.ok({
        success: true,
        image: captcha.image,
        width: captcha.width,
        height: captcha.height,
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        error: 'Failed to generate CAPTCHA',
      })
    }
  }

  /**
   * Verify a CAPTCHA response
   */
  async verify({ request, session, response }: HttpContext) {
    const verifySchema = vine.object({
      captcha: vine.string().minLength(4).maxLength(8),
    })

    try {
      const { captcha: userInput } = await vine.validate({
        schema: verifySchema,
        data: request.all(),
      })

      // Get stored code from session
      const storedCode = session.get('captcha_code')
      const generatedAt = session.get('captcha_generated_at')

      // Check if CAPTCHA exists
      if (!storedCode) {
        return response.badRequest({
          success: false,
          error: 'No CAPTCHA found. Please generate a new one.',
        })
      }

      // Check if CAPTCHA has expired (5 minutes)
      const expiryTime = 5 * 60 * 1000 // 5 minutes in milliseconds
      if (generatedAt && Date.now() - generatedAt > expiryTime) {
        session.forget('captcha_code')
        session.forget('captcha_generated_at')
        return response.badRequest({
          success: false,
          error: 'CAPTCHA has expired. Please generate a new one.',
        })
      }

      // Verify the CAPTCHA
      const isValid = this.captchaService.verify(storedCode, userInput)

      // Clear the CAPTCHA from session (one-time use)
      session.forget('captcha_code')
      session.forget('captcha_generated_at')

      if (isValid) {
        return response.ok({
          success: true,
          message: 'CAPTCHA verified successfully',
        })
      } else {
        return response.badRequest({
          success: false,
          error: 'Invalid CAPTCHA. Please try again.',
        })
      }
    } catch (error) {
      return response.badRequest({
        success: false,
        error: 'Invalid request',
      })
    }
  }

  /**
   * Refresh CAPTCHA (generate new one)
   */
  async refresh({ session, response }: HttpContext) {
    // Clear old CAPTCHA
    session.forget('captcha_code')
    session.forget('captcha_generated_at')

    // Generate new one
    return this.generate({ session, response } as HttpContext)
  }
}
