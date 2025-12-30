import { test } from '@japa/runner'
import Setting from '#models/setting'
import Database from '@adonisjs/lucid/services/db'

test.group('Settings', (group) => {
  // Clean up after each test
  group.each.teardown(async () => {
    await Database.from('settings').delete()
  })

  test('should create a new setting', async ({ assert }) => {
    const setting = new Setting()
    setting.key = 'test_setting'
    setting.setValue('test_value')
    setting.type = 'string'
    setting.isPublic = true
    await setting.save()

    assert.exists(setting.id)
    assert.equal(setting.key, 'test_setting')
    assert.equal(setting.value, 'test_value')
  })

  test('should get parsed value for string type', async ({ assert }) => {
    const setting = new Setting()
    setting.key = 'string_setting'
    setting.type = 'string'
    setting.setValue('hello')
    await setting.save()

    assert.equal(setting.getParsedValue(), 'hello')
  })

  test('should get parsed value for number type', async ({ assert }) => {
    const setting = new Setting()
    setting.key = 'number_setting'
    setting.type = 'number'
    setting.setValue(42)
    await setting.save()

    const parsed = setting.getParsedValue()
    assert.equal(parsed, 42)
    assert.isNumber(parsed)
  })

  test('should get parsed value for boolean type', async ({ assert }) => {
    const setting = new Setting()
    setting.key = 'boolean_setting'
    setting.type = 'boolean'
    setting.setValue(true)
    await setting.save()

    const parsed = setting.getParsedValue()
    assert.equal(parsed, true)
    assert.isBoolean(parsed)
  })

  test('should get parsed value for json type', async ({ assert }) => {
    const setting = new Setting()
    setting.key = 'json_setting'
    setting.type = 'json'
    const jsonData = { foo: 'bar', count: 42 }
    setting.setValue(jsonData)
    await setting.save()

    const parsed = setting.getParsedValue()
    assert.deepEqual(parsed, jsonData)
  })

  test('should handle null values', async ({ assert }) => {
    const setting = new Setting()
    setting.key = 'null_setting'
    setting.type = 'string'
    setting.setValue(null)
    await setting.save()

    assert.isNull(setting.getParsedValue())
  })

  test('should update existing setting', async ({ assert }) => {
    const setting = new Setting()
    setting.key = 'update_test'
    setting.type = 'string'
    setting.setValue('initial')
    await setting.save()

    const initialId = setting.id

    setting.setValue('updated')
    await setting.save()

    assert.equal(setting.id, initialId)
    assert.equal(setting.getParsedValue(), 'updated')
  })

  test('should enforce unique keys', async ({ assert }) => {
    const setting1 = new Setting()
    setting1.key = 'unique_key'
    setting1.type = 'string'
    setting1.setValue('value1')
    await setting1.save()

    const setting2 = new Setting()
    setting2.key = 'unique_key'
    setting2.type = 'string'
    setting2.setValue('value2')

    await assert.rejects(
      async () => await setting2.save(),
      'Should not allow duplicate keys'
    )
  })
})
