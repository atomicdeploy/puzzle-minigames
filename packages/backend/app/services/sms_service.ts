import env from '#start/env'
import melipayamak from 'melipayamak'

export default class SmsService {
  private api: any

  constructor() {
    const username = env.get('MELIPAYAMAK_USERNAME')
    const password = env.get('MELIPAYAMAK_PASSWORD')

    if (username && password) {
      this.api = new melipayamak(username, password)
    }
  }

  /**
   * Send OTP SMS to a phone number
   */
  async sendOtp(phoneNumber: string, code: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!this.api) {
        console.warn('Melipayamak SMS service not configured. OTP code:', code)
        return { success: false, error: 'SMS service not configured' }
      }

      const sms = this.api.sms()
      const message = `کد تایید شما: ${code}\nاینفرنال - بازی پازل`

      // Send SMS
      const response = await sms.send(phoneNumber, '50004001400140', message)

      if (response && response.RetStatus === 1) {
        return { success: true, messageId: response.Value }
      } else {
        return { success: false, error: response?.StrRetStatus || 'Failed to send SMS' }
      }
    } catch (error) {
      console.error('Error sending OTP SMS:', error)
      return { success: false, error: error.message || 'Unknown error' }
    }
  }

  /**
   * Send a custom SMS message
   */
  async sendMessage(phoneNumber: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!this.api) {
        console.warn('Melipayamak SMS service not configured')
        return { success: false, error: 'SMS service not configured' }
      }

      const sms = this.api.sms()
      const response = await sms.send(phoneNumber, '50004001400140', message)

      if (response && response.RetStatus === 1) {
        return { success: true, messageId: response.Value }
      } else {
        return { success: false, error: response?.StrRetStatus || 'Failed to send SMS' }
      }
    } catch (error) {
      console.error('Error sending SMS:', error)
      return { success: false, error: error.message || 'Unknown error' }
    }
  }

  /**
   * Get account credit
   */
  async getCredit(): Promise<number> {
    try {
      if (!this.api) {
        return 0
      }

      const sms = this.api.sms()
      const response = await sms.getCredit()

      return response?.Value || 0
    } catch (error) {
      console.error('Error getting SMS credit:', error)
      return 0
    }
  }
}
