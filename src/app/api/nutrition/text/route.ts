import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const genai  = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

type FoodItem = { food_name: string; grams: number | null; kcal: number; protein_g: number; carbs_g: number; fat_g: number }

const JSON_SCHEMA = `{"items":[{"food_name":"string","grams":number|null,"kcal":number,"protein_g":number,"carbs_g":number,"fat_g":number}]}`

async function analyzeWithGPT4o(text: string, imageBase64?: string): Promise<FoodItem[]> {
  const prompt = imageBase64
    ? `המשתמש אמר: "${text}"\nהנה תווית תזונה. השתמש בטקסט ובתמונה יחד לחישוב הערכים.\nהחזר JSON בלבד (ללא markdown): ${JSON_SCHEMA}`
    : `Parse this food description. Return ONLY JSON: ${JSON_SCHEMA}\nFood: "${text}"`

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [{
    role: 'user',
    content: imageBase64
      ? [
          { type: 'image_url' as const, image_url: { url: `data:image/jpeg;base64,${imageBase64}`, detail: 'high' as const } },
          { type: 'text' as const, text: prompt },
        ]
      : prompt,
  }]

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o', messages, max_tokens: 600,
    ...(imageBase64 ? {} : { response_format: { type: 'json_object' as const } }),
  })
  const raw = (completion.choices[0].message.content || '').replace(/```json\n?/g,'').replace(/```\n?/g,'').trim()
  const parsed = JSON.parse(raw)
  return parsed.items || []
}

async function analyzeWithGemini(text: string, imageBase64: string): Promise<FoodItem[]> {
  const model  = genai.getGenerativeModel({ model: 'gemini-2.0-flash' })
  const prompt = `המשתמש אמר: "${text}"\nהנה תווית תזונה. השתמש בטקסט ובתמונה יחד לחישוב הערכים.\nהחזר JSON בלבד (ללא markdown): ${JSON_SCHEMA}`
  const result = await model.generateContent([
    { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
    prompt,
  ])
  const raw = result.response.text().replace(/```json\n?/g,'').replace(/```\n?/g,'').trim()
  const parsed = JSON.parse(raw)
  return parsed.items || []
}

function mergeResults(gptItems: FoodItem[], geminiItems: FoodItem[]): { items: FoodItem[]; confidence: 'high' | 'medium' } {
  if (gptItems.length === 0) return { items: geminiItems, confidence: 'medium' }
  if (geminiItems.length === 0) return { items: gptItems, confidence: 'medium' }
  if (gptItems.length !== geminiItems.length) return { items: gptItems, confidence: 'medium' }

  // Average values from both models
  const merged: FoodItem[] = gptItems.map((g, i) => {
    const gem = geminiItems[i]
    return {
      food_name: g.food_name,
      grams:     g.grams,
      kcal:      Math.round((g.kcal + gem.kcal) / 2),
      protein_g: Math.round(((g.protein_g + gem.protein_g) / 2) * 10) / 10,
      carbs_g:   Math.round(((g.carbs_g   + gem.carbs_g  ) / 2) * 10) / 10,
      fat_g:     Math.round(((g.fat_g     + gem.fat_g    ) / 2) * 10) / 10,
    }
  })

  // Check agreement — if kcal differs by less than 15%, high confidence
  const kcalDiff = Math.abs(gptItems[0].kcal - geminiItems[0].kcal) / Math.max(gptItems[0].kcal, 1)
  return { items: merged, confidence: kcalDiff < 0.15 ? 'high' : 'medium' }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { text, imageBase64 } = await request.json()
  if (!text) return NextResponse.json({ error: 'text required' }, { status: 400 })

  try {
    let items: FoodItem[] = []
    let modelUsed = 'gpt-4o'
    let confidence: 'high' | 'medium' = 'medium'

    if (imageBase64) {
      // Run GPT-4o Vision + Gemini in parallel, merge results
      modelUsed = 'gpt-4o + gemini-2.0-flash'
      const [gptItems, geminiItems] = await Promise.allSettled([
        analyzeWithGPT4o(text, imageBase64),
        analyzeWithGemini(text, imageBase64),
      ])
      const gpt    = gptItems.status    === 'fulfilled' ? gptItems.value    : []
      const gemini = geminiItems.status === 'fulfilled' ? geminiItems.value : []
      const result = mergeResults(gpt, gemini)
      items      = result.items
      confidence = result.confidence
    } else {
      // Text only — GPT-4o
      items = await analyzeWithGPT4o(text)
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
      confidence,
    }, { status: 201 })

  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
