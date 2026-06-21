import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { text } = await request.json()
  if (!text) return NextResponse.json({ error: 'text is required' }, { status: 400 })

  const prompt = `Parse the following Hebrew/English food description and return nutritional data as JSON.

Food description: "${text}"

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "items": [
    {
      "food_name": "name in Hebrew or English",
      "grams": number or null,
      "kcal": number,
      "protein_g": number,
      "carbs_g": number,
      "fat_g": number
    }
  ]
}

Use standard nutritional values. If grams not specified, assume a standard serving.`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      response_format: { type: 'json_object' },
    })

    const parsed = JSON.parse(completion.choices[0].message.content || '{}')
    const items = parsed.items || []

    const entries = []
    for (const item of items) {
      const { data } = await supabase.from('nutrition_entries').insert({
        user_id:      user.id,
        food_name:    item.food_name,
        grams:        item.grams,
        kcal:         Math.round(item.kcal),
        protein_g:    item.protein_g,
        carbs_g:      item.carbs_g,
        fat_g:        item.fat_g,
        entry_method: 'text',
        raw_input:    text,
        ai_model_used: 'gpt-4o',
      }).select().single()
      if (data) entries.push(data)
    }

    return NextResponse.json({ entries, total_kcal: entries.reduce((s: number, e: { kcal: number }) => s + e.kcal, 0) }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
