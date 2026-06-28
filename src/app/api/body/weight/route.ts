import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { weight_kg?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const raw = Number(body.weight_kg)
  if (!body.weight_kg || isNaN(raw) || raw <= 0 || raw < 20 || raw > 500) {
    return NextResponse.json({ error: 'weight_kg must be a number between 20 and 500' }, { status: 400 })
  }

  const { data, error } = await supabase.from('body_metrics').insert({
    user_id:     user.id,
    measured_at: new Date().toISOString(),
    weight_kg:   Math.round(raw * 100) / 100,
    source:      'manual',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('body_metrics')
    .select('*')
    .eq('user_id', user.id)
    .order('measured_at', { ascending: false })
    .limit(60)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id || isNaN(Number(id))) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const { error } = await supabase
    .from('body_metrics')
    .delete()
    .eq('id', Number(id))
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}