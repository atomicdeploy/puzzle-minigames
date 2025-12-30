import { BaseCommand, args, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import AnswerSubmission from '#models/answer_submission'
import { DateTime } from 'luxon'

export default class VerifyAnswer extends BaseCommand {
  static commandName = 'answer:verify'
  static description = 'Verify pending answer submissions'

  static options: CommandOptions = {
    startApp: true,
  }

  @args.number({ description: 'Submission ID to verify', required: false })
  declare submissionId: number

  @flags.boolean({ description: 'List all pending submissions' })
  declare list: boolean

  async run() {
    if (this.list) {
      await this.listPending()
      return
    }

    if (!this.submissionId) {
      this.logger.error('Please provide a submission ID or use --list flag')
      return
    }

    const submission = await AnswerSubmission.query()
      .where('id', this.submissionId)
      .preload('user')
      .first()

    if (!submission) {
      this.logger.error('Submission not found')
      return
    }

    this.logger.info('\n📝 Submission Details:')
    this.logger.info(`  ID: ${submission.id}`)
    this.logger.info(`  User: ${submission.user.email}`)
    this.logger.info(`  Minigame: ${submission.minigameName}`)
    this.logger.info(`  Answer: ${submission.submittedAnswer}`)
    this.logger.info(`  Status: ${submission.verificationStatus}`)
    this.logger.info(`  Submitted: ${submission.createdAt.toLocaleString()}\n`)

    const action = await this.prompt.choice('Action to take', [
      { name: 'approve', message: 'Approve as correct' },
      { name: 'reject', message: 'Reject as incorrect' },
      { name: 'cancel', message: 'Cancel' },
    ])

    if (action === 'cancel') {
      this.logger.info('Cancelled')
      return
    }

    submission.verificationStatus = action === 'approve' ? 'approved' : 'rejected'
    submission.isCorrect = action === 'approve'
    submission.verifiedBy = 1 // TODO: Get admin user ID
    submission.verifiedAt = DateTime.now()
    await submission.save()

    this.logger.success(`Submission ${action === 'approve' ? 'approved' : 'rejected'}!`)
  }

  private async listPending() {
    const pending = await AnswerSubmission.query()
      .where('verification_status', 'pending')
      .preload('user')
      .orderBy('created_at', 'desc')
      .limit(20)

    if (pending.length === 0) {
      this.logger.info('No pending submissions')
      return
    }

    this.logger.info(`\n📋 Pending Answer Submissions (${pending.length}):\n`)
    
    pending.forEach((submission) => {
      this.logger.info(`ID: ${submission.id}`)
      this.logger.info(`  User: ${submission.user.email}`)
      this.logger.info(`  Game: ${submission.minigameName}`)
      this.logger.info(`  Answer: ${submission.submittedAnswer}`)
      this.logger.info(`  Time: ${submission.createdAt.toRelative()}\n`)
    })
  }
}
