import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import User from '#models/user'
import PlayerProgress from '#models/player_progress'
import AnswerSubmission from '#models/answer_submission'
import PageVisit from '#models/page_visit'

export default class Stats extends BaseCommand {
  static commandName = 'stats:show'
  static description = 'Show application statistics'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    this.logger.info('📊 Application Statistics\n')

    // User statistics
    const totalUsers = await User.query().count('* as total')
    const verifiedUsers = await User.query().where('is_phone_verified', true).count('* as total')
    const recentUsers = await User.query()
      .where('created_at', '>', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .count('* as total')

    this.logger.info('👥 Users:')
    this.logger.info(`  Total: ${totalUsers[0].$extras.total}`)
    this.logger.info(`  Verified: ${verifiedUsers[0].$extras.total}`)
    this.logger.info(`  New (last 7 days): ${recentUsers[0].$extras.total}\n`)

    // Progress statistics
    const totalProgress = await PlayerProgress.query().count('* as total')
    const avgScore = await PlayerProgress.query().avg('score as avg')
    const topPlayer = await PlayerProgress.query()
      .preload('user')
      .orderBy('score', 'desc')
      .first()

    this.logger.info('🎮 Game Progress:')
    this.logger.info(`  Total players: ${totalProgress[0].$extras.total}`)
    this.logger.info(`  Average score: ${Math.round(avgScore[0].$extras.avg || 0)}`)
    if (topPlayer) {
      this.logger.info(`  Top player: ${topPlayer.user.email} (Score: ${topPlayer.score})\n`)
    } else {
      this.logger.info(`  Top player: None\n`)
    }

    // Answer submissions
    const totalSubmissions = await AnswerSubmission.query().count('* as total')
    const correctSubmissions = await AnswerSubmission.query()
      .where('is_correct', true)
      .count('* as total')
    const pendingSubmissions = await AnswerSubmission.query()
      .where('verification_status', 'pending')
      .count('* as total')

    this.logger.info('✅ Answer Submissions:')
    this.logger.info(`  Total: ${totalSubmissions[0].$extras.total}`)
    this.logger.info(`  Correct: ${correctSubmissions[0].$extras.total}`)
    this.logger.info(`  Pending verification: ${pendingSubmissions[0].$extras.total}\n`)

    // Page visits
    const totalVisits = await PageVisit.query().count('* as total')
    const recentVisits = await PageVisit.query()
      .where('created_at', '>', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .count('* as total')

    this.logger.info('📈 Page Visits:')
    this.logger.info(`  Total: ${totalVisits[0].$extras.total}`)
    this.logger.info(`  Last 24 hours: ${recentVisits[0].$extras.total}`)
  }
}
