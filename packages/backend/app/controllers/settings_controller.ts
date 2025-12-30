import type { HttpContext } from '@adonisjs/core/http'
import Setting from '#models/setting'

export default class SettingsController {
  /**
   * Get all public settings
   */
  async index({ response }: HttpContext) {
    const settings = await Setting.query().where('is_public', true).orderBy('key', 'asc')

    const formattedSettings = settings.reduce(
      (acc, setting) => {
        acc[setting.key] = setting.getParsedValue()
        return acc
      },
      {} as Record<string, any>
    )

    return response.ok({
      success: true,
      settings: formattedSettings,
    })
  }

  /**
   * Get all settings (admin only)
   */
  async all({ response }: HttpContext) {
    const settings = await Setting.query().orderBy('key', 'asc')

    const formattedSettings = settings.map((setting) => ({
      id: setting.id,
      key: setting.key,
      value: setting.getParsedValue(),
      type: setting.type,
      description: setting.description,
      isPublic: setting.isPublic,
      isEncrypted: setting.isEncrypted,
      createdAt: setting.createdAt,
      updatedAt: setting.updatedAt,
    }))

    return response.ok({
      success: true,
      settings: formattedSettings,
    })
  }

  /**
   * Get a specific setting by key
   */
  async show({ params, response }: HttpContext) {
    const setting = await Setting.query().where('key', params.key).first()

    if (!setting) {
      return response.notFound({
        success: false,
        message: 'Setting not found',
      })
    }

    // Only return public settings or require admin authentication
    if (!setting.isPublic) {
      return response.forbidden({
        success: false,
        message: 'This setting is not public',
      })
    }

    return response.ok({
      success: true,
      setting: {
        key: setting.key,
        value: setting.getParsedValue(),
      },
    })
  }

  /**
   * Create or update a setting
   */
  async upsert({ request, response }: HttpContext) {
    const { key, value, type, description, isPublic, isEncrypted } = request.only([
      'key',
      'value',
      'type',
      'description',
      'isPublic',
      'isEncrypted',
    ])

    if (!key) {
      return response.badRequest({
        success: false,
        message: 'Key is required',
      })
    }

    let setting = await Setting.query().where('key', key).first()

    if (setting) {
      // Update existing
      if (type !== undefined) setting.type = type
      if (description !== undefined) setting.description = description
      if (isPublic !== undefined) setting.isPublic = isPublic
      if (isEncrypted !== undefined) setting.isEncrypted = isEncrypted
      if (value !== undefined) setting.setValue(value)
      await setting.save()
    } else {
      // Create new
      setting = new Setting()
      setting.key = key
      setting.type = type || 'string'
      setting.description = description || null
      setting.isPublic = isPublic || false
      setting.isEncrypted = isEncrypted || false
      setting.setValue(value)
      await setting.save()
    }

    return response.ok({
      success: true,
      setting: {
        id: setting.id,
        key: setting.key,
        value: setting.getParsedValue(),
        type: setting.type,
      },
    })
  }

  /**
   * Delete a setting
   */
  async destroy({ params, response }: HttpContext) {
    const setting = await Setting.query().where('key', params.key).first()

    if (!setting) {
      return response.notFound({
        success: false,
        message: 'Setting not found',
      })
    }

    await setting.delete()

    return response.ok({
      success: true,
      message: 'Setting deleted successfully',
    })
  }
}
