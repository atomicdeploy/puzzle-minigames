import type { HttpContext } from '@adonisjs/core/http'
import MinigameAnswer from '#models/minigame_answer'
import AnswerSubmission from '#models/answer_submission'
import vine from '@vinejs/vine'

export default class MinigameAnswersController {
  /**
   * Submit an answer to a minigame
   */
  async submit({ request, response, auth }: HttpContext) {
    const user = auth.user!

    const submitSchema = vine.object({
      minigameName: vine.string(),
      answerKey: vine.string(),
      answer: vine.string(),
    })

    const { minigameName, answerKey, answer } = await vine.validate({
      schema: submitSchema,
      data: request.all(),
    })

    // Find the correct answer
    const correctAnswer = await MinigameAnswer.query()
      .where('minigame_name', minigameName)
      .where('answer_key', answerKey)
      .where('is_active', true)
      .first()

    if (!correctAnswer) {
      return response.notFound({ error: 'Answer configuration not found' })
    }

    // Check if answer is correct (case-insensitive for text, exact for JSON)
    let isCorrect = false
    let normalizedSubmittedAnswer = answer.trim()
    let normalizedCorrectAnswer = correctAnswer.answerValue.trim()

    // Try to parse as JSON if it looks like JSON
    if (normalizedCorrectAnswer.startsWith('{') || normalizedCorrectAnswer.startsWith('[')) {
      try {
        const parsedCorrect = JSON.parse(normalizedCorrectAnswer)
        const parsedSubmitted = JSON.parse(normalizedSubmittedAnswer)
        isCorrect = JSON.stringify(parsedCorrect) === JSON.stringify(parsedSubmitted)
      } catch {
        // If parsing fails, do string comparison
        isCorrect = normalizedSubmittedAnswer.toLowerCase() === normalizedCorrectAnswer.toLowerCase()
      }
    } else {
      // Simple string comparison (case-insensitive)
      isCorrect = normalizedSubmittedAnswer.toLowerCase() === normalizedCorrectAnswer.toLowerCase()
    }

    // Determine verification status
    const verificationStatus = correctAnswer.requiresAdminVerification
      ? 'pending'
      : 'instant'

    // For answers requiring admin verification, do not persist the real correctness yet
    const storedIsCorrect = correctAnswer.requiresAdminVerification ? false : isCorrect

    // Create submission record
    const submission = await AnswerSubmission.create({
      userId: user.id,
      minigameName,
      submittedAnswer: answer,
      isCorrect: storedIsCorrect,
      verificationStatus,
    })

    // Response based on verification requirement
    if (correctAnswer.requiresAdminVerification) {
      return response.ok({
        success: true,
        message: 'Answer submitted for verification',
        status: 'pending',
        requiresVerification: true,
      })
    } else {
      return response.ok({
        success: true,
        message: isCorrect ? 'Correct answer!' : 'Incorrect answer',
        isCorrect,
        status: 'instant',
      })
    }
  }

  /**
   * Get pending submissions (admin only)
   */
  async pending({ response, request, auth }: HttpContext) {
    const user = auth.user!
    
    // Check if user is admin
    if (!user.isAdmin) {
      return response.forbidden({
        error: 'Unauthorized',
        message: 'Only administrators can access pending submissions',
      })
    }

    const page = request.input('page', 1)
    const limit = request.input('limit', 20)

    const pending = await AnswerSubmission.query()
      .where('verification_status', 'pending')
      .preload('user', (query) => {
        query.select('id', 'fullName', 'email', 'phoneNumber')
      })
      .orderBy('created_at', 'desc')
      .paginate(page, limit)

    return response.ok({
      success: true,
      data: pending.serialize(),
    })
  }

  /**
   * Get submission history for current user
   */
  async history({ auth, response, request }: HttpContext) {
    const user = auth.user!
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)
    const minigameName = request.input('minigameName')

    const query = AnswerSubmission.query().where('user_id', user.id)

    if (minigameName) {
      query.where('minigame_name', minigameName)
    }

    const submissions = await query.orderBy('created_at', 'desc').paginate(page, limit)

    return response.ok({
      success: true,
      data: submissions.serialize(),
    })
  }
}
