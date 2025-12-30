import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export default class UserSession extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number | null

  @column()
  declare sessionToken: string

  @column()
  declare ipAddress: string | null

  @column()
  declare userAgent: string | null

  @column()
  declare deviceInfo: string | null

  @column()
  declare isActive: boolean

  @column.dateTime()
  declare expiresAt: DateTime

  // Enhanced client information
  @column()
  declare realIp: string | null

  @column()
  declare forwardedFor: string | null

  @column()
  declare browser: string | null

  @column()
  declare browserVersion: string | null

  @column()
  declare os: string | null

  @column()
  declare osVersion: string | null

  @column()
  declare device: string | null

  @column()
  declare deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown'

  @column()
  declare deviceVendor: string | null

  @column()
  declare screenResolution: string | null

  @column()
  declare colorDepth: number | null

  @column()
  declare pixelRatio: number | null

  @column()
  declare touchSupport: boolean

  @column()
  declare platform: string | null

  @column()
  declare language: string | null

  @column()
  declare languages: string[] | null

  @column()
  declare timezone: string | null

  @column()
  declare timezoneOffset: number | null

  @column()
  declare connectionType: string | null

  @column()
  declare clientInfoJson: Record<string, any> | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
