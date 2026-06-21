import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json([])

  // Search past entries by food_name (case-insensitive)
  const { data, error } = await supabase
    .from('nutrition_entries')
    .select('food_name, kcal, protein_g, carbs_g, fat_g, grams, logged_at')
    .eq('user_id', user.id)
    .ilike('food_name', `%${q}%`)
    .order('logged_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json([])

  // Deduplicate by food_name, keep most recent, average nutritional values
  const grouped: Record<string, {
    food_name: string; kcal: number; protein_g: number
    carbs_g: number; fat_g: number; grams: number | null; count: number
  }> = {}

  for (const row of (data || [])) {
    const key = row.food_name.toLowerCase().trim()
    if (!grouped[key]) {
      grouped[key] = {
        food_name: row.food_name,
        kcal:      row.kcal,
        protein_g: row.protein_g || 0,
        carbs_g:   row.carbs_g   || 0,
        fat_g:     row.fat_g     || 0,
        grams:     row.grams,
        count:     1,
      }
    } else {
      // Average values across entries
      const g = grouped[key]
      const n = g.count + 1
      g.kcal      = Math.round((g.kcal * g.count + row.kcal) / n)
      g.protein_g = Math.round(((g.protein_g * g.count + (row.protein_g || 0)) / n) * 10) / 10
      g.carbs_g   = Math.round(((g.carbs_g   * g.count + (row.carbs_g   || 0)) / n) * 10) / 10
      g.fat_g     = Math.round(((g.fat_g     * g.count + (row.fat_g     || 0)) / n) * 10) / 10
      g.count     = n
    }
  }

  return NextResponse.json(Object.values(grouped).slice(0, 5))
}
