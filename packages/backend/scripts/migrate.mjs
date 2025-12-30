#!/usr/bin/env node

/**
 * Migration runner script
 * Runs all TypeScript migrations manually
 */

import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import mysql from 'mysql2/promise'
import { config } from 'dotenv'

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

console.log('🔧 Running migrations...')
console.log(`📍 Database: ${dbConfig.database} @ ${dbConfig.host}:${dbConfig.port}`)

const connection = await mysql.createConnection(dbConfig)

// Create migrations table if not exists
await connection.query(`
  CREATE TABLE IF NOT EXISTS adonis_schema (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    batch INT NOT NULL,
    migration_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`)

// Get current batch number
const [batchRows] = await connection.query(
  'SELECT MAX(batch) as max_batch FROM adonis_schema'
)
const currentBatch = (batchRows[0].max_batch || 0) + 1

// List of migrations to run
const migrations = [
  {
    name: '1735527600000_create_users_table',
    up: async () => {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          full_name VARCHAR(255) NULL,
          email VARCHAR(254) NOT NULL UNIQUE,
          phone_number VARCHAR(20) NULL UNIQUE,
          password VARCHAR(180) NOT NULL,
          is_phone_verified BOOLEAN DEFAULT FALSE,
          is_email_verified BOOLEAN DEFAULT FALSE,
          device_info TEXT NULL,
          user_agent TEXT NULL,
          last_login_at TIMESTAMP NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `)
    },
  },
  {
    name: '1735527700000_create_games_table',
    up: async () => {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS games (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT NULL,
          difficulty VARCHAR(50) NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `)
    },
  },
  {
    name: '1735527800000_create_player_progresses_table',
    up: async () => {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS player_progresses (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          discovered_puzzles JSON NULL,
          puzzle_board JSON NULL,
          score INT DEFAULT 0,
          completed_games INT DEFAULT 0,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_user_id (user_id),
          INDEX idx_score (score DESC)
        )
      `)
    },
  },
  {
    name: '1735527900000_create_user_sessions_table',
    up: async () => {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS user_sessions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          session_token VARCHAR(255) NOT NULL UNIQUE,
          ip_address VARCHAR(45) NULL,
          user_agent TEXT NULL,
          device_info TEXT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          last_activity TIMESTAMP NULL,
          expires_at TIMESTAMP NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_session_token (session_token),
          INDEX idx_user_id (user_id)
        )
      `)
    },
  },
  {
    name: '1735528000000_create_page_visits_table',
    up: async () => {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS page_visits (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NULL,
          page_url VARCHAR(500) NOT NULL,
          referrer VARCHAR(500) NULL,
          ip_address VARCHAR(45) NULL,
          user_agent TEXT NULL,
          visited_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
          INDEX idx_user_id (user_id),
          INDEX idx_visited_at (visited_at)
        )
      `)
    },
  },
  {
    name: '1735528100000_create_minigame_answers_table',
    up: async () => {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS minigame_answers (
          id INT AUTO_INCREMENT PRIMARY KEY,
          minigame_id INT NOT NULL,
          correct_answer TEXT NOT NULL,
          answer_type VARCHAR(50) DEFAULT 'text',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_minigame_id (minigame_id)
        )
      `)
    },
  },
  {
    name: '1735528200000_create_answer_submissions_table',
    up: async () => {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS answer_submissions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          minigame_id INT NOT NULL,
          submitted_answer TEXT NOT NULL,
          is_correct BOOLEAN DEFAULT FALSE,
          is_verified BOOLEAN DEFAULT FALSE,
          verified_at TIMESTAMP NULL,
          submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_user_minigame (user_id, minigame_id),
          INDEX idx_verified (is_verified)
        )
      `)
    },
  },
  {
    name: '1735528300000_create_otps_table',
    up: async () => {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS otps (
          id INT AUTO_INCREMENT PRIMARY KEY,
          phone_number VARCHAR(20) NOT NULL,
          code VARCHAR(10) NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          is_verified BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_phone_code (phone_number, code),
          INDEX idx_expires (expires_at)
        )
      `)
    },
  },
  {
    name: '1735528400000_create_settings_table',
    up: async () => {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS settings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          \`key\` VARCHAR(255) NOT NULL UNIQUE,
          value TEXT NULL,
          type VARCHAR(50) DEFAULT 'string',
          description TEXT NULL,
          is_public BOOLEAN DEFAULT FALSE,
          is_encrypted BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `)
    },
  },
]

// Run migrations
for (const migration of migrations) {
  try {
    // Check if migration already ran
    const [existing] = await connection.query('SELECT * FROM adonis_schema WHERE name = ?', [
      migration.name,
    ])

    if (existing.length > 0) {
      console.log(`⏭️  Skipping ${migration.name} (already ran)`)
      continue
    }

    console.log(`🔄 Running ${migration.name}...`)
    await migration.up()

    // Record migration
    await connection.query('INSERT INTO adonis_schema (name, batch) VALUES (?, ?)', [
      migration.name,
      currentBatch,
    ])

    console.log(`✅ ${migration.name} completed`)
  } catch (error) {
    console.error(`❌ Failed to run ${migration.name}:`, error.message)
    process.exit(1)
  }
}

await connection.end()

console.log('✨ All migrations completed successfully!')
