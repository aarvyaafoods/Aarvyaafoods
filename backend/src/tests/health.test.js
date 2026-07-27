import { describe, expect, it } from 'vitest'

describe('health', () => {
  it('returns ok', async () => {
    process.env.DATABASE_URL ||= 'postgresql://user:pass@localhost:5432/staffarc'
    process.env.JWT_ACCESS_SECRET ||= 'a'.repeat(32)
    process.env.JWT_REFRESH_SECRET ||= 'b'.repeat(32)
    const { buildApp } = await import('../app.js')
    const app = await buildApp()
    const res = await app.inject({ method: 'GET', url: '/health' })
    expect(res.statusCode).toBe(200)
    expect(res.json().success).toBe(true)
  }, 30000)
})
