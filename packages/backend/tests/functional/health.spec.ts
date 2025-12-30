import { test } from '@japa/runner'

test.group('Health Check', () => {
  test('GET /health should return OK', async ({ client }) => {
    const response = await client.get('/health')

    response.assertStatus(200)
    response.assertBodyContains({ status: 'ok' })
  })
})
