import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import QrToken from '#models/qr_token'

export default class QrAccessLog extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare qrTokenId: number | null

  @column()
  declare token: string

  @column()
  declare gameNumber: number

  @column()
  declare userId: number | null

  @column()
  declare sessionToken: string | null

  @column()
  declare accessStatus: 'granted' | 'denied' | 'invalid'

  @column()
  declare denialReason: string | null

  @column()
  declare ipAddress: string | null

  @column()
  declare realIp: string | null

  @column()
  declare userAgent: string | null

  @column()
  declare deviceType: string | null

  @column()
  declare browser: string | null

  @column()
  declare os: string | null

  @column()
  declare clientInfo: Record<string, any> | null

  @column.dateTime()
  declare accessedAt: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => QrToken, {
    foreignKey: 'qrTokenId',
  })
  declare qrToken: BelongsTo<typeof QrToken>

  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare user: BelongsTo<typeof User>
}
