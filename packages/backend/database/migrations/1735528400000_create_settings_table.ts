import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'settings'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('key', 255).notNullable().unique()
      table.text('value').nullable()
      table.string('type', 50).defaultTo('string') // string, number, boolean, json
      table.text('description').nullable()
      table.boolean('is_public').defaultTo(false) // whether this setting can be exposed to frontend
      table.boolean('is_encrypted').defaultTo(false) // whether this value is encrypted
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
