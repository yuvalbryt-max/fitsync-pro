/**
 * Unit tests for middleware redirect logic.
 *
 * The middleware has three decision branches:
 *   1. No user + non-auth + non-API route  → redirect to /auth/login
 *   2. Authenticated user on /auth/login   → redirect to /
 *   3. Everything else                     → pass through
 *
 * We test the pure decision logic without importing the actual middleware
 * (which depends on Next.js edge runtime and @supabase/ssr). This keeps
 * the tests fast and runnable in jsdom/vitest.
 */

import { describe, it, expect } from 'vitest'

// ---------------------------------------------------------------------------
// Pure redirect-decision logic extracted from middleware.ts
// ---------------------------------------------------------------------------
type Decision = 'redirect-login' | 'redirect-home' | 'pass'

function middlewareDecision(
  pathname: string,
  user: { id: string } | null
): Decision {
  const isAuthRoute = pathname.startsWith('/auth')
  const isApiRoute = pathname.startsWith('/api')

  if (!user && !isAuthRoute && !isApiRoute) return 'redirect-login'
  if (user && pathname === '/auth/login') return 'redirect-home'
  return 'pass'
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('middleware redirect logic', () => {
  const authed = { id: 'user-123' }

  describe('unauthenticated user', () => {
    it('redirects / to /auth/login', () => {
      expect(middlewareDecision('/', null)).toBe('redirect-login')
    })

    it('redirects /dashboard to /auth/login', () => {
      expect(middlewareDecision('/dashboard', null)).toBe('redirect-login')
    })

    it('redirects /workouts/new to /auth/login', () => {
      expect(middlewareDecision('/workouts/new', null)).toBe('redirect-login')
    })

    it('passes through /auth/login (already on login)', () => {
      expect(middlewareDecision('/auth/login', null)).toBe('pass')
    })

    it('passes through /auth/callback (OTP exchange)', () => {
      expect(middlewareDecision('/auth/callback', null)).toBe('pass')
    })

    it('passes through /api/health (API routes are public)', () => {
      expect(middlewareDecision('/api/health', null)).toBe('pass')
    })

    it('passes through /api/webhooks/supabase', () => {
      expect(middlewareDecision('/api/webhooks/supabase', null)).toBe('pass')
    })
  })

  describe('authenticated user', () => {
    it('redirects /auth/login to / (already logged in)', () => {
      expect(middlewareDecision('/auth/login', authed)).toBe('redirect-home')
    })

    it('passes through / (dashboard)', () => {
      expect(middlewareDecision('/', authed)).toBe('pass')
    })

    it('passes through /workouts', () => {
      expect(middlewareDecision('/workouts', authed)).toBe('pass')
    })

    it('passes through /auth/callback (code exchange)', () => {
      expect(middlewareDecision('/auth/callback', authed)).toBe('pass')
    })

    it('passes through /api/data', () => {
      expect(middlewareDecision('/api/data', authed)).toBe('pass')
    })
  })
})
