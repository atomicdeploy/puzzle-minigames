import { defineConfig } from '@adonisjs/core/app'

export default defineConfig({
  typescript: true,
  commands: [
    () => import('@adonisjs/core/commands'),
    () => import('@adonisjs/lucid/commands'),
    () => import('./commands/create_user.js'),
    () => import('./commands/stats.js'),
    () => import('./commands/verify_answer.js'),
    () => import('./commands/sms_test.js'),
    () => import('./commands/list_answers.js'),
  ],
  providers: [
    () => import('@adonisjs/core/providers/app_provider'),
    () => import('@adonisjs/core/providers/hash_provider'),
    () => import('@adonisjs/core/providers/http_provider'),
    () => import('@adonisjs/cors/cors_provider'),
    () => import('@adonisjs/lucid/database_provider'),
    () => import('@adonisjs/auth/auth_provider'),
    () => import('@adonisjs/session/session_provider'),
  ],
  preloads: [
    () => import('#start/routes'),
    () => import('#start/kernel'),
    () => import('#start/socket'),
  ],
  metaFiles: [
    {
      pattern: 'public/**',
      reloadServer: false,
    },
    {
      pattern: 'resources/views/**/*.edge',
      reloadServer: false,
    },
  ],
  tests: {
    timeout: 30_000,
    forceExit: true,
  },
})
