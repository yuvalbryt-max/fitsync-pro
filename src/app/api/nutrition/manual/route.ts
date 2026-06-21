import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { food_name, kcal, grams, protein_g, carbs_g, fat_g } = body

  if (!food_name || !kcal) {
    return NextResponse.json({ error: 'food_name and kcal are required' }, { status: 400 })
  }

  const { data, error } = await supabase.from('nutrition_entries').insert({
    user_id:       user.id,
    food_name:     food_name.trim(),
    kcal:          Math.round(Number(kcal)),
    grams:         grams ? Number(grams) : null,
    protein_g:     protein_g ? Number(protein_g) : null,
    carbs_g:       carbs_g ? Number(carbs_g) : null,
    fat_g:         fat_g ? Number(fat_g) : null,
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

