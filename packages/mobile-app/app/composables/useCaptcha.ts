import { ref } from 'vue'

/**
 * Composable for CAPTCHA verification
 * Provides a clean interface to verify CAPTCHA with the backend
 */
export function useCaptcha(apiBaseUrl: string = '/api/captcha') {
  const isVerifying = ref(false)
  const verificationError = ref<string>('')
  const isVerified = ref(false)

  /**
   * Verify CAPTCHA with backend
   */
  async function verifyCaptcha(captchaCode: string): Promise<boolean> {
    if (!captchaCode || captchaCode.trim().length === 0) {
      verificationError.value = 'لطفاً کد کپچا را وارد کنید'
      return false
    }

    isVerifying.value = true
    verificationError.value = ''

    try {
      const response = await fetch(`${apiBaseUrl}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include session cookies
        body: JSON.stringify({
          captcha: captchaCode,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        isVerified.value = true
        return true
      } else {
        verificationError.value = data.error || 'کد کپچا اشتباه است'
        isVerified.value = false
        return false
      }
    } catch (error) {
      verificationError.value = 'خطا در تأیید کپچا'
      isVerified.value = false
      console.error('Error verifying CAPTCHA:', error)
      return false
    } finally {
      isVerifying.value = false
    }
  }

  /**
   * Reset verification state
   */
  function reset() {
    isVerifying.value = false
    verificationError.value = ''
    isVerified.value = false
  }

  return {
    isVerifying,
    verificationError,
    isVerified,
    verifyCaptcha,
    reset,
  }
}
