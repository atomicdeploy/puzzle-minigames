import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import SmsService from '#services/sms_service'

export default class SmsTest extends BaseCommand {
  static commandName = 'sms:test'
  static description = 'Test SMS service integration'

  static options: CommandOptions = {
    startApp: true,
  }

  @flags.string({ description: 'Phone number to send test SMS' })
  declare phone: string

  async run() {
    const smsService = new SmsService()

    this.logger.info('🔍 Testing Melipayamak SMS Service\n')

    // Check credit
    this.logger.info('Checking account credit...')
    const credit = await smsService.getCredit()
    this.logger.info(`Account Credit: ${credit} Rials\n`)

    if (!this.phone) {
      this.logger.info('Use --phone flag to send a test SMS')
      return
    }

    // Validate phone number format
    if (!this.phone.match(/^(\+98|0)?9\d{9}$/)) {
      this.logger.error('Invalid phone number format. Expected: 09xxxxxxxxx')
      return
    }

    const confirmed = await this.prompt.confirm(
      `Send test SMS to ${this.phone}?`
    )

    if (!confirmed) {
      this.logger.info('Cancelled')
      return
    }

    this.logger.info('Sending test SMS...')
    const result = await smsService.sendMessage(
      this.phone,
      'این یک پیام آزمایشی از سیستم اینفرنال است.\nاگر این پیام را دریافت کردید، سرویس SMS به درستی کار می‌کند.'
    )

    if (result.success) {
      this.logger.success('SMS sent successfully!')
      this.logger.info(`Message ID: ${result.messageId}`)
    } else {
      this.logger.error('Failed to send SMS')
      this.logger.error(`Error: ${result.error}`)
    }
  }
}
