import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'page_visits'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('user_id').unsigned().nullable()
      table.string('session_token', 255).nullable()
      table.string('page_path', 500).notNullable()
      table.string('page_title', 500).nullable()
      table.string('referrer', 500).nullable()
      table.string('ip_address', 50).nullable()
      table.text('user_agent').nullable()
      table.text('device_info').nullable()
      table.timestamp('created_at').notNullable()

      table.foreign('user_id').references('users.id').onDelete('SET NULL')
      table.index('user_id')
      table.index('session_token')
      table.index('created_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
