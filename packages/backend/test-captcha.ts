/**
 * Test script for CAPTCHA generation
 * Run with: node --import tsx/esm test-captcha.ts
 */

import CaptchaService from './app/services/captcha_service.js'
import { writeFileSync } from 'fs'

async function testCaptcha() {
  console.log('Testing CAPTCHA Service...\n')
  
  const captchaService = new CaptchaService()
  
  // Test 1: Generate CAPTCHA
  console.log('Test 1: Generating CAPTCHA...')
  const captcha = await captchaService.generate({
    width: 400,
    height: 150,
    length: 6,
  })
  
  console.log('✓ CAPTCHA generated successfully')
  console.log(`  Code: ${captcha.code}`)
  console.log(`  Dimensions: ${captcha.width}x${captcha.height}`)
  console.log(`  Image length: ${captcha.image.length} characters`)
  
  // Save to file for visual inspection
  const base64Data = captcha.image.replace(/^data:image\/svg\+xml;base64,/, '')
  const svgData = Buffer.from(base64Data, 'base64').toString('utf8')
  writeFileSync('/tmp/captcha-test.svg', svgData)
  console.log('  Saved to: /tmp/captcha-test.svg\n')
  
  // Test 2: Verify exact match
  console.log('Test 2: Verifying exact match...')
  const exactMatch = captchaService.verify(captcha.code, captcha.code)
  console.log(exactMatch ? '✓ Exact match verified' : '✗ Exact match failed')
  
  // Test 3: Case insensitive
  console.log('\nTest 3: Testing case insensitivity...')
  const lowerMatch = captchaService.verify(captcha.code, captcha.code.toLowerCase())
  const upperMatch = captchaService.verify(captcha.code, captcha.code.toUpperCase())
  const mixedMatch = captchaService.verify(captcha.code.toLowerCase(), captcha.code.toUpperCase())
  console.log(lowerMatch && upperMatch && mixedMatch 
    ? '✓ Case insensitive verification works' 
    : '✗ Case insensitive verification failed')
  
  // Test 4: Character aliasing
  console.log('\nTest 4: Testing character aliasing...')
  
  // Test 0/o aliasing
  const testAlias0 = captchaService.verify('0ABC', 'oABC')
  const testAliasO = captchaService.verify('OABC', '0ABC')
  console.log(testAlias0 && testAliasO 
    ? '✓ 0/o aliasing works' 
    : '✗ 0/o aliasing failed')
  
  // Test 1/i/l aliasing
  const testAlias1 = captchaService.verify('1ABC', 'iABC')
  const testAliasI = captchaService.verify('iABC', 'lABC')
  const testAliasL = captchaService.verify('lABC', '1ABC')
  console.log(testAlias1 && testAliasI && testAliasL 
    ? '✓ 1/i/l aliasing works' 
    : '✗ 1/i/l aliasing failed')
  
  // Test 5: Wrong answer
  console.log('\nTest 5: Testing wrong answer rejection...')
  const wrongMatch = captchaService.verify(captcha.code, 'WRONG')
  console.log(!wrongMatch ? '✓ Wrong answer rejected' : '✗ Wrong answer accepted (bad!)')
  
  // Test 6: Generate multiple CAPTCHAs
  console.log('\nTest 6: Generating multiple CAPTCHAs...')
  const codes = []
  for (let i = 0; i < 5; i++) {
    const c = await captchaService.generate({ length: 6 })
    codes.push(c.code)
  }
  const uniqueCodes = new Set(codes)
  console.log(`✓ Generated ${uniqueCodes.size} unique codes out of 5 attempts`)
  console.log(`  Codes: ${codes.join(', ')}`)
  
  // Test 7: Different lengths
  console.log('\nTest 7: Testing different code lengths...')
  const short = await captchaService.generate({ length: 4 })
  const long = await captchaService.generate({ length: 8 })
  console.log(`✓ Short code (4): ${short.code}`)
  console.log(`✓ Long code (8): ${long.code}`)
  
  console.log('\n✅ All tests completed!')
}

testCaptcha().catch(console.error)
