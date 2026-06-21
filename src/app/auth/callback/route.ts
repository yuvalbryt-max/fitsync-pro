import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  // Use env-configured origin to prevent open redirect via Host header spoofing
  const origin = process.env.NEXT_PUBLIC_SITE_URL || ALLOWED_ORIGIN
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      const email = data.user.email
      if (!email) {
        return NextResponse.redirect(`${origin}/auth/login?error=no_email`)
      }
      try {
        await supabase.from('users').upsert(
          { id: data.user.id, email, name: data.user.user_metadata?.name ?? null },
          { onConflict: 'id' }
        )
      } catch {
        // Profile upsert failure is non-fatal — user is authenticated; profile created lazily
      }
      return NextResponse.redirect(`${origin}/`)
    }
  }
  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
}


