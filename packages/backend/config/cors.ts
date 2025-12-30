import env from '#start/env'
import { defineConfig } from '@adonisjs/cors'

const corsOrigin = env.get('CORS_ORIGIN')

// Safely parse CORS origin with fallback
const getOrigin = () => {
  if (!corsOrigin || corsOrigin === '*') {
    return true // Allow all origins
  }
  
  try {
    return corsOrigin.split(',').map(o => o.trim()).filter(o => o.length > 0)
  } catch {
    return ['http://localhost:3000'] // Fallback to localhost
  }
}

export default defineConfig({
  enabled: true,
  origin: getOrigin(),
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE'],
  headers: true,
  exposeHeaders: [],
  credentials: true,
  maxAge: 90,
})
