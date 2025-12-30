import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import MinigameAnswer from '#models/minigame_answer'

export default class ListAnswers extends BaseCommand {
  static commandName = 'answer:list'
  static description = 'List configured minigame answers'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const answers = await MinigameAnswer.query().orderBy('minigame_name', 'asc')

    if (answers.length === 0) {
      this.logger.warning('No answers configured. Run db:seed to populate initial data.')
      return
    }

    this.logger.info('\n🎮 Configured Minigame Answers:\n')

    let currentGame = ''
    answers.forEach((answer) => {
      if (currentGame !== answer.minigameName) {
        currentGame = answer.minigameName
        this.logger.info(`\n📌 ${currentGame.toUpperCase()}:`)
      }

      const status = answer.isActive ? '✅' : '❌'
      const verification = answer.requiresAdminVerification ? '🔒 Admin Verification' : '⚡ Instant'
      
      this.logger.info(`  ${status} ${answer.answerKey}`)
      this.logger.info(`     Answer: ${answer.answerValue}`)
      this.logger.info(`     Type: ${verification}`)
    })

    this.logger.info('\n')
  }
}
