/**
 * Client information collection utility
 * Extracts comprehensive device, browser, and network information
 */

import useragent from 'useragent'
import type { HttpContext } from '@adonisjs/core/http'

export interface ClientInfo {
  // Network information
  ipAddress: string | null
  realIp: string | null
  forwardedFor: string | null
  
  // User agent details
  userAgent: string | null
  browser: string
  browserVersion: string
  os: string
  osVersion: string
  device: string
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown'
  deviceVendor: string | null
  
  // Screen and hardware
  screenResolution: string | null
  colorDepth: number | null
  pixelRatio: number | null
  touchSupport: boolean
  
  // Browser capabilities
  platform: string | null
  language: string | null
  languages: string[]
  timezone: string | null
  timezoneOffset: number | null
  
  // Connection info
  connectionType: string | null
  
  // Timestamps
  timestamp: Date
}

export interface SocketClientInfo extends ClientInfo {
  socketId: string
  userId: number | null
  sessionToken: string | null
  connectedAt: Date
  lastActivity: Date
}

export class ClientInfoCollector {
  /**
   * Get real IP address from request
   * Checks various headers used by proxies and load balancers
   */
  private getRealIp(ctx: HttpContext): string | null {
    const headers = ctx.request.headers()
    
    // Check common headers in order of preference
    const possibleIps = [
      headers['x-real-ip'],
      headers['x-forwarded-for']?.split(',')[0]?.trim(),
      headers['cf-connecting-ip'], // Cloudflare
      headers['x-client-ip'],
      headers['x-cluster-client-ip'],
      ctx.request.ip(),
    ]
    
    return possibleIps.find(ip => ip && ip !== 'undefined') || null
  }

