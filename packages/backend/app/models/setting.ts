import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Setting extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare key: string

  @column()
  declare value: string | null

  @column()
  declare type: 'string' | 'number' | 'boolean' | 'json'

  @column()
  declare description: string | null

  @column()
  declare isPublic: boolean

  @column()
  declare isEncrypted: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  /**
   * Get parsed value based on type
   */
  getParsedValue(): string | number | boolean | object | null {
    if (this.value === null) return null

    switch (this.type) {
      case 'number':
        return Number(this.value)
      case 'boolean':
        return this.value === 'true' || this.value === '1'
      case 'json':
        try {
          return JSON.parse(this.value)
        } catch {
          return null
        }
      default:
        return this.value
    }
  }

  /**
   * Set value with automatic type conversion
   */
  setValue(value: string | number | boolean | object | null): void {
    if (value === null) {
      this.value = null
      return
    }

    switch (this.type) {
      case 'json':
        this.value = typeof value === 'string' ? value : JSON.stringify(value)
        break
      case 'boolean':
        this.value = value ? '1' : '0'
        break
      default:
        this.value = String(value)
    }
  }
}
