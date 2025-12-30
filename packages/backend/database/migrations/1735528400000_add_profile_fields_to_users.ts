import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Add profile fields for game registration
      table.date('birthday').nullable()
      table.enum('gender', ['male', 'female', 'other']).nullable()
      table.string('education_level', 50).nullable()
      table.string('field_of_study', 255).nullable()
      table.string('color', 20).nullable()
      table.text('profile_picture').nullable()
      table.string('player_id', 255).nullable().unique()
      
      // Note: player_id unique constraint automatically creates an index
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('birthday')
      table.dropColumn('gender')
      table.dropColumn('education_level')
      table.dropColumn('field_of_study')
      table.dropColumn('color')
      table.dropColumn('profile_picture')
      table.dropColumn('player_id')
    })
  }
}
