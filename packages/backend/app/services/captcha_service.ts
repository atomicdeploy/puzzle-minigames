import { randomBytes } from 'crypto'

/**
 * CaptchaService - Generates visually stunning, high-definition CAPTCHAs
 * Features:
 * - Offline generation (no external dependencies, pure SVG)
 * - HD quality (scalable vector graphics)
 * - Dark mode with vibrant colors
 * - Case-insensitive verification
 * - Character aliasing support (0/o, i/1/l, 7/1, etc.)
 */
export default class CaptchaService {
  // Character sets (excluding confusing characters)
  private readonly CHAR_SET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  
  // Character aliases for flexible verification
  private readonly CHAR_ALIASES: Record<string, string[]> = {
    '0': ['0', 'o', 'O'],
    'o': ['0', 'o', 'O'],
    'O': ['0', 'o', 'O'],
    '1': ['1', 'i', 'I', 'l', 'L'],
    'i': ['1', 'i', 'I', 'l', 'L'],
    'I': ['1', 'i', 'I', 'l', 'L'],
    'l': ['1', 'i', 'I', 'l', 'L'],
    'L': ['1', 'i', 'I', 'l', 'L'],
    '7': ['7', '1'],
    'z': ['z', 'Z', '2'],
    'Z': ['z', 'Z', '2'],
    '2': ['z', 'Z', '2'],
    's': ['s', 'S', '5'],
    'S': ['s', 'S', '5'],
    '5': ['s', 'S', '5'],
    'g': ['g', 'G', '9'],
    'G': ['g', 'G', '9'],
    '9': ['g', 'G', '9'],
    'b': ['b', 'B', '8'],
    'B': ['b', 'B', '8'],
    '8': ['b', 'B', '8'],
  }

  // Vibrant color palettes for dark mode
  private readonly COLOR_PALETTES = {
    neon: ['#ff006e', '#fb5607', '#ffbe0b', '#8338ec', '#3a86ff'],
    aurora: ['#00f5ff', '#00d9ff', '#0abdc6', '#0091ad', '#007991'],
    sunset: ['#ff9e00', '#ff6d00', '#ff3d00', '#f50057', '#d500f9'],
    electric: ['#00e5ff', '#00b0ff', '#0091ea', '#2979ff', '#3d5afe'],
    plasma: ['#ff1744', '#f50057', '#d500f9', '#651fff', '#3d5afe'],
  }

  /**
   * Generate a random CAPTCHA code
   */
  private generateCode(length: number = 6): string {
    let code = ''
    const charSetLength = this.CHAR_SET.length
    const randomBytesArray = randomBytes(length)
    
    for (let i = 0; i < length; i++) {
      const randomIndex = randomBytesArray[i] % charSetLength
      code += this.CHAR_SET[randomIndex]
    }
    
    return code
  }

  /**
   * Select random color palette
   */
  private getRandomPalette(): string[] {
    const palettes = Object.values(this.COLOR_PALETTES)
    return palettes[Math.floor(Math.random() * palettes.length)]
  }

  /**
   * Generate a beautiful CAPTCHA SVG image
   */
  async generate(options: { width?: number; height?: number; length?: number } = {}) {
    const width = options.width || 400
    const height = options.height || 150
    const length = options.length || 6
    
    // Generate code
    const code = this.generateCode(length)
    
    // Select color palette
    const palette = this.getRandomPalette()
    
    // Build SVG
    const svg = this.buildSVG(code, width, height, palette)
    
    // Convert to base64 data URL
    const base64SVG = Buffer.from(svg).toString('base64')
    const dataUrl = `data:image/svg+xml;base64,${base64SVG}`
    
    return {
      code,
      image: dataUrl,
      width,
      height,
    }
  }

