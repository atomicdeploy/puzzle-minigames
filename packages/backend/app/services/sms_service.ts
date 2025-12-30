import env from '#start/env'
import httpClient from '#services/http_client'

/**
 * SMS Service for sending OTPs via Mellipayamak
 * Uses pattern-based SMS API with proper HTTP client
 */
export default class SmsService {
  private endpoint: string
  private username: string
  private password: string
  private patternCode: string

  constructor() {
    this.endpoint = env.get('MELLIPAYAMAK_ENDPOINT', 'rest.payamak-panel.com')
    this.username = env.get('MELLIPAYAMAK_USERNAME', '')
    this.password = env.get('MELLIPAYAMAK_PASSWORD', '')
    this.patternCode = env.get('MELLIPAYAMAK_PATTERN_CODE', '413580')

    if (!this.username || !this.password) {
      console.warn('⚠️  Mellipayamak credentials not configured. OTP sending will fail.')
    }
  }

  /**
   * Send OTP SMS using pattern-based API
   * This uses the BaseServiceNumber endpoint which works with pattern codes
   */
  async sendOtp(phoneNumber: string, code: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!this.username || !this.password) {
        console.warn('Mellipayamak SMS service not configured. OTP send attempted.')
        return { success: false, error: 'SMS service not configured' }
      }

      // Clean phone number (remove any non-digit characters)
      const cleanPhone = phoneNumber.replace(/\D/g, '')

      console.log(`📤 Sending OTP to ${cleanPhone} via Mellipayamak (pattern: ${this.patternCode})`)

      // Prepare request body for pattern-based SMS
      const requestBody = JSON.stringify({
        username: this.username,
        password: this.password,
        to: cleanPhone,
        bodyId: parseInt(this.patternCode),
        text: code
      })

      // Make request using unified HTTP client
      const url = `https://${this.endpoint}/api/SendSMS/BaseServiceNumber`
      const response = await httpClient.post(url, requestBody)

      console.log(`📊 Response status: ${response.statusCode}`)

      // Parse response
      const data = JSON.parse(response.body)
      console.log(`📊 Response:`, data)

      // Mellipayamak returns RetStatus: 1 for success
      if ((response.statusCode === 200 || response.statusCode === 201) && data.RetStatus === 1) {
        console.log('✅ OTP sent successfully via Mellipayamak', data)
        return { success: true, messageId: data.Value }
      } else {
        console.error('❌ Mellipayamak API error:', data)
        return { success: false, error: data.StrRetStatus || 'Failed to send SMS' }
      }
    } catch (error) {
      console.error('Error sending OTP SMS:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Send a custom SMS message (for future use)
   */
  async sendMessage(phoneNumber: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!this.username || !this.password) {
        console.warn('Mellipayamak SMS service not configured')
        return { success: false, error: 'SMS service not configured' }
      }

      const cleanPhone = phoneNumber.replace(/\D/g, '')

      // For custom messages, you might use a different endpoint
      // This is a placeholder implementation
      const requestBody = JSON.stringify({
        username: this.username,
        password: this.password,
        to: cleanPhone,
        bodyId: parseInt(this.patternCode),
        text: message
      })

      const url = `https://${this.endpoint}/api/SendSMS/BaseServiceNumber`
      const response = await httpClient.post(url, requestBody)

      const data = JSON.parse(response.body)

      if ((response.statusCode === 200 || response.statusCode === 201) && data.RetStatus === 1) {
        return { success: true, messageId: data.Value }
      } else {
        return { success: false, error: data.StrRetStatus || 'Failed to send SMS' }
      }
    } catch (error) {
      console.error('Error sending SMS:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Get account credit (if needed in the future)
   */
  async getCredit(): Promise<number> {
    // Not implemented with pattern-based API
    // Would need a different endpoint
    return 0
  }
}
