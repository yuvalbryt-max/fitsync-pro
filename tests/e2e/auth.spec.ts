import { test, expect } from '@playwright/test'

// ─── Auth guard ────────────────────────────────────────────────────────────

test.describe('auth guard', () => {
  const protectedRoutes = ['/', '/nutrition', '/training', '/analytics', '/body/weight', '/ai']

  for (const route of protectedRoutes) {
    test(`unauthenticated user on ${route} → redirected to /auth/login`, async ({ page }) => {
      await page.goto(route)
      await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 })
    })
  }

  test('already-on-login page stays on login when unauthenticated', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page).toHaveURL('/auth/login')
  })
})

// ─── Login page ────────────────────────────────────────────────────────────

test.describe('login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')
  })

  test('has correct page title', async ({ page }) => {
    await expect(page).toHaveTitle('FitSync Pro')
  })

  test('shows FitSync Pro branding', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'FitSync Pro' })).toBeVisible()
    await expect(page.getByText('פלטפורמת הכושר האישית שלך')).toBeVisible()
  })

  test('has accessible main landmark', async ({ page }) => {
    const main = page.getByRole('main')
    await expect(main).toBeVisible()
  })

  test('has email input with label', async ({ page }) => {
    const label = page.getByText('כתובת אימייל')
    await expect(label).toBeVisible()
    const input = page.getByRole('textbox', { name: 'כתובת אימייל' })
    await expect(input).toBeVisible()
  })

  test('submit button disabled when email is empty', async ({ page }) => {
    const btn = page.getByRole('button', { name: 'שלח קישור כניסה' })
    await expect(btn).toBeDisabled()
  })

  test('submit button enabled after typing valid email', async ({ page }) => {
    await page.getByRole('textbox', { name: 'כתובת אימייל' }).fill('test@example.com')
    const btn = page.getByRole('button', { name: 'שלח קישור כניסה' })
    await expect(btn).toBeEnabled()
  })

  test('shows 0 console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
    await page.goto('/auth/login')
    await page.waitForLoadState('networkidle')
    expect(errors).toHaveLength(0)
  })
})

// ─── API routes ────────────────────────────────────────────────────────────

test.describe('API routes', () => {
  test('GET /api/health returns 200 with status ok', async ({ request }) => {
    const r = await request.get('/api/health')
    expect(r.status()).toBe(200)
    const body = await r.json()
    expect(body.status).toBe('ok')
    expect(typeof body.ts).toBe('string')
  })

  const protectedApiRoutes = [
    { method: 'GET',  url: '/api/body/weight' },
    { method: 'GET',  url: '/api/nutrition/manual' },
    { method: 'GET',  url: '/api/ai/chat' },
  ]

  for (const { method, url } of protectedApiRoutes) {
    test(`${method} ${url} returns 401 when unauthenticated`, async ({ request }) => {
      const r = method === 'GET'
        ? await request.get(url)
        : await request.post(url, { data: {} })
      expect(r.status()).toBe(401)
      const body = await r.json()
      expect(body.error).toBe('Unauthorized')
    })
  }
})

// ─── Input validation ──────────────────────────────────────────────────────

test.describe('API input validation (unauthenticated — returns 401, not 500)', () => {
  test('POST /api/nutrition/manual with no body returns 401', async ({ request }) => {
    const r = await request.post('/api/nutrition/manual', { data: {} })
    expect(r.status()).toBe(401)
  })

  test('POST /api/body/weight with no body returns 401', async ({ request }) => {
    const r = await request.post('/api/body/weight', { data: {} })
    expect(r.status()).toBe(401)
  })

  test('DELETE /api/nutrition/manual without id returns 401', async ({ request }) => {
    const r = await request.delete('/api/nutrition/manual')
    expect(r.status()).toBe(401)
  })
})

// ─── Security ──────────────────────────────────────────────────────────────

test.describe('security headers', () => {
  test('response includes required security headers', async ({ request }) => {
    const r = await request.get('/api/health')
    expect(r.headers()['x-frame-options']).toBe('DENY')
    expect(r.headers()['x-content-type-options']).toBe('nosniff')
    expect(r.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin')
    expect(r.headers()['content-security-policy']).toContain("default-src 'self'")
    expect(r.headers()['permissions-policy']).toContain('camera=(self)')
  })
})

// ─── PWA ───────────────────────────────────────────────────────────────────

test.describe('PWA manifest', () => {
  test('manifest.json is accessible and valid', async ({ request }) => {
    const r = await request.get('/manifest.json')
    expect(r.status()).toBe(200)
    const body = await r.json()
    expect(body.name).toBe('FitSync Pro')
    expect(body.lang).toBe('he')
    expect(body.dir).toBe('rtl')
    expect(body.display).toBe('standalone')
    const purposes = body.icons.map((i: { purpose?: string }) => i.purpose)
    expect(purposes).not.toContain('apple-touch-icon')
  })

  test('service worker sw.js is accessible', async ({ request }) => {
    const r = await request.get('/sw.js')
    expect(r.status()).toBe(200)
  })
})

// ─── Responsive / mobile ───────────────────────────────────────────────────

test.describe('mobile responsive', () => {
  test('login page renders correctly at 390px width', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/auth/login')
    await expect(page.getByRole('heading', { name: 'FitSync Pro' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'שלח קישור כניסה' })).toBeVisible()
  })
})
