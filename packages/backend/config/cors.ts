import env from '#start/env'
import { defineConfig } from '@adonisjs/cors'

const corsOrigin = env.get('CORS_ORIGIN')

export default defineConfig({
  enabled: true,
  origin: corsOrigin === '*' ? true : (corsOrigin || 'http://localhost:3000').split(',').map(o => o.trim()),
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE'],
  headers: true,
  exposeHeaders: [],
  credentials: true,
  maxAge: 90,
})
