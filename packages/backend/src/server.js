import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupSocketHandlers } from './socket/socketHandler.js';
import apiRoutes from './routes/api.js';
import { dbPool } from './config/database.js';
import { requestLogger } from './middleware/requestLogger.js';
import { domainStaticMiddleware, configureDomain } from './middleware/domainStatic.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(origin => origin.length > 0);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl) in all environments
    if (!origin) {
      return callback(null, true);
    }

    // In non-production, if no origins are configured, allow all origins (dev convenience)
    if (!isProduction && allowedOrigins.length === 0) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST'],
};

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: corsOptions,
});

// Configure domain-specific static file serving
// Default: serve mobile app from .output/public
const mobileAppPath = path.resolve(__dirname, '../../mobile-app/.output/public');
configureDomain('localhost', mobileAppPath);
configureDomain('127.0.0.1', mobileAppPath);

// Allow configuring additional domains via environment variable
// Format: DOMAIN_STATIC_PATHS=example.com:/path/to/static,another.com:/path/to/static2
if (process.env.DOMAIN_STATIC_PATHS) {
  const domainPaths = process.env.DOMAIN_STATIC_PATHS.split(',');
  domainPaths.forEach(entry => {
    const [domain, staticPath] = entry.split(':');
    if (domain && staticPath) {
      configureDomain(domain.trim(), staticPath.trim());
    }
  });
}

// Middleware - Request logging (first for all requests)
app.use(requestLogger);

// Middleware - CORS and body parsing
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', apiRoutes);

// Socket.io connection handling
setupSocketHandlers(io);

// Domain-specific static file serving
app.use(domainStaticMiddleware);

// Fallback: serve mobile app static files for non-API routes
app.use(express.static(mobileAppPath));

// SPA fallback - serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(mobileAppPath, 'index.html'), (err) => {
    if (err) {
      res.status(404).json({ error: 'Not found' });
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    // In production, avoid logging full stack traces to reduce information exposure
    console.error('Error:', err && err.message ? err.message : 'Unknown error');
  } else {
    // In non-production environments, log full stack for easier debugging
    console.error(err && err.stack ? err.stack : err);
  }

  const statusCode = typeof err.status === 'number' ? err.status : 500;
  const responseBody = { error: 'Something went wrong!' };

  // Optionally expose limited details only in non-production environments
  if (!isProduction && err && err.message) {
    responseBody.details = err.message;
  }

  res.status(statusCode).json(responseBody);
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io server ready`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
    dbPool.end(() => {
      console.log('Database pool closed');
      process.exit(0);
    });
  });
});
