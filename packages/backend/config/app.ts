import { defineConfig } from '@adonisjs/core/http'
import env from '#start/env'

export default defineConfig({
  generateRequestId: true,
  allowMethodSpoofing: false,
  useAsyncLocalStorage: true,

  appKey: env.get('APP_KEY'),

  http: {
    trustProxy: false,
  },

  cookie: {
    domain: '',
    path: '/',
    maxAge: '2h',
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
  },
})
