import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export default class Otp extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number | null

  @column()
  declare phoneNumber: string

  @column()
  declare code: string

  @column()
  declare sessionId: string | null

  @column()
  declare isUsed: boolean

  @column.dateTime()
  declare expiresAt: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
