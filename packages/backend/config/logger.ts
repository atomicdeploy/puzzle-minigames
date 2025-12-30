import { defineConfig, targets } from '@adonisjs/core/logger'
import env from '#start/env'
import app from '#config/app'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Read app name from package.json
const packageJsonPath = fileURLToPath(new URL('../package.json', import.meta.url))
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
const appName = packageJson.name || 'adonisjs'

const loggerConfig = defineConfig({
  default: 'app',

  loggers: {
    app: {
      enabled: true,
      name: appName,
      level: env.get('LOG_LEVEL'),
      transport: {
        targets: targets()
          .pushIf(!app.inProduction, targets.pretty())
          .pushIf(app.inProduction, targets.file({ destination: 1 }))
          .toArray(),
      },
    },
  },
})

export default loggerConfig

declare module '@adonisjs/core/types' {
  export interface LoggersList extends InferLoggers<typeof loggerConfig> {}
}
