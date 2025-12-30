import env from '#start/env'
import { defineConfig } from '@adonisjs/cors'

export default defineConfig({
  enabled: true,
  origin: env.get('CORS_ORIGIN') === '*' ? true : env.get('CORS_ORIGIN').split(','),
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE'],
  headers: true,
  exposeHeaders: [],
  credentials: true,
  maxAge: 90,
})
