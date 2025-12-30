import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'qr_tokens'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      
      // Token and game info
      table.string('token', 255).notNullable().unique()
      table.integer('game_number').notNullable()
      
      // Status
      table.boolean('is_active').defaultTo(true)
      table.boolean('is_used').defaultTo(false)
      table.timestamp('used_at').nullable()
      table.integer('used_by_user_id').unsigned().nullable()
      
      // Access tracking
      table.integer('access_count').defaultTo(0)
      table.timestamp('first_accessed_at').nullable()
      table.timestamp('last_accessed_at').nullable()
      
      // Metadata
      table.text('notes').nullable()
      table.json('metadata').nullable()
      
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
      
      // Foreign keys
      table.foreign('used_by_user_id').references('users.id').onDelete('SET NULL')
      
      // Indexes
      table.index('token')
      table.index('game_number')
      table.index(['is_active', 'is_used'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
