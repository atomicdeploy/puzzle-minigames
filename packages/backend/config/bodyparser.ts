import { defineConfig } from '@adonisjs/core/bodyparser'

export default defineConfig({
  allowedMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],

  form: {
    convertEmptyStringsToNull: true,
  },

  json: {
    convertEmptyStringsToNull: true,
  },

  multipart: {
    convertEmptyStringsToNull: true,
    maxFields: 1000,
    limit: '20mb',
  },

  raw: {},
})
