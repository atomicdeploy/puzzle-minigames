import { defineConfig, stores } from '@adonisjs/session'
import env from '#start/env'

export default defineConfig({
  enabled: true,
  driver: env.get('SESSION_DRIVER'),

  cookieName: 'adonis-session',

  clearWithBrowser: false,

  age: '2h',

  cookie: {
    path: '/',
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
  },

  stores: {
    cookie: stores.cookie(),
  },
})
