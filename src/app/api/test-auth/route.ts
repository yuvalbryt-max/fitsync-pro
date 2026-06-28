/**
 * DEV-ONLY: E2E test authentication.
 * Creates a test user, exchanges magic-link token for a FULL session,
 * stores it as a properly-formatted SSR cookie, and redirects to /.
 * Returns 403 in production — safe to keep in codebase.
 */
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available' }, { status: 403 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const serviceKey  = process.env.SUPABASE_SERVICE_KEY!
  const testEmail   = 'playwright-e2e@fitsync-test.local'
  const origin      = new URL(request.url).origin

  try {
    const { createClient } = await import('@supabase/supabase-js')
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Ensure test user exists (ignore already-exists errors)
    await admin.auth.admin.createUser({
      email: testEmail, password: 'PlaywrightE2E2026!', email_confirm: true,
    })

    // Generate fresh magic link
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: 'magiclink', email: testEmail,
    })
    if (linkErr || !linkData?.properties?.hashed_token) {
      throw new Error(`generateLink: ${linkErr?.message ?? 'no token'}`)
    }

    // Ensure profile row exists
    if (linkData.user?.id) {
      await admin.from('users').upsert(
        { id: linkData.user.id, email: testEmail, name: 'Playwright Test' },
        { onConflict: 'id' }
      )
    }

    // Exchange token for FULL session (includes expires_at, expires_in, user)
    const verifyRes = await fetch(`${supabaseUrl}/auth/v1/verify`, {
      method: 'POST',
      headers: { apikey: anonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'magiclink', token_hash: linkData.properties.hashed_token }),
    })
    if (!verifyRes.ok) throw new Error(`verify ${verifyRes.status}: ${await verifyRes.text()}`)

    // The full session object — exactly what auth-js stores
    const fullSession = await verifyRes.json() as {
      access_token: string; refresh_token: string; token_type: string
      expires_in: number; expires_at: number; user: Record<string, unknown>
    }
    if (!fullSession.access_token) throw new Error('No access_token in verify response')

    // Ensure profile for the verified user ID
    if (fullSession.user?.id) {
      await admin.from('users').upsert(
        { id: fullSession.user.id as string, email: testEmail, name: 'Playwright Test' },
        { onConflict: 'id' }
      )
    }

    // Format: base64-encode the JSON (handles large JWTs without chunking)
    const sessionJson = JSON.stringify(fullSession)
    const cookieValue = 'base64-' + Buffer.from(sessionJson).toString('base64url')
    const projectRef  = new URL(supabaseUrl).hostname.split('.')[0]
    const cookieName  = `sb-${projectRef}-auth-token`

    const response = NextResponse.redirect(new URL('/', origin))
    response.cookies.set(cookieName, cookieValue, {
      path: '/', sameSite: 'lax', httpOnly: true, secure: false,
      maxAge: fullSession.expires_in ?? 3600,
    })
    return response
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}