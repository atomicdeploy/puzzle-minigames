import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('full_name').nullable()
      table.string('email', 254).notNullable().unique()
      table.string('phone_number', 20).nullable().unique()
      table.string('password', 180).notNullable()
      table.boolean('is_phone_verified').defaultTo(false)
      table.boolean('is_email_verified').defaultTo(false)
      table.text('device_info').nullable()
      table.text('user_agent').nullable()
      table.timestamp('last_login_at').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
