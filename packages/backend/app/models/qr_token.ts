import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export default class QrToken extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare token: string

  @column()
  declare gameNumber: number

  @column()
  declare isActive: boolean

  @column()
  declare isUsed: boolean

  @column.dateTime()
  declare usedAt: DateTime | null

  @column()
  declare usedByUserId: number | null

  @column()
  declare accessCount: number

  @column.dateTime()
  declare firstAccessedAt: DateTime | null

  @column.dateTime()
  declare lastAccessedAt: DateTime | null

  @column()
  declare notes: string | null

  @column()
  declare metadata: Record<string, any> | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User, {
    foreignKey: 'usedByUserId',
  })
  declare usedByUser: BelongsTo<typeof User>
}
