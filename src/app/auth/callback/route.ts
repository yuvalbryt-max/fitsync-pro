import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
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

