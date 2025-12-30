import { BaseCommand, args } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import User from '#models/user'

export default class CreateUser extends BaseCommand {
  static commandName = 'user:create'
  static description = 'Create a new user'

  static options: CommandOptions = {
    startApp: true,
  }

  @args.string({ description: 'User email' })
  declare email: string

  @args.string({ description: 'User password', required: false })
  declare password: string

  async run() {
    const { email, password } = this

    this.logger.info('Creating new user...')

    // Check if user exists
    const existing = await User.findBy('email', email)
    if (existing) {
      this.logger.error('User with this email already exists')
      return
    }

    // Prompt for password if not provided
    const userPassword = password || await this.prompt.ask('Enter password', {
      validate: (value) => value.length >= 8 || 'Password must be at least 8 characters',
    })

    const fullName = await this.prompt.ask('Enter full name (optional)', {
      required: false,
    })

    const phoneNumber = await this.prompt.ask('Enter phone number (optional)', {
      required: false,
    })

    const isAdmin = await this.prompt.confirm('Is this user an admin?', {
      default: false,
    })

    // Create user
    const user = await User.create({
      email,
      password: userPassword,
      fullName: fullName || null,
      phoneNumber: phoneNumber || null,
      isPhoneVerified: false,
      isEmailVerified: false,
      isAdmin,
    })

    this.logger.success(`User created successfully with ID: ${user.id}`)
    this.logger.info(`Email: ${user.email}`)
    if (user.fullName) {
      this.logger.info(`Name: ${user.fullName}`)
    }
    if (isAdmin) {
      this.logger.warning('User has admin privileges')
    }
  }
}
