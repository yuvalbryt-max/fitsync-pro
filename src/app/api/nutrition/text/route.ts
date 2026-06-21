import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const genai  = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { text, imageBase64 } = await request.json()
  if (!text) return NextResponse.json({ error: 'text required' }, { status: 400 })

  try {
    let items: { food_name: string; grams: number | null; kcal: number; protein_g: number; carbs_g: number; fat_g: number }[] = []
    let modelUsed = 'gpt-4o'

    if (imageBase64) {
      // Combined text + image — use Gemini Vision
      modelUsed = 'gemini-2.0-flash'
      const model  = genai.getGenerativeModel({ model: 'gemini-2.0-flash' })
      const prompt = `המשתמש אמר: "${text}"
בנוסף הוא צירף תמונה של תווית תזונה.
השתמש גם בטקסט וגם בתמונה כדי לחשב בדיוק מה הוא אכל ואת הערכים התזונתיים.
אם יש כמות בטקסט (גרמים/יחידות) — השתמש בה. אחרת הנח מנה סטנדרטית.
החזר JSON בלבד (ללא markdown):
{"items":[{"food_name":"שם המוצר בעברית","grams":number_or_null,"kcal":number,"protein_g":number,"carbs_g":number,"fat_g":number}]}`

      const result = await model.generateContent([
        { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
        prompt,
      ])
      const raw = result.response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const parsed = JSON.parse(raw)
      items = parsed.items || []
    } else {
      // Text only — use GPT-4o
      const prompt = `Parse this Hebrew/English food description and return nutrition data as JSON.
Food: "${text}"
Return ONLY JSON (no markdown):
{"items":[{"food_name":"string","grams":number|null,"kcal":number,"protein_g":number,"carbs_g":number,"fat_g":number}]}`

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o', messages: [{ role: 'user', content: prompt }],
        max_tokens: 500, response_format: { type: 'json_object' },
      })
      const parsed = JSON.parse(completion.choices[0].message.content || '{}')
      items = parsed.items || []
    }

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
        entry_method: imageBase64 ? 'photo' : 'text',
        raw_input:    text,
        ai_model_used: modelUsed,
      }).select().single()
      if (data) entries.push(data)
    }

    return NextResponse.json({
      entries,
      total_kcal: entries.reduce((s: number, e: { kcal: number }) => s + e.kcal, 0),
      model_used: modelUsed,
    }, { status: 201 })

  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
