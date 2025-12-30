import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import PlayerProgress from '#models/player_progress'
import UserSession from '#models/user_session'
import PageVisit from '#models/page_visit'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email', 'phoneNumber'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare fullName: string | null

  @column()
  declare email: string

  @column()
  declare phoneNumber: string | null

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare isPhoneVerified: boolean

  @column()
  declare isEmailVerified: boolean

  @column()
  declare isAdmin: boolean

  @column()
  declare birthday: string | null

  @column()
  declare gender: 'male' | 'female' | 'other' | null

  @column()
  declare educationLevel: string | null

  @column()
  declare fieldOfStudy: string | null

  @column()
  declare color: string | null

  @column()
  declare profilePicture: string | null

  @column()
  declare playerId: string | null

  @column()
  declare deviceInfo: string | null

  @column()
  declare userAgent: string | null

  @column()
  declare lastLoginAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => PlayerProgress)
  declare progress: HasMany<typeof PlayerProgress>

  @hasMany(() => UserSession)
  declare sessions: HasMany<typeof UserSession>

  @hasMany(() => PageVisit)
  declare visits: HasMany<typeof PageVisit>
}
