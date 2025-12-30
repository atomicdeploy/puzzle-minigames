/**
 * Mellipayamak SMS Service
 * Handles OTP sending via Mellipayamak API
 */

import https from 'https';

class MellipayamakService {
  constructor() {
    this.endpoint = process.env.MELLIPAYAMAK_ENDPOINT || 'api.payamak-panel.com';
    this.username = process.env.MELLIPAYAMAK_USERNAME;
    this.password = process.env.MELLIPAYAMAK_PASSWORD; // API key
    this.patternCode = process.env.MELLIPAYAMAK_PATTERN_CODE || '413580';

    if (!this.username || !this.password) {
      console.warn('⚠️  Mellipayamak credentials not configured. OTP sending will fail.');
    }
  }

  /**
   * Send OTP using pattern-based SMS
   * @param {string} phone - Recipient phone number (e.g., '09901212697')
   * @param {string} otp - The OTP code to send
   * @returns {Promise<object>} Response from Mellipayamak API
   */
  async sendOTP(phone, otp) {
    if (!this.username || !this.password) {
      throw new Error('Mellipayamak credentials are not configured');
    }

    // Clean phone number (remove any non-digit characters)
    const cleanPhone = phone.replace(/\D/g, '');

    // Prepare the request body for pattern-based SMS
    const requestBody = JSON.stringify({
      username: this.username,
      password: this.password,
      to: cleanPhone,
      patternCode: this.patternCode,
      inputData: [
        {
          "verification-code": otp
        }
      ]
    });

    console.log(`📤 Sending OTP to ${cleanPhone} via Mellipayamak (pattern: ${this.patternCode})`);

    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.endpoint,
        port: 443,
        path: '/api/v2/send/pattern',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestBody)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            
            if (res.statusCode === 200 || res.statusCode === 201) {
              console.log('✅ OTP sent successfully via Mellipayamak', response);
              resolve({
                success: true,
                response: response,
                provider: 'mellipayamak'
              });
            } else {
              console.error('❌ Mellipayamak API error:', response);
              reject(new Error(`Mellipayamak API error: ${response.message || 'Unknown error'}`));
            }
          } catch (error) {
            console.error('❌ Failed to parse Mellipayamak response:', data);
            reject(new Error('Invalid response from SMS provider'));
          }
        });
      });

      req.on('error', (error) => {
        console.error('❌ Network error calling Mellipayamak API:', error);
        reject(new Error(`Network error: ${error.message}`));
      });

      req.write(requestBody);
      req.end();
    });
  }

  /**
   * Validate phone number format
   * @param {string} phone - Phone number to validate
   * @returns {boolean} True if valid Iranian mobile number
   */
  validatePhoneNumber(phone) {
    // Iranian mobile numbers start with 09 and have 11 digits
    const phoneRegex = /^09\d{9}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Generate a random 6-digit OTP
   * @returns {string} 6-digit OTP code
   */
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}

export default new MellipayamakService();
