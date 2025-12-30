import { defineConfig, stores } from '@adonisjs/session'

export default defineConfig({
  enabled: true,
  driver: 'cookie',
  store: stores.cookie(),

  cookieName: 'adonis-session',

  clearWithBrowser: false,

  age: '2h',

  cookie: {
    path: '/',
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
  },
})
