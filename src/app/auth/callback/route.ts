import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Fallback chain: explicit site URL → Vercel auto URL → localhost for dev
const ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      const email = data.user.email
      if (!email) {
        return NextResponse.redirect(`${ORIGIN}/auth/login?error=no_email`)
      }
      try {
        await supabase.from('users').upsert(
          { id: data.user.id, email, name: data.user.user_metadata?.name ?? null },
          { onConflict: 'id' }
        )
      } catch {
        // Profile upsert failure is non-fatal — user is authenticated; profile created lazily
      }
      return NextResponse.redirect(`${ORIGIN}/`)
    }
  }
  return NextResponse.redirect(`${ORIGIN}/auth/login?error=auth_failed`)
}
