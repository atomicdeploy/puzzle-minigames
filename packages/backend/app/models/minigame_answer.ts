import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class MinigameAnswer extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare minigameName: string

  @column()
  declare answerKey: string

  @column()
  declare answerValue: string

  @column()
  declare requiresAdminVerification: boolean

  @column()
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
