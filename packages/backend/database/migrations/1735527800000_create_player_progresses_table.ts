import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'player_progresses'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('user_id').unsigned().notNullable()
      table.json('discovered_puzzles').notNullable().defaultTo('[]')
      table.json('puzzle_board').notNullable().defaultTo('[]')
      table.integer('score').defaultTo(0)
      table.integer('completed_games').defaultTo(0)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      table.foreign('user_id').references('users.id').onDelete('CASCADE')
      table.index('user_id')
      table.index(['score', 'id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
