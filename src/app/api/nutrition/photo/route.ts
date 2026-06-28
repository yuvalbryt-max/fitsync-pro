import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

function getGenAI() { return new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!) }

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { imageBase64, grams } = await request.json()
  if (!imageBase64) return NextResponse.json({ error: 'imageBase64 is required' }, { status: 400 })

  const model = getGenAI().getGenerativeModel({ model: 'gemini-2.0-flash' })

  const prompt = `This is a nutritional label photo. Extract the nutritional values per 100g.
Return ONLY valid JSON (no markdown):
{
  "food_name": "product name if visible, else 'מוצר מזון'",
  "per_100g": {
    "kcal": number,
    "protein_g": number,
    "carbs_g": number,
    "fat_g": number
  }
}`

  try {
    const result = await model.generateContent([
      { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
      prompt,
    ])
    const text = result.response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(text)
    const per100g = parsed.per_100g || {}
    const gramsNum = grams ? Number(grams) : 100
    const factor = gramsNum / 100

    const entry = {
      user_id:      user.id,
      food_name:    parsed.food_name || 'מוצר מזון',
      grams:        gramsNum,
      kcal:         Math.round((per100g.kcal || 0) * factor),
      protein_g:    Number(((per100g.protein_g || 0) * factor).toFixed(1)),
      carbs_g:      Number(((per100g.carbs_g   || 0) * factor).toFixed(1)),
      fat_g:        Number(((per100g.fat_g      || 0) * factor).toFixed(1)),
      entry_method: 'photo' as const,
      ai_model_used: 'gemini-2.0-flash',
      raw_input:    `${gramsNum}g`,
    }

    const { data, error } = await supabase.from('nutrition_entries').insert(entry).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ entry: data, per_100g: per100g }, { status: 201 })
  } catch (err) {
    const msg = String(err)
    const isQuota = msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('exceeded')
    if (isQuota) {
      return NextResponse.json({ error: 'שירות ניתוח התמונה עמוס כרגע. נסה שוב בעוד מספר דקות.', code: 'QUOTA_EXCEEDED' }, { status: 503 })
    }
    return NextResponse.json({ error: 'שגיאה בניתוח התמונה. נסה שוב.' }, { status: 500 })
  }
}
