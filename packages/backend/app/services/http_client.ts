import https from 'node:https'
import http from 'node:http'
import { URL } from 'node:url'
import { HttpsProxyAgent } from 'https-proxy-agent'
import app from '@adonisjs/core/services/app'

/**
 * Unified HTTP client for making HTTP/HTTPS requests
 * - Respects system proxy environment variables (HTTP_PROXY, HTTPS_PROXY, NO_PROXY)
 * - Sets proper User-Agent header based on package.json
 * - Provides consistent interface for all outgoing HTTP requests
 */
export class HttpClient {
  private userAgent: string
  private httpsProxy?: string
  private httpProxy?: string
  private noProxy?: string[]

  constructor() {
    // Get package info for User-Agent
    const packageJson = app.makeURL('package.json')
    let appName = 'Infernal-Puzzle-Backend'
    let version = '1.0.0'

    try {
      const pkg = require(packageJson.pathname)
      appName = pkg.name || appName
      version = pkg.version || version
    } catch {
      // Use defaults if package.json not found
    }

    this.userAgent = `${appName}/${version}`

    // Read proxy settings from environment
    this.httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy
    this.httpProxy = process.env.HTTP_PROXY || process.env.http_proxy
    this.noProxy = (process.env.NO_PROXY || process.env.no_proxy)?.split(',').map(h => h.trim())
  }

  /**
   * Check if a host should bypass proxy based on NO_PROXY setting
   */
  private shouldBypassProxy(hostname: string): boolean {
    if (!this.noProxy || this.noProxy.length === 0) {
      return false
    }

    return this.noProxy.some(pattern => {
      if (pattern === '*') return true
      if (pattern.startsWith('.')) {
        // Match domain and all subdomains
        return hostname === pattern.slice(1) || hostname.endsWith(pattern)
      }
      return hostname === pattern
    })
  }

  /**
   * Make an HTTPS request with unified configuration
   */
  async request(options: {
    url: string
    method?: string
    headers?: Record<string, string>
    body?: string
    timeout?: number
  }): Promise<{ statusCode: number; headers: Record<string, string>; body: string }> {
    const {
      url,
      method = 'GET',
      headers = {},
      body,
      timeout = 30000
    } = options

    const parsedUrl = new URL(url)
    const isHttps = parsedUrl.protocol === 'https:'

    // Determine if we should use a proxy
    let agent: http.Agent | https.Agent | HttpsProxyAgent | undefined
    const shouldUseProxy = !this.shouldBypassProxy(parsedUrl.hostname)

    if (shouldUseProxy) {
      const proxyUrl = isHttps ? this.httpsProxy : this.httpProxy
      if (proxyUrl) {
        agent = new HttpsProxyAgent(proxyUrl)
      }
    }

    // Prepare request options
    const requestOptions: https.RequestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method,
      headers: {
        'User-Agent': this.userAgent,
        ...headers
      },
      agent,
      timeout
    }

    // Add Content-Length if body is provided
    if (body) {
      requestOptions.headers!['Content-Length'] = Buffer.byteLength(body)
    }

    return new Promise((resolve, reject) => {
      const client = isHttps ? https : http
      const req = client.request(requestOptions, (res) => {
        let data = ''

        res.on('data', (chunk) => {
          data += chunk
        })

        res.on('end', () => {
          resolve({
            statusCode: res.statusCode || 0,
            headers: res.headers as Record<string, string>,
            body: data
          })
        })
      })

      req.on('error', (error) => {
        reject(error)
      })

      req.on('timeout', () => {
        req.destroy()
        reject(new Error('Request timeout'))
      })

      if (body) {
        req.write(body)
      }

      req.end()
    })
  }

  /**
   * Make a GET request
   */
  async get(url: string, headers?: Record<string, string>): Promise<{ statusCode: number; headers: Record<string, string>; body: string }> {
    return this.request({ url, method: 'GET', headers })
  }

  /**
   * Make a POST request
   */
  async post(url: string, body: string, headers?: Record<string, string>): Promise<{ statusCode: number; headers: Record<string, string>; body: string }> {
    return this.request({
      url,
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    })
  }

  /**
   * Make a PUT request
   */
  async put(url: string, body: string, headers?: Record<string, string>): Promise<{ statusCode: number; headers: Record<string, string>; body: string }> {
    return this.request({
      url,
      method: 'PUT',
      body,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    })
  }

  /**
   * Make a DELETE request
   */
  async delete(url: string, headers?: Record<string, string>): Promise<{ statusCode: number; headers: Record<string, string>; body: string }> {
    return this.request({ url, method: 'DELETE', headers })
  }
}

// Export singleton instance
export default new HttpClient()
