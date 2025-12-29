import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

// Create MySQL connection pool
export const dbPool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'puzzle_minigames',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Promise-based pool for async/await
export const dbPromise = dbPool.promise();

// Test database connection
dbPool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
    console.log('⚠️  Server will continue but database operations will fail');
  } else {
    console.log('✅ Database connected successfully');
    connection.release();
  }
});
