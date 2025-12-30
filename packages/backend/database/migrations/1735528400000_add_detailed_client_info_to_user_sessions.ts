import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'user_sessions'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Real IP and forwarded information
      table.string('real_ip', 45).nullable()
      table.text('forwarded_for').nullable()
      
      // Browser and OS details
      table.string('browser', 100).nullable()
      table.string('browser_version', 50).nullable()
      table.string('os', 100).nullable()
      table.string('os_version', 50).nullable()
      
      // Device details
      table.string('device', 100).nullable()
      table.enum('device_type', ['mobile', 'tablet', 'desktop', 'unknown']).defaultTo('unknown')
      table.string('device_vendor', 100).nullable()
      
      // Screen and hardware
      table.string('screen_resolution', 50).nullable()
      table.integer('color_depth').nullable()
      table.decimal('pixel_ratio', 3, 2).nullable()
      table.boolean('touch_support').defaultTo(false)
      
      // Browser capabilities
      table.string('platform', 100).nullable()
      table.string('language', 10).nullable()
      table.json('languages').nullable()
      table.string('timezone', 100).nullable()
      table.integer('timezone_offset').nullable()
      
      // Connection info
      table.string('connection_type', 50).nullable()
      
      // Full client info JSON for future flexibility
      table.json('client_info_json').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('real_ip')
      table.dropColumn('forwarded_for')
      table.dropColumn('browser')
      table.dropColumn('browser_version')
      table.dropColumn('os')
      table.dropColumn('os_version')
      table.dropColumn('device')
      table.dropColumn('device_type')
      table.dropColumn('device_vendor')
      table.dropColumn('screen_resolution')
      table.dropColumn('color_depth')
      table.dropColumn('pixel_ratio')
      table.dropColumn('touch_support')
      table.dropColumn('platform')
      table.dropColumn('language')
      table.dropColumn('languages')
      table.dropColumn('timezone')
      table.dropColumn('timezone_offset')
      table.dropColumn('connection_type')
      table.dropColumn('client_info_json')
    })
  }
}
