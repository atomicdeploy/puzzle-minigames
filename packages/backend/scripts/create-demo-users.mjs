#!/usr/bin/env node

/**
 * Create demonstration users
 * These users will remain in the database for verification
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

console.log('👥 Creating Demo Users\n')
console.log(`📍 Database: ${dbConfig.database} @ ${dbConfig.host}:${dbConfig.port}\n`)

const connection = await mysql.createConnection(dbConfig)

// Demo users that will be kept for verification
const demoUsers = [
  {
    email: 'admin@puzzle.local',
    password: 'AdminPass123!',
    fullName: 'Admin User',
  },
  {
    email: 'player1@puzzle.local',
    password: 'Player1Pass!',
    fullName: 'Player One',
  },
  {
    email: 'player2@puzzle.local',
    password: 'Player2Pass!',
    fullName: 'Player Two',
  },
  {
    email: 'tester@puzzle.local',
    password: 'TesterPass!',
    fullName: 'Test User',
  },
]

// Helper function to hash password
async function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

console.log('🔧 Creating users...\n')

for (const user of demoUsers) {
  try {
    // Check if user already exists
    const [existing] = await connection.query(
      'SELECT id FROM users WHERE email = ?',
      [user.email]
    )
    
    if (existing.length > 0) {
      console.log(`  ⏭️  User already exists: ${user.email}`)
      user.id = existing[0].id
      continue
    }
    
    // Create user
    const hashedPassword = await hashPassword(user.password)
    const [result] = await connection.query(
      'INSERT INTO users (email, full_name, password, is_email_verified, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
      [user.email, user.fullName, hashedPassword, true]
    )
    
    user.id = result.insertId
    console.log(`  ✅ Created: ${user.fullName} (${user.email})`)
    
    // Create initial player progress
    const score = Math.floor(Math.random() * 500) + 100
    await connection.query(
      'INSERT INTO player_progresses (user_id, discovered_puzzles, puzzle_board, score, completed_games, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
      [user.id, JSON.stringify([1, 2, 3]), JSON.stringify([1, null, 3, null, 5, null, 7, null, 9]), score, Math.floor(score / 100)]
    )
    
    console.log(`     └─ Progress created (Score: ${score})`)
  } catch (error) {
    console.log(`  ❌ Error creating ${user.email}:`, error.message)
  }
}

console.log('\n📋 Creating demo settings...\n')

const demoSettings = [
  {
    key: 'app_name',
    value: 'اینفرنال (Infernal)',
    type: 'string',
    description: 'Application name',
    isPublic: true,
  },
  {
    key: 'max_players',
    value: '100',
    type: 'number',
    description: 'Maximum number of concurrent players',
    isPublic: true,
  },
  {
    key: 'game_enabled',
    value: '1',
    type: 'boolean',
    description: 'Whether the game is currently enabled',
    isPublic: true,
  },
  {
    key: 'maintenance_mode',
    value: '0',
    type: 'boolean',
    description: 'Maintenance mode status',
    isPublic: true,
  },
  {
    key: 'api_version',
    value: '1.0.0',
    type: 'string',
    description: 'API version',
    isPublic: true,
  },
  {
    key: 'admin_email',
    value: 'admin@puzzle.local',
    type: 'string',
    description: 'Administrator email',
    isPublic: false,
  },
]

for (const setting of demoSettings) {
  try {
    // Check if setting exists
    const [existing] = await connection.query(
      'SELECT id FROM settings WHERE `key` = ?',
      [setting.key]
    )
    
    if (existing.length > 0) {
      console.log(`  ⏭️  Setting already exists: ${setting.key}`)
      continue
    }
    
    await connection.query(
      'INSERT INTO settings (`key`, value, type, description, is_public, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
      [setting.key, setting.value, setting.type, setting.description, setting.isPublic]
    )
    
    console.log(`  ✅ Created: ${setting.key} = ${setting.value}`)
  } catch (error) {
    console.log(`  ❌ Error creating setting ${setting.key}:`, error.message)
  }
}

await connection.end()

console.log('\n' + '='.repeat(60))
console.log('✨ Demo Users Created Successfully!')
console.log('='.repeat(60))
console.log('\n📝 Login Credentials:\n')
for (const user of demoUsers) {
  console.log(`   ${user.fullName}`)
  console.log(`   📧 Email: ${user.email}`)
  console.log(`   🔒 Password: ${user.password}`)
  console.log('')
}
console.log('='.repeat(60))
console.log('\n💡 You can now login with these credentials!')
console.log('   Backend API: http://localhost:3001')
console.log('   Frontend: http://localhost:3000\n')
