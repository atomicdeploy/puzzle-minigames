import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'qr_access_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      
      // QR token reference
      table.integer('qr_token_id').unsigned().nullable()
      table.string('token', 255).notNullable()
      table.integer('game_number').notNullable()
      
      // User info
      table.integer('user_id').unsigned().nullable()
      table.string('session_token', 255).nullable()
      
      // Access details
      table.enum('access_status', ['granted', 'denied', 'invalid']).notNullable()
      table.string('denial_reason', 255).nullable()
      
      // Client information
      table.string('ip_address', 45).nullable()
      table.string('real_ip', 45).nullable()
      table.text('user_agent').nullable()
      table.string('device_type', 50).nullable()
      table.string('browser', 100).nullable()
      table.string('os', 100).nullable()
      
      // Complete client info
      table.json('client_info').nullable()
      
      // Timestamps
      table.timestamp('accessed_at', { useTz: true }).notNullable()
      table.timestamp('created_at', { useTz: true })
      
      // Foreign keys
      table.foreign('qr_token_id').references('qr_tokens.id').onDelete('SET NULL')
      table.foreign('user_id').references('users.id').onDelete('SET NULL')
      
      // Indexes
      table.index('token')
      table.index('game_number')
      table.index('user_id')
      table.index('access_status')
      table.index('accessed_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
