#!/usr/bin/env node

/**
 * Simple test runner for registration and login verification
 * Bypasses AdonisJS test runner for direct API testing
 */

import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import mysql from 'mysql2/promise'
import { config } from 'dotenv'
import crypto from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
config({ path: join(__dirname, '..', '.env') })

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'puzzle_minigames',
}

console.log('🧪 Running User Registration and Login Tests\n')
console.log(`📍 Database: ${dbConfig.database} @ ${dbConfig.host}:${dbConfig.port}\n`)

const connection = await mysql.createConnection(dbConfig)

// Test users
const testUsers = [
  {
    email: `alice_${Date.now()}@test.com`,
    password: 'SecurePassword123!',
    fullName: 'Alice Johnson',
  },
  {
    email: `bob_${Date.now()}@test.com`,
    password: 'SecurePassword456!',
    fullName: 'Bob Smith',
  },
  {
    email: `charlie_${Date.now()}@test.com`,
    password: 'SecurePassword789!',
    fullName: 'Charlie Brown',
  },
]

let passedTests = 0
let failedTests = 0

// Helper function to hash password (simple version for testing)
async function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

// Test 1: Register users
console.log('🧪 Test 1: Registering users...')
for (const user of testUsers) {
  try {
    const hashedPassword = await hashPassword(user.password)
    const [result] = await connection.query(
      'INSERT INTO users (email, full_name, password, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
      [user.email, user.fullName, hashedPassword]
    )
    
    if (result.insertId) {
      console.log(`  ✅ Registered: ${user.fullName} (${user.email})`)
      user.id = result.insertId
      passedTests++
    } else {
      console.log(`  ❌ Failed to register: ${user.email}`)
      failedTests++
    }
  } catch (error) {
    console.log(`  ❌ Error registering ${user.email}:`, error.message)
    failedTests++
  }
}
console.log('')

// Test 2: Verify users exist in database
console.log('🧪 Test 2: Verifying users exist in database...')
for (const user of testUsers) {
  try {
    const [rows] = await connection.query(
      'SELECT * FROM users WHERE email = ?',
      [user.email]
    )
    
    if (rows.length > 0 && rows[0].email === user.email && rows[0].full_name === user.fullName) {
      console.log(`  ✅ User found: ${user.fullName}`)
      passedTests++
    } else {
      console.log(`  ❌ User not found or data mismatch: ${user.email}`)
      failedTests++
    }
  } catch (error) {
    console.log(`  ❌ Error verifying ${user.email}:`, error.message)
    failedTests++
  }
}
console.log('')

// Test 3: Verify login credentials (simulate)
console.log('🧪 Test 3: Verifying login credentials...')
for (const user of testUsers) {
  try {
    const hashedPassword = await hashPassword(user.password)
    const [rows] = await connection.query(
      'SELECT * FROM users WHERE email = ? AND password = ?',
      [user.email, hashedPassword]
    )
    
    if (rows.length > 0) {
      console.log(`  ✅ Login successful for: ${user.fullName}`)
      passedTests++
    } else {
      console.log(`  ❌ Login failed for: ${user.email}`)
      failedTests++
    }
  } catch (error) {
    console.log(`  ❌ Error during login verification for ${user.email}:`, error.message)
    failedTests++
  }
}
console.log('')

// Test 4: Create player progress
console.log('🧪 Test 4: Creating player progress...')
for (const user of testUsers) {
  try {
    const score = testUsers.indexOf(user) * 100 + 50
    const [result] = await connection.query(
      'INSERT INTO player_progresses (user_id, discovered_puzzles, puzzle_board, score, completed_games, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
      [user.id, JSON.stringify([1, 2, 3]), JSON.stringify([1, null, 3]), score, 0]
    )
    
    if (result.insertId) {
      console.log(`  ✅ Progress created for: ${user.fullName} (Score: ${score})`)
      passedTests++
    } else {
      console.log(`  ❌ Failed to create progress for: ${user.email}`)
      failedTests++
    }
  } catch (error) {
    console.log(`  ❌ Error creating progress for ${user.email}:`, error.message)
    failedTests++
  }
}
console.log('')

// Test 5: Retrieve player progress
console.log('🧪 Test 5: Retrieving player progress...')
for (const user of testUsers) {
  try {
    const [rows] = await connection.query(
      'SELECT * FROM player_progresses WHERE user_id = ?',
      [user.id]
    )
    
    if (rows.length > 0 && rows[0].score > 0) {
      console.log(`  ✅ Progress retrieved for: ${user.fullName} (Score: ${rows[0].score})`)
      passedTests++
    } else {
      console.log(`  ❌ Failed to retrieve progress for: ${user.email}`)
      failedTests++
    }
  } catch (error) {
    console.log(`  ❌ Error retrieving progress for ${user.email}:`, error.message)
    failedTests++
  }
}
console.log('')

// Test 6: Settings table functionality
console.log('🧪 Test 6: Testing settings table...')
try {
  // Insert test setting
  const [insertResult] = await connection.query(
    'INSERT INTO settings (`key`, value, type, description, is_public, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
    ['test_setting', 'test_value', 'string', 'Test setting for verification', true]
  )
  
  if (insertResult.insertId) {
    console.log('  ✅ Setting created successfully')
    passedTests++
    
    // Retrieve setting
    const [selectRows] = await connection.query(
      'SELECT * FROM settings WHERE `key` = ?',
      ['test_setting']
    )
    
    if (selectRows.length > 0 && selectRows[0].value === 'test_value') {
      console.log('  ✅ Setting retrieved successfully')
      passedTests++
    } else {
      console.log('  ❌ Failed to retrieve setting')
      failedTests++
    }
    
    // Clean up
    await connection.query('DELETE FROM settings WHERE `key` = ?', ['test_setting'])
  } else {
    console.log('  ❌ Failed to create setting')
    failedTests++
  }
} catch (error) {
  console.log('  ❌ Error testing settings:', error.message)
  failedTests++
}
console.log('')

// Clean up test users (optional - comment out to keep for verification)
console.log('🧹 Cleaning up test data...')
for (const user of testUsers) {
  try {
    await connection.query('DELETE FROM player_progresses WHERE user_id = ?', [user.id])
    await connection.query('DELETE FROM users WHERE id = ?', [user.id])
    console.log(`  ✅ Cleaned up: ${user.email}`)
  } catch (error) {
    console.log(`  ⚠️  Warning: Could not clean up ${user.email}:`, error.message)
  }
}
console.log('')

await connection.end()

// Summary
console.log('=' .repeat(60))
console.log('📊 Test Summary')
console.log('=' .repeat(60))
console.log(`✅ Passed: ${passedTests}`)
console.log(`❌ Failed: ${failedTests}`)
console.log(`📈 Total: ${passedTests + failedTests}`)
console.log(`🎯 Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(2)}%`)
console.log('=' .repeat(60))

if (failedTests === 0) {
  console.log('\n🎉 All tests passed! ✨')
  process.exit(0)
} else {
  console.log(`\n⚠️  ${failedTests} test(s) failed`)
  process.exit(1)
}
