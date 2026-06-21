import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { food_name, kcal, grams, protein_g, carbs_g, fat_g } = body

  if (!food_name || typeof food_name !== 'string' || !food_name.trim()) {
    return NextResponse.json({ error: 'food_name is required' }, { status: 400 })
  }
  if (food_name.length > 200) {
    return NextResponse.json({ error: 'food_name too long (max 200 chars)' }, { status: 400 })
  }
  const kcalNum = Number(kcal)
  if (kcal === undefined || kcal === null || kcal === '' || isNaN(kcalNum) || kcalNum < 0 || kcalNum > 10000) {
    return NextResponse.json({ error: 'kcal must be a number between 0 and 10000' }, { status: 400 })
  }

  const { data, error } = await supabase.from('nutrition_entries').insert({
    user_id:       user.id,
    food_name:     food_name.trim().slice(0, 200),
    kcal:          Math.round(kcalNum),
    grams:         grams !== undefined && grams !== '' ? Math.max(0, Number(grams)) : null,
    protein_g:     protein_g !== undefined && protein_g !== '' ? Math.max(0, Number(protein_g)) : null,
    carbs_g:       carbs_g   !== undefined && carbs_g   !== '' ? Math.max(0, Number(carbs_g))   : null,
    fat_g:         fat_g     !== undefined && fat_g     !== '' ? Math.max(0, Number(fat_g))     : null,
    entry_method:  'manual',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today   = new Date().toISOString().slice(0, 10)
  const nextDay = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('nutrition_entries')
    .select('*')
    .eq('user_id', user.id)
    .gte('logged_at', today   + 'T00:00:00')
    .lt('logged_at',  nextDay + 'T00:00:00')
    .order('logged_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}


