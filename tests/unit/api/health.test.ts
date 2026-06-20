import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock NextResponse before importing the route
vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown) => ({
      _body: body,
      json: async () => body,
    }),
  },
}))

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T10:00:00.000Z'))
  })

  it('returns status ok', async () => {
    const { GET } = await import('@/app/api/health/route')
    const response = await GET()
    const body = await response.json()
    expect(body.status).toBe('ok')
  })

  it('returns an ISO timestamp string', async () => {
    const { GET } = await import('@/app/api/health/route')
    const response = await GET()
    const body = await response.json()
    expect(typeof body.ts).toBe('string')
    expect(() => new Date(body.ts)).not.toThrow()
    expect(new Date(body.ts).toISOString()).toBe(body.ts)
  })

  it('ts reflects current time', async () => {
    const { GET } = await import('@/app/api/health/route')
    const response = await GET()
    const body = await response.json()
    expect(body.ts).toBe('2024-01-15T10:00:00.000Z')
  })
})