  /**
   * Parse user agent string to extract device/browser/OS info
   */
  private parseUserAgent(userAgentString: string | null) {
    if (!userAgentString) {
      return {
        browser: 'Unknown',
        browserVersion: 'Unknown',
        os: 'Unknown',
        osVersion: 'Unknown',
        device: 'Unknown',
        deviceType: 'unknown' as const,
        deviceVendor: null,
      }
    }

    const agent = useragent.parse(userAgentString)
    
    // Determine device type
    let deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown' = 'unknown'
    const ua = userAgentString.toLowerCase()
    
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobile))/i.test(ua)) {
      deviceType = 'tablet'
    } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgentString)) {
      deviceType = 'mobile'
    } else if (/(Chrome|Firefox|Safari|Opera|Edge|MSIE|Trident)/.test(userAgentString)) {
      deviceType = 'desktop'
    }
    
    // Extract device vendor
    let deviceVendor = null
    if (/iPhone|iPad|iPod/.test(userAgentString)) {
      deviceVendor = 'Apple'
    } else if (/Samsung/.test(userAgentString)) {
      deviceVendor = 'Samsung'
    } else if (/Huawei/.test(userAgentString)) {
      deviceVendor = 'Huawei'
    } else if (/Xiaomi/.test(userAgentString)) {
      deviceVendor = 'Xiaomi'
    }

    return {
      browser: agent.family || 'Unknown',
      browserVersion: agent.toVersion() || 'Unknown',
      os: agent.os.family || 'Unknown',
      osVersion: agent.os.toVersion() || 'Unknown',
      device: agent.device.family || 'Unknown',
      deviceType,
      deviceVendor,
    }
  }

  /**
   * Collect comprehensive client information from HTTP context
   */
  collectFromHttp(ctx: HttpContext, additionalData?: Record<string, any>): ClientInfo {
    const headers = ctx.request.headers()
    const userAgentString = headers['user-agent'] || null
    const agentInfo = this.parseUserAgent(userAgentString)

    return {
      // Network information
      ipAddress: ctx.request.ip(),
      realIp: this.getRealIp(ctx),
      forwardedFor: headers['x-forwarded-for'] || null,
      
      // User agent details
      userAgent: userAgentString,
      ...agentInfo,
      
      // Screen and hardware (from client-sent data)
      screenResolution: additionalData?.screenResolution || null,
      colorDepth: additionalData?.colorDepth || null,
      pixelRatio: additionalData?.pixelRatio || null,
      touchSupport: additionalData?.touchSupport || false,
      
      // Browser capabilities
      platform: additionalData?.platform || null,
      language: headers['accept-language']?.split(',')[0] || null,
      languages: headers['accept-language']?.split(',').map(l => l.trim()) || [],
      timezone: additionalData?.timezone || null,
      timezoneOffset: additionalData?.timezoneOffset || null,
      
      // Connection info
      connectionType: additionalData?.connectionType || null,
      
      // Timestamp
      timestamp: new Date(),
    }
  }

  /**
   * Collect client information from Socket.io handshake
   */
  collectFromSocket(socket: any, additionalData?: Record<string, any>): Omit<SocketClientInfo, 'userId' | 'sessionToken' | 'lastActivity'> {
    const handshake = socket.handshake
    const userAgentString = handshake.headers['user-agent'] || null
    const agentInfo = this.parseUserAgent(userAgentString)
    
    // Get real IP
    const forwardedFor = handshake.headers['x-forwarded-for']
    const realIp = handshake.headers['x-real-ip'] || 
                    (forwardedFor ? forwardedFor.split(',')[0].trim() : null) ||
                    handshake.address

    return {
      // Socket-specific
      socketId: socket.id,
      connectedAt: new Date(),
      
      // Network information
      ipAddress: handshake.address,
      realIp,
      forwardedFor: forwardedFor || null,
      
      // User agent details
      userAgent: userAgentString,
      ...agentInfo,
      
      // Screen and hardware
      screenResolution: additionalData?.screenResolution || null,
      colorDepth: additionalData?.colorDepth || null,
      pixelRatio: additionalData?.pixelRatio || null,
      touchSupport: additionalData?.touchSupport || false,
      
      // Browser capabilities
      platform: additionalData?.platform || null,
      language: handshake.headers['accept-language']?.split(',')[0] || null,
      languages: handshake.headers['accept-language']?.split(',').map(l => l.trim()) || [],
      timezone: additionalData?.timezone || null,
      timezoneOffset: additionalData?.timezoneOffset || null,
      
      // Connection info
      connectionType: additionalData?.connectionType || null,
      
      // Timestamp
      timestamp: new Date(),
    }
  }

  /**
   * Format client info for display
   */
  formatForDisplay(info: ClientInfo | SocketClientInfo): string {
    const parts = [
      `🌐 IP: ${info.realIp || info.ipAddress || 'Unknown'}`,
      `💻 Device: ${info.deviceType} (${info.deviceVendor || info.device})`,
      `🔍 Browser: ${info.browser} ${info.browserVersion}`,
      `⚙️ OS: ${info.os} ${info.osVersion}`,
    ]
    
    if (info.screenResolution) {
      parts.push(`📺 Screen: ${info.screenResolution}`)
    }
    
    if ('socketId' in info) {
      parts.push(`🔌 Socket: ${info.socketId}`)
    }
    
    return parts.join(' | ')
  }

  /**
   * Convert client info to JSON-safe object for storage
   */
  toJSON(info: ClientInfo | SocketClientInfo): string {
    return JSON.stringify({
      ...info,
      timestamp: info.timestamp.toISOString(),
      connectedAt: 'connectedAt' in info ? info.connectedAt.toISOString() : undefined,
      lastActivity: 'lastActivity' in info ? info.lastActivity.toISOString() : undefined,
    })
  }

  /**
   * Parse JSON string back to client info
   */
  fromJSON(json: string): ClientInfo {
    const parsed = JSON.parse(json)
    return {
      ...parsed,
      timestamp: new Date(parsed.timestamp),
      connectedAt: parsed.connectedAt ? new Date(parsed.connectedAt) : undefined,
      lastActivity: parsed.lastActivity ? new Date(parsed.lastActivity) : undefined,
    }
  }
}

// Export singleton instance
export const clientInfoCollector = new ClientInfoCollector()
export default clientInfoCollector
