import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'otps'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('user_id').unsigned().nullable()
      table.string('phone_number', 20).notNullable()
      table.string('code', 10).notNullable()
      table.string('session_id', 255).nullable().unique()
      table.boolean('is_used').defaultTo(false)
      table.timestamp('expires_at').notNullable()
      table.timestamp('created_at').notNullable()

      table.foreign('user_id').references('users.id').onDelete('CASCADE')
      table.index('phone_number')
      table.index('session_id')
      table.index(['phone_number', 'code', 'is_used'])
      table.index('expires_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
