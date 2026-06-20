/**
 * Basic smoke tests for Supabase client factory functions.
 *
 * These tests verify that the factory functions return a client-shaped object
 * without making real network calls. The actual Supabase URL and key are
 * mocked so no real credentials are required.
 */
import { vi, describe, it, expect, beforeEach } from 'vitest'

// ── Mock @supabase/ssr ───────────────────────────────────────────────────────
const mockClient = { from: vi.fn(), auth: { getUser: vi.fn() } }

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(() => mockClient),
  createServerClient: vi.fn(() => mockClient),
}))

// ── Mock next/headers ────────────────────────────────────────────────────────
const mockCookieStore = {
  getAll: vi.fn(() => []),
  set: vi.fn(),
}
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}))

// ── Provide env vars ─────────────────────────────────────────────────────────
beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
})

// ── Tests ────────────────────────────────────────────────────────────────────
describe('createClient (browser)', () => {
  it('returns a client object with a from() method', async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const client = createClient()
    expect(client).toBeDefined()
    expect(typeof client.from).toBe('function')
  })

  it('calls createBrowserClient with the env vars', async () => {
    const { createBrowserClient } = await import('@supabase/ssr')
    const { createClient } = await import('@/lib/supabase/client')
    createClient()
    expect(createBrowserClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key'
    )
  })
})

describe('createClient (server)', () => {
  it('returns a client object with a from() method', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const client = await createClient()
    expect(client).toBeDefined()
    expect(typeof client.from).toBe('function')
  })

  it('calls createServerClient with the env vars', async () => {
    const { createServerClient } = await import('@supabase/ssr')
    const { createClient } = await import('@/lib/supabase/server')
    await createClient()
    expect(createServerClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key',
      expect.objectContaining({ cookies: expect.any(Object) })
    )
  })

  it('cookie helpers delegate to the Next.js cookie store', async () => {
    const { createServerClient } = await import('@supabase/ssr')
    const { createClient } = await import('@/lib/supabase/server')
    await createClient()

    // Extract the cookies config passed to createServerClient
    const [, , options] = (createServerClient as ReturnType<typeof vi.fn>).mock
      .calls.at(-1)!
    const { getAll, setAll } = options.cookies

    getAll()
    expect(mockCookieStore.getAll).toHaveBeenCalled()

    setAll([{ name: 'sb-token', value: 'abc', options: {} }])
    expect(mockCookieStore.set).toHaveBeenCalledWith('sb-token', 'abc', {})
  })
})
