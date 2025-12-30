import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'answer_submissions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('user_id').unsigned().notNullable()
      table.string('minigame_name', 100).notNullable()
      table.text('submitted_answer').notNullable()
      table.boolean('is_correct').defaultTo(false)
      table.enum('verification_status', ['pending', 'approved', 'rejected', 'instant']).defaultTo('instant')
      table.integer('verified_by').unsigned().nullable()
      table.timestamp('verified_at').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      table.foreign('user_id').references('users.id').onDelete('CASCADE')
      table.foreign('verified_by').references('users.id').onDelete('SET NULL')
      table.index('user_id')
      table.index('minigame_name')
      table.index('verification_status')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
