import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'minigame_answers'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('minigame_name', 100).notNullable()
      table.string('answer_key', 100).notNullable()
      table.text('answer_value').notNullable()
      table.boolean('requires_admin_verification').defaultTo(false)
      table.boolean('is_active').defaultTo(true)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      table.unique(['minigame_name', 'answer_key'])
      table.index('minigame_name')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