  /**
   * Build the complete SVG string
   */
  private buildSVG(text: string, width: number, height: number, palette: string[]): string {
    const charSpacing = width / (text.length + 1)
    
    // SVG header
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`
    
    // Add definitions for filters and effects
    svg += this.generateSVGDefs(palette)
    
    // Dark background
    svg += `<rect width="${width}" height="${height}" fill="#0a0e27"/>`
    
    // Gradient overlay
    svg += `<rect width="${width}" height="${height}" fill="url(#bg-gradient)" opacity="0.3"/>`
    
    // Grid pattern
    svg += this.generateGrid(width, height)
    
    // Glowing orbs
    svg += this.generateOrbs(width, height, palette)
    
    // Decorative waves
    svg += this.generateWaves(width, height, palette)
    
    // Particles
    svg += this.generateParticles(width, height, palette)
    
    // Text characters with effects
    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      const x = charSpacing * (i + 1)
      const y = height / 2
      
      // Random rotation and offset
      const rotation = (Math.random() - 0.5) * 20
      const yOffset = (Math.random() - 0.5) * 15
      const colorIndex = i % palette.length
      const color = palette[colorIndex]
      
      svg += this.generateCharacter(char, x, y + yOffset, rotation, color, i)
    }
    
    // Noise overlay
    svg += `<rect width="${width}" height="${height}" fill="url(#noise)" opacity="0.05"/>`
    
    svg += '</svg>'
    
    return svg
  }

  /**
   * Generate SVG definitions (gradients, filters, patterns)
   */
  private generateSVGDefs(palette: string[]): string {
    let defs = '<defs>'
    
    // Background gradient
    defs += `
      <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${palette[0]}" stop-opacity="0.2"/>
        <stop offset="50%" stop-color="${palette[2]}" stop-opacity="0.1"/>
        <stop offset="100%" stop-color="${palette[4]}" stop-opacity="0.2"/>
      </linearGradient>
    `
    
    // Glow filter
    defs += `
      <filter id="glow">
        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    `
    
    // Strong glow filter for text
    for (let i = 0; i < 6; i++) {
      defs += `
        <filter id="text-glow-${i}" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3"/>
          <feColorMatrix type="matrix" values="
            1 0 0 0 0
            0 1 0 0 0
            0 0 1 0 0
            0 0 0 8 0"/>
          <feGaussianBlur stdDeviation="5"/>
          <feComposite in2="SourceGraphic" operator="over"/>
        </filter>
      `
    }
    
    // Noise pattern
    defs += `
      <pattern id="noise" width="100" height="100" patternUnits="userSpaceOnUse">
        ${this.generateNoisePattern()}
      </pattern>
    `
    
    defs += '</defs>'
    return defs
  }

  /**
   * Generate noise pattern for SVG
   */
  private generateNoisePattern(): string {
    let pattern = ''
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * 100
      const y = Math.random() * 100
      const opacity = Math.random() * 0.3
      pattern += `<circle cx="${x}" cy="${y}" r="0.5" fill="white" opacity="${opacity}"/>`
    }
    return pattern
  }

  /**
   * Generate grid pattern
   */
  private generateGrid(width: number, height: number): string {
    let grid = '<g opacity="0.08">'
    const spacing = 20
    
    // Vertical lines
    for (let x = 0; x < width; x += spacing) {
      grid += `<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="#ffffff" stroke-width="1"/>`
    }
    
    // Horizontal lines
    for (let y = 0; y < height; y += spacing) {
      grid += `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="#ffffff" stroke-width="1"/>`
    }
    
    grid += '</g>'
    return grid
  }

  /**
   * Generate glowing orbs
   */
  private generateOrbs(width: number, height: number, palette: string[]): string {
    let orbs = ''
    const orbCount = 3 + Math.floor(Math.random() * 3)
    
    for (let i = 0; i < orbCount; i++) {
      const x = Math.random() * width
      const y = Math.random() * height
      const radius = 40 + Math.random() * 80
      const colorIndex = Math.floor(Math.random() * palette.length)
      const color = palette[colorIndex]
      
      orbs += `
        <radialGradient id="orb-${i}">
          <stop offset="0%" stop-color="${color}" stop-opacity="0.4"/>
          <stop offset="50%" stop-color="${color}" stop-opacity="0.15"/>
          <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
        </radialGradient>
        <circle cx="${x}" cy="${y}" r="${radius}" fill="url(#orb-${i})"/>
      `
    }
    
    return orbs
  }

  /**
   * Generate decorative waves
   */
  private generateWaves(width: number, height: number, palette: string[]): string {
    let waves = ''
    const waveCount = 2 + Math.floor(Math.random() * 2)
    
    for (let w = 0; w < waveCount; w++) {
      const colorIndex = Math.floor(Math.random() * palette.length)
      const color = palette[colorIndex]
      const startY = Math.random() * height
      const amplitude = 10 + Math.random() * 20
      const frequency = 0.01 + Math.random() * 0.02
      const phase = Math.random() * Math.PI * 2
      
      let path = `M 0 ${startY}`
      for (let x = 2; x < width; x += 2) {
        const y = startY + Math.sin(x * frequency + phase) * amplitude
        path += ` L ${x} ${y}`
      }
      
      waves += `<path d="${path}" stroke="${color}" stroke-width="2" fill="none" opacity="0.3"/>`
    }
    
    return waves
  }

  /**
   * Generate random particles
   */
  private generateParticles(width: number, height: number, palette: string[]): string {
    let particles = ''
    const particleCount = 20 + Math.floor(Math.random() * 30)
    
    for (let p = 0; p < particleCount; p++) {
      const x = Math.random() * width
      const y = Math.random() * height
      const radius = 1 + Math.random() * 2
      const colorIndex = Math.floor(Math.random() * palette.length)
      const color = palette[colorIndex]
      
      particles += `<circle cx="${x}" cy="${y}" r="${radius}" fill="${color}" opacity="0.6"/>`
    }
    
    return particles
  }

  /**
   * Generate a single character with effects
   */
  private generateCharacter(char: string, x: number, y: number, rotation: number, color: string, index: number): string {
    return `
      <g transform="translate(${x}, ${y}) rotate(${rotation})">
        <!-- Glow layers -->
        <text
          x="0"
          y="0"
          font-family="Arial, sans-serif"
          font-size="72"
          font-weight="bold"
          text-anchor="middle"
          dominant-baseline="middle"
          fill="${color}"
          filter="url(#text-glow-${index})"
        >${char}</text>
        
        <!-- Main character with gradient -->
        <defs>
          <linearGradient id="char-grad-${index}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="${color}"/>
            <stop offset="50%" stop-color="#ffffff"/>
            <stop offset="100%" stop-color="${color}"/>
          </linearGradient>
        </defs>
        <text
          x="0"
          y="0"
          font-family="Arial, sans-serif"
          font-size="72"
          font-weight="bold"
          text-anchor="middle"
          dominant-baseline="middle"
          fill="url(#char-grad-${index})"
          stroke="#ffffff"
          stroke-width="2"
          stroke-opacity="0.4"
        >${char}</text>
      </g>
    `
  }

  /**
   * Normalize a character for verification (handle aliases)
   */
  private normalizeChar(char: string): string {
    const upperChar = char.toUpperCase()
    
    // Find the primary character for this alias
    for (const [primary, aliases] of Object.entries(this.CHAR_ALIASES)) {
      if (aliases.includes(upperChar)) {
        return aliases[0] // Return the first (primary) alias
      }
    }
    
    return upperChar
  }

  /**
   * Verify CAPTCHA response (case-insensitive with alias support)
   */
  verify(expected: string, provided: string): boolean {
    if (!expected || !provided) {
      return false
    }
    
    // Normalize both strings
    const normalizedExpected = Array.from(expected)
      .map(char => this.normalizeChar(char))
      .join('')
    
    const normalizedProvided = Array.from(provided)
      .map(char => this.normalizeChar(char))
      .join('')
    
    return normalizedExpected === normalizedProvided
  }
}
