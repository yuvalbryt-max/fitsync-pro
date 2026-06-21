import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { SupabaseClient, User } from '@supabase/supabase-js'

type AuthedHandler = (
  req: Request,
  ctx: { user: User; supabase: SupabaseClient }
) => Promise<Response>

/**
 * Wraps an API route handler with Supabase auth.
 * Returns 401 if no session exists; otherwise calls handler with user + supabase client.
 */
export async function withAuth(req: Request, handler: AuthedHandler): Promise<Response> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return handler(req, { user, supabase })
}
