/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const AuthController = () => import('#controllers/auth_controller')
const UsersController = () => import('#controllers/users_controller')
const GamesController = () => import('#controllers/games_controller')
const PlayerProgressController = () => import('#controllers/player_progress_controller')
const MinigameAnswersController = () => import('#controllers/minigame_answers_controller')
const SessionsController = () => import('#controllers/sessions_controller')
const CaptchaController = () => import('#controllers/captcha_controller')

// Health check
router.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

// API routes
router.group(() => {
  // Authentication routes
  router.group(() => {
    router.post('/register', [AuthController, 'register'])
    router.post('/login', [AuthController, 'login'])
    router.post('/logout', [AuthController, 'logout'])
    router.post('/otp/send', [AuthController, 'sendOtp'])
    router.post('/otp/verify', [AuthController, 'verifyOtp'])
  }).prefix('/auth')

  // User routes
  router.group(() => {
    router.get('/profile', [UsersController, 'profile'])
    router.put('/profile', [UsersController, 'updateProfile'])
    router.get('/visits', [UsersController, 'visits'])
  }).prefix('/users').use(middleware.auth())

  // Games routes
  router.get('/games', [GamesController, 'index'])
  router.get('/games/:id', [GamesController, 'show'])

  // Player progress routes
  router.group(() => {
    router.get('/progress', [PlayerProgressController, 'show'])
    router.post('/progress', [PlayerProgressController, 'save'])
  }).prefix('/players').use(middleware.auth())

  // Minigame answer routes
  router.group(() => {
    router.post('/answers/submit', [MinigameAnswersController, 'submit'])
    router.get('/answers/pending', [MinigameAnswersController, 'pending'])
    router.get('/answers/history', [MinigameAnswersController, 'history'])
  }).prefix('/minigames').use(middleware.auth())

  // Session tracking routes
  router.group(() => {
    router.post('/track', [SessionsController, 'track'])
    router.get('/current', [SessionsController, 'current'])
  }).prefix('/sessions')

  // CAPTCHA routes
  router.group(() => {
    router.get('/generate', [CaptchaController, 'generate'])
    router.post('/verify', [CaptchaController, 'verify'])
    router.get('/refresh', [CaptchaController, 'refresh'])
  }).prefix('/captcha')

  // Leaderboard
  router.get('/leaderboard', [PlayerProgressController, 'leaderboard'])
}).prefix('/api')
