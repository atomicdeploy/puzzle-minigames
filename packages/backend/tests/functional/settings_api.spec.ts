import { test } from '@japa/runner'

test.group('Settings API', () => {
  test('GET /api/settings should return public settings', async ({ client }) => {
    const response = await client.get('/api/settings')

    response.assertStatus(200)
    response.assertBodyContains({ success: true })
  })

  test('POST /api/settings/upsert should create a new setting (authenticated)', async ({
    client,
  }) => {
    // First register and login
    const userData = {
      email: `settings${Date.now()}@example.com`,
      password: 'password123',
    }

    await client.post('/api/auth/register').json(userData)
    const loginResponse = await client.post('/api/auth/login').json(userData)

    // Extract cookie for authentication
    const cookie = loginResponse.headers()['set-cookie']

    // Create setting
    const settingData = {
      key: 'test_api_setting',
      value: 'test_value',
      type: 'string',
      description: 'Test setting from API',
      isPublic: true,
    }

    const response = await client
      .post('/api/settings/upsert')
      .cookie('adonis-session', cookie)
      .json(settingData)

    response.assertStatus(200)
    response.assertBodyContains({ success: true })
  })

  test('GET /api/settings/:key should return specific public setting', async ({ client }) => {
    // First create a public setting
    const userData = {
      email: `settingkey${Date.now()}@example.com`,
      password: 'password123',
    }

    await client.post('/api/auth/register').json(userData)
    const loginResponse = await client.post('/api/auth/login').json(userData)
    const cookie = loginResponse.headers()['set-cookie']

    const settingData = {
      key: 'public_setting_key',
      value: 'public_value',
      type: 'string',
      isPublic: true,
    }

    await client
      .post('/api/settings/upsert')
      .cookie('adonis-session', cookie)
      .json(settingData)

    // Now get it without authentication
    const response = await client.get('/api/settings/public_setting_key')

    response.assertStatus(200)
    response.assertBodyContains({ success: true })
  })
})
