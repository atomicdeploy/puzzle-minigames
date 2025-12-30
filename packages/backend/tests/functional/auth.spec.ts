import { test } from '@japa/runner'

test.group('Authentication', (group) => {
  test('POST /api/auth/register should create a new user', async ({ client, assert }) => {
    const userData = {
      email: `test${Date.now()}@example.com`,
      password: 'password123',
      fullName: 'Test User',
    }

    const response = await client.post('/api/auth/register').json(userData)

    response.assertStatus(201)
    response.assertBodyContains({ success: true })
    assert.properties(response.body(), ['user'])
  })

  test('POST /api/auth/login should authenticate user', async ({ client }) => {
    // Create user first
    const userData = {
      email: `login${Date.now()}@example.com`,
      password: 'password123',
    }

    await client.post('/api/auth/register').json(userData)

    // Login
    const response = await client.post('/api/auth/login').json({
      email: userData.email,
      password: userData.password,
    })

    response.assertStatus(200)
    response.assertBodyContains({ success: true })
  })
})
