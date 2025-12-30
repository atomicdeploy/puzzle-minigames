import router from '@adonisjs/core/services/router'
import server from '@adonisjs/core/services/server'

server.errorHandler(() => import('#exceptions/handler'))

server.use([
  () => import('@adonisjs/core/bodyparser_middleware'),
  () => import('@adonisjs/cors/cors_middleware'),
  () => import('@adonisjs/session/session_middleware'),
])

router.use([
  () => import('#middleware/container_bindings_middleware'),
  () => import('#middleware/auth_middleware'),
])
