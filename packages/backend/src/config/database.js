import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const dbPassword = process.env.DB_PASSWORD;

if (process.env.NODE_ENV === 'production' && !dbPassword) {
  throw new Error(
    'Database password is required in production. Please set the DB_PASSWORD environment variable.'
  );
}

// Create MySQL connection pool
export const dbPool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  // In development, an empty password is allowed for local setups.
  // Never rely on this default in production; DB_PASSWORD must be set.
  password: dbPassword || '',
  database: process.env.DB_NAME || 'puzzle_minigames',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Promise-based pool for async/await
export const dbPromise = dbPool.promise();

// Test database connection with retries to improve resilience during startup
function testDbConnection(retries = 5, delayMs = 2000) {
  dbPool.getConnection((err, connection) => {
    if (err) {
      if (retries > 0) {
        console.warn(
          `⚠️  Database connection failed (${err.message}). ` +
          `Retrying in ${delayMs}ms... (${retries} retries left)`
        );
        setTimeout(() => testDbConnection(retries - 1, delayMs), delayMs);
      } else {
        console.error('❌ Database connection error:', err.message);
        console.log('⚠️  Server will continue but database operations may fail');
      }
    } else {
      console.log('✅ Database connected successfully');
      connection.release();
    }
  });
}

// Initiate initial database connectivity test
testDbConnection();
