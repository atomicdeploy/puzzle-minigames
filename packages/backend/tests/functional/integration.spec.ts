import { test } from '@japa/runner'
import User from '#models/user'
import Database from '@adonisjs/lucid/services/db'

/**
 * Helper function to extract session cookie value from set-cookie header
 */
function extractSessionCookie(setCookieHeader: string | string[] | undefined): string {
  if (!setCookieHeader) return ''
  
  const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader]
  const sessionCookie = cookies.find((cookie) => cookie.startsWith('adonis-session='))
  
  if (!sessionCookie) return ''
  
  // Extract just the value part (between = and ;)
  const match = sessionCookie.match(/adonis-session=([^;]+)/)
  return match ? match[1] : ''
}

test.group('Full Integration Tests', (group) => {
  // Test users data
  const testUsers = [
    {
      email: 'alice@example.com',
      password: 'SecurePassword123!',
      fullName: 'Alice Johnson',
    },
    {
      email: 'bob@example.com',
      password: 'SecurePassword456!',
      fullName: 'Bob Smith',
    },
    {
      email: 'charlie@example.com',
      password: 'SecurePassword789!',
      fullName: 'Charlie Brown',
    },
  ]

  // Clean up after tests
  group.each.teardown(async () => {
    await Database.from('users')
      .whereIn(
        'email',
        testUsers.map((u) => u.email)
      )
      .delete()
  })

  test('should register multiple users successfully', async ({ client, assert }) => {
    const registeredUsers = []

    for (const userData of testUsers) {
      const response = await client.post('/api/auth/register').json(userData)

      response.assertStatus(201)
      response.assertBodyContains({ success: true })
      assert.properties(response.body(), ['user'])

      const body = response.body()
      assert.equal(body.user.email, userData.email)
      assert.equal(body.user.fullName, userData.fullName)

      registeredUsers.push(body.user)
    }

    assert.lengthOf(registeredUsers, testUsers.length)
  })

  test('should login with registered users', async ({ client, assert }) => {
    // First register users
    for (const userData of testUsers) {
      await client.post('/api/auth/register').json(userData)
    }

    // Then try to login with each user
    for (const userData of testUsers) {
      const response = await client.post('/api/auth/login').json({
        email: userData.email,
        password: userData.password,
      })

      response.assertStatus(200)
      response.assertBodyContains({ success: true })
      assert.properties(response.body(), ['user'])

      const body = response.body()
      assert.equal(body.user.email, userData.email)
    }
  })

  test('should reject login with wrong password', async ({ client, assert }) => {
    const userData = testUsers[0]

    // Register user
    await client.post('/api/auth/register').json(userData)

    // Try to login with wrong password
    const response = await client.post('/api/auth/login').json({
      email: userData.email,
      password: 'WrongPassword123!',
    })

    response.assertStatus(401)
  })

  test('should create and retrieve user profile', async ({ client, assert }) => {
    const userData = testUsers[0]

    // Register user
    await client.post('/api/auth/register').json(userData)

    // Login
    const loginResponse = await client.post('/api/auth/login').json({
      email: userData.email,
      password: userData.password,
    })

    const cookie = extractSessionCookie(loginResponse.headers()['set-cookie'])

    // Get profile
    const profileResponse = await client.get('/api/users/profile').cookie('adonis-session', cookie)

    profileResponse.assertStatus(200)
    assert.equal(profileResponse.body().user.email, userData.email)
    assert.equal(profileResponse.body().user.fullName, userData.fullName)
  })

  test('should create player progress for authenticated user', async ({ client, assert }) => {
    const userData = testUsers[0]

    // Register and login
    await client.post('/api/auth/register').json(userData)
    const loginResponse = await client.post('/api/auth/login').json({
      email: userData.email,
      password: userData.password,
    })

    const cookie = extractSessionCookie(loginResponse.headers()['set-cookie'])

    // Save progress
    const progressData = {
      discoveredPuzzles: [1, 2, 3],
      puzzleBoard: [1, null, 3, null, 5, null, 7, null, 9],
      score: 150,
    }

    const saveResponse = await client
      .post('/api/players/progress')
      .cookie('adonis-session', cookie)
      .json(progressData)

    saveResponse.assertStatus(200)
    saveResponse.assertBodyContains({ success: true })

    // Retrieve progress
    const getResponse = await client
      .get('/api/players/progress')
      .cookie('adonis-session', cookie)

    getResponse.assertStatus(200)
    assert.deepEqual(getResponse.body().progress.discoveredPuzzles, [1, 2, 3])
    assert.equal(getResponse.body().progress.score, 150)
  })

  test('should get leaderboard with registered users', async ({ client, assert }) => {
    // Register multiple users with different scores
    for (const userData of testUsers) {
      await client.post('/api/auth/register').json(userData)
      const loginResponse = await client.post('/api/auth/login').json({
        email: userData.email,
        password: userData.password,
      })

      const cookie = extractSessionCookie(loginResponse.headers()['set-cookie'])

      // Save progress with different scores
      const score = testUsers.indexOf(userData) * 100 + 50
      await client
        .post('/api/players/progress')
        .cookie('adonis-session', cookie)
        .json({
          discoveredPuzzles: [1, 2, 3],
          puzzleBoard: [],
          score: score,
        })
    }

    // Get leaderboard
    const response = await client.get('/api/leaderboard')

    response.assertStatus(200)
    assert.isArray(response.body().leaderboard)
    assert.isAtLeast(response.body().leaderboard.length, testUsers.length)
  })

  test('should verify users exist in database', async ({ assert }) => {
    // Register users through API
    for (const userData of testUsers) {
      const user = new User()
      user.email = userData.email
      user.fullName = userData.fullName
      user.password = userData.password
      await user.save()
    }

    // Verify users exist in database
    const users = await User.query().whereIn(
      'email',
      testUsers.map((u) => u.email)
    )

    assert.lengthOf(users, testUsers.length)

    for (const user of users) {
      const testUser = testUsers.find((u) => u.email === user.email)
      assert.exists(testUser)
      assert.equal(user.fullName, testUser!.fullName)
    }
  })
})
