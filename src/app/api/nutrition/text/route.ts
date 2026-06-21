import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const genai  = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

const MAX_TEXT_LENGTH    = 1000
const MAX_IMAGE_B64_SIZE = 5 * 1024 * 1024  // ~3.75 MB image

// MIME detection via base64 magic bytes prefix
const MIME_MAP: Record<string, string> = {
  '/9j/': 'image/jpeg',
  'iVBO': 'image/png',
  'UklG': 'image/webp',
}
function detectMime(b64: string): string | null {
  return MIME_MAP[b64.slice(0, 4)] ?? null
}

type FoodItem = {
  food_name: string; grams: number | null
  kcal: number; protein_g: number; carbs_g: number; fat_g: number
}

const JSON_SCHEMA = `{"items":[{"food_name":"string","grams":number|null,"kcal":number,"protein_g":number,"carbs_g":number,"fat_g":number}]}`

function safeParse(raw: string): FoodItem[] {
  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)
    if (!Array.isArray(parsed?.items)) return []
    return parsed.items.filter((i: unknown): i is FoodItem => {
      if (typeof i !== 'object' || i === null) return false
      const item = i as Record<string, unknown>
      return (
        typeof item.food_name === 'string' && item.food_name.length > 0 &&
        typeof item.kcal      === 'number' && item.kcal      >= 0 &&
        typeof item.protein_g === 'number' && item.protein_g >= 0 &&
        typeof item.carbs_g   === 'number' && item.carbs_g   >= 0 &&
        typeof item.fat_g     === 'number' && item.fat_g     >= 0
      )
    })
  } catch {
    return []
  }
}

async function analyzeWithGPT4o(text: string, imageBase64?: string): Promise<FoodItem[]> {
  const prompt = imageBase64
    ? `User said: "${text}"\nHere is a nutrition label. Use both text and image. Return ONLY JSON: ${JSON_SCHEMA}`
    : `Parse this food description. Return ONLY JSON: ${JSON_SCHEMA}\nFood: "${text}"`

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [{
    role: 'user',
    content: imageBase64
      ? [
          { type: 'image_url' as const, image_url: { url: `data:${detectMime(imageBase64) ?? 'image/jpeg'};base64,${imageBase64}`, detail: 'high' as const } },
          { type: 'text' as const, text: prompt },
        ]
      : prompt,
  }]

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o', messages, max_tokens: 600,
    ...(imageBase64 ? {} : { response_format: { type: 'json_object' as const } }),
  })
  return safeParse(completion.choices[0]?.message?.content ?? '')
}

async function analyzeWithGemini(text: string, imageBase64: string): Promise<FoodItem[]> {
  const model  = genai.getGenerativeModel({ model: 'gemini-2.0-flash' })
  const prompt = `User said: "${text}"\nHere is a nutrition label. Use both text and image. Return ONLY JSON: ${JSON_SCHEMA}`
  const result = await model.generateContent([
    { inlineData: { mimeType: detectMime(imageBase64) ?? 'image/jpeg', data: imageBase64 } },
    prompt,
  ])
  return safeParse(result.response.text())
}

function mergeResults(gptItems: FoodItem[], geminiItems: FoodItem[]): { items: FoodItem[]; confidence: 'high' | 'medium' } {
  if (gptItems.length === 0) return { items: geminiItems, confidence: 'medium' }
  if (geminiItems.length === 0) return { items: gptItems, confidence: 'medium' }
  if (gptItems.length !== geminiItems.length) return { items: gptItems, confidence: 'medium' }

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

  const kcalDiff = Math.abs(gptItems[0].kcal - geminiItems[0].kcal) / Math.max(gptItems[0].kcal, 1)
  return { items: merged, confidence: kcalDiff < 0.15 ? 'high' : 'medium' }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { text?: unknown; imageBase64?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { text, imageBase64 } = body

  if (!text || typeof text !== 'string' || !text.trim()) {
    return NextResponse.json({ error: 'text required' }, { status: 400 })
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json({ error: `text too long (max ${MAX_TEXT_LENGTH} chars)` }, { status: 400 })
  }
  if (imageBase64 !== undefined) {
    if (typeof imageBase64 !== 'string' || imageBase64.length > MAX_IMAGE_B64_SIZE) {
      return NextResponse.json({ error: 'image too large (max ~3.75 MB)' }, { status: 400 })
    }
    if (!detectMime(imageBase64)) {
      return NextResponse.json({ error: 'unsupported image format (JPEG/PNG/WebP only)' }, { status: 400 })
    }
  }

  try {
    let items: FoodItem[] = []
    let modelUsed = 'gpt-4o'
    let confidence: 'high' | 'medium' = 'medium'

    if (imageBase64 && typeof imageBase64 === 'string') {
      modelUsed = 'gpt-4o + gemini-2.0-flash'
      const [gptRes, geminiRes] = await Promise.allSettled([
        analyzeWithGPT4o(text, imageBase64),
        analyzeWithGemini(text, imageBase64),
      ])
      const gpt    = gptRes.status    === 'fulfilled' ? gptRes.value    : []
      const gemini = geminiRes.status === 'fulfilled' ? geminiRes.value : []
      const result = mergeResults(gpt, gemini)
      items      = result.items
      confidence = result.confidence
    } else {
      items = await analyzeWithGPT4o(text)
    }

    if (items.length === 0) {
      return NextResponse.json({ error: 'לא הצלחתי לזהות מזון בתיאור. נסה לתאר ספציפית יותר.' }, { status: 422 })
    }

    const rows = items.map(item => ({
      user_id:       user.id,
      food_name:     item.food_name.slice(0, 200),
      grams:         item.grams,
      kcal:          Math.max(0, Math.round(item.kcal)),
      protein_g:     Math.max(0, item.protein_g),
      carbs_g:       Math.max(0, item.carbs_g),
      fat_g:         Math.max(0, item.fat_g),
      entry_method:  imageBase64 ? 'photo' : 'text',
      raw_input:     text.slice(0, 500),
      ai_model_used: modelUsed,
    }))

    const { data: entries, error: insertErr } = await supabase
      .from('nutrition_entries').insert(rows).select()
    if (insertErr) throw new Error(insertErr.message)

    return NextResponse.json({
      entries: entries ?? [],
      total_kcal: (entries ?? []).reduce((s: number, e: { kcal: number }) => s + e.kcal, 0),
      model_used: modelUsed,
      confidence,
    }, { status: 201 })

  } catch (err) {
    console.error('[nutrition/text]', err)
    return NextResponse.json({ error: 'שגיאה בניתוח המזון. נסה שוב.' }, { status: 500 })
  }
}
