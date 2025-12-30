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
const ConnectedClientsController = () => import('#controllers/connected_clients_controller')
const QrController = () => import('#controllers/qr_controller')
const AdminUsersController = () => import('#controllers/admin_users_controller')
const AdminGamesController = () => import('#controllers/admin_games_controller')
const AdminAnalyticsController = () => import('#controllers/admin_analytics_controller')
const SettingsController = () => import('#controllers/settings_controller')
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
    router.post('/send-otp', [AuthController, 'sendOtp'])
    router.post('/verify-otp', [AuthController, 'verifyOtp'])
    router.post('/complete-registration', [AuthController, 'completeRegistration'])
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

  // Connected clients routes
  router.group(() => {
    router.get('/', [ConnectedClientsController, 'index'])
    router.get('/stats', [ConnectedClientsController, 'stats'])
    router.get('/:socketId', [ConnectedClientsController, 'show'])
    router.get('/user/:userId', [ConnectedClientsController, 'byUser'])
    router.post('/cleanup', [ConnectedClientsController, 'cleanup'])
  }).prefix('/connected-clients')

  // QR code routes
  router.group(() => {
    // Public validation endpoint
    router.post('/validate', [QrController, 'validate'])
    
    // Admin routes (protected)
    router.group(() => {
      router.post('/generate', [QrController, 'generate'])
      router.get('/', [QrController, 'index'])
      router.get('/:id', [QrController, 'show'])
      router.put('/:id', [QrController, 'update'])
      router.delete('/:id', [QrController, 'destroy'])
      router.get('/:id/logs', [QrController, 'logs'])
      router.get('/logs/all', [QrController, 'allLogs'])
    }).use(middleware.auth())
  }).prefix('/qr')

  // Admin routes (all protected with auth)
  router.group(() => {
    // User management
    router.group(() => {
      router.get('/', [AdminUsersController, 'index'])
      router.post('/', [AdminUsersController, 'store'])
      router.get('/:id', [AdminUsersController, 'show'])
      router.put('/:id', [AdminUsersController, 'update'])
      router.delete('/:id', [AdminUsersController, 'destroy'])
      router.post('/:id/approve', [AdminUsersController, 'approve'])
      router.post('/:id/block', [AdminUsersController, 'block'])
      router.post('/:id/unblock', [AdminUsersController, 'unblock'])
      router.get('/:id/minigames', [AdminUsersController, 'minigameProgress'])
      router.get('/:id/sessions', [AdminUsersController, 'sessions'])
      router.get('/:id/visits', [AdminUsersController, 'visits'])
      router.get('/:id/qr-access', [AdminUsersController, 'qrAccess'])
      router.post('/bulk', [AdminUsersController, 'bulk'])
    }).prefix('/users')

    // Game management
    router.group(() => {
      router.get('/', [AdminGamesController, 'index'])
      router.post('/', [AdminGamesController, 'store'])
      router.get('/:id', [AdminGamesController, 'show'])
      router.put('/:id', [AdminGamesController, 'update'])
      router.delete('/:id', [AdminGamesController, 'destroy'])
      router.get('/:id/answers', [AdminGamesController, 'answers'])
      router.get('/:id/solvers', [AdminGamesController, 'solvers'])
      router.get('/:id/leaderboard', [AdminGamesController, 'leaderboard'])
    }).prefix('/games')

    // Analytics and reporting
    router.group(() => {
      router.get('/dashboard', [AdminAnalyticsController, 'dashboard'])
      router.get('/user-minigame-matrix', [AdminAnalyticsController, 'userMinigameMatrix'])
      router.get('/user/:id/timeline', [AdminAnalyticsController, 'userTimeline'])
      router.get('/game/:id/completion-stats', [AdminAnalyticsController, 'gameCompletionStats'])
      router.get('/activity-heatmap', [AdminAnalyticsController, 'activityHeatmap'])
      router.get('/user/:id/performance', [AdminAnalyticsController, 'userPerformanceReport'])
      router.get('/export', [AdminAnalyticsController, 'exportData'])
    }).prefix('/analytics')
  }).prefix('/admin').use(middleware.auth())

  // CAPTCHA routes
  router.group(() => {
    router.get('/generate', [CaptchaController, 'generate'])
    router.post('/verify', [CaptchaController, 'verify'])
    router.get('/refresh', [CaptchaController, 'refresh'])
  }).prefix('/captcha')

  // Leaderboard
  router.get('/leaderboard', [PlayerProgressController, 'leaderboard'])

  // Settings routes
  router.get('/settings', [SettingsController, 'index']) // Public settings
  router.get('/settings/:key', [SettingsController, 'show']) // Get specific setting
  router.group(() => {
    router.get('/all', [SettingsController, 'all']) // All settings (admin)
    router.post('/upsert', [SettingsController, 'upsert']) // Create/update setting
    router.delete('/:key', [SettingsController, 'destroy']) // Delete setting
  }).prefix('/settings').use(middleware.auth())
}).prefix('/api')
