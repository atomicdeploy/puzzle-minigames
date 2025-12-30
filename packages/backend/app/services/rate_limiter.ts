/**
 * Simple in-memory rate limiter for authentication endpoints
 * 
 * In production, this should be replaced with a Redis-based solution
 * for distributed rate limiting across multiple server instances.
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

class RateLimiter {
  private storage: Map<string, RateLimitEntry> = new Map()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000)
  }

  /**
   * Check if a key has exceeded the rate limit
   * @param key - Unique identifier (e.g., email, phone, IP)
   * @param maxAttempts - Maximum allowed attempts
   * @param windowMs - Time window in milliseconds
   * @returns true if rate limit exceeded, false otherwise
   */
  isRateLimited(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now()
    const entry = this.storage.get(key)

    if (!entry || now > entry.resetTime) {
      // No entry or window expired, create new entry
      this.storage.set(key, {
        count: 1,
        resetTime: now + windowMs,
      })
      return false
    }

    // Increment count
    entry.count++

    // Check if limit exceeded
    if (entry.count > maxAttempts) {
      return true
    }

    return false
  }

  /**
   * Get remaining attempts for a key
   */
  getRemainingAttempts(key: string, maxAttempts: number): number {
    const entry = this.storage.get(key)
    if (!entry || Date.now() > entry.resetTime) {
      return maxAttempts
    }
    return Math.max(0, maxAttempts - entry.count)
  }

  /**
   * Get time until reset in seconds
   */
  getTimeUntilReset(key: string): number {
    const entry = this.storage.get(key)
    if (!entry || Date.now() > entry.resetTime) {
      return 0
    }
    return Math.ceil((entry.resetTime - Date.now()) / 1000)
  }

  /**
   * Clear rate limit for a key (e.g., after successful authentication)
   */
  clear(key: string): void {
    this.storage.delete(key)
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.storage.entries()) {
      if (now > entry.resetTime) {
        this.storage.delete(key)
      }
    }
  }

  /**
   * Destroy the rate limiter and cleanup interval
   */
  destroy(): void {
    clearInterval(this.cleanupInterval)
    this.storage.clear()
  }
}

// Export singleton instance
export default new RateLimiter()
