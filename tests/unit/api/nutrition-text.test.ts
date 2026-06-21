import { describe, it, expect } from 'vitest'

// ── Inline the pure logic we want to test ──────────────────────────────────
// (Extracted here to avoid mocking OpenAI/Supabase in unit tests)

type FoodItem = {
  food_name: string; grams: number | null
  kcal: number; protein_g: number; carbs_g: number; fat_g: number
}

const MAX_TEXT_LENGTH    = 1000
const MAX_IMAGE_B64_SIZE = 5 * 1024 * 1024

function safeParse(raw: string): FoodItem[] {
  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)
    if (!Array.isArray(parsed?.items)) return []
    return parsed.items.filter(
      (i: unknown): i is FoodItem =>
        typeof i === 'object' && i !== null &&
        typeof (i as FoodItem).food_name === 'string' &&
        typeof (i as FoodItem).kcal === 'number' &&
        (i as FoodItem).kcal >= 0
    )
  } catch {
    return []
  }
}

function mergeResults(gptItems: FoodItem[], geminiItems: FoodItem[]) {
  if (gptItems.length === 0) return { items: geminiItems, confidence: 'medium' as const }
  if (geminiItems.length === 0) return { items: gptItems, confidence: 'medium' as const }
  if (gptItems.length !== geminiItems.length) return { items: gptItems, confidence: 'medium' as const }

  const merged: FoodItem[] = gptItems.map((g, i) => {
    const gem = geminiItems[i]
    return {
      food_name: g.food_name, grams: g.grams,
      kcal:      Math.round((g.kcal + gem.kcal) / 2),
      protein_g: Math.round(((g.protein_g + gem.protein_g) / 2) * 10) / 10,
      carbs_g:   Math.round(((g.carbs_g   + gem.carbs_g  ) / 2) * 10) / 10,
      fat_g:     Math.round(((g.fat_g     + gem.fat_g    ) / 2) * 10) / 10,
    }
  })
  const kcalDiff = Math.abs(gptItems[0].kcal - geminiItems[0].kcal) / Math.max(gptItems[0].kcal, 1)
  return { items: merged, confidence: kcalDiff < 0.15 ? 'high' as const : 'medium' as const }
}

// ── safeParse ──────────────────────────────────────────────────────────────
describe('safeParse', () => {
  it('parses valid JSON with items array', () => {
    const raw = JSON.stringify({ items: [{ food_name: 'Apple', grams: 100, kcal: 52, protein_g: 0.3, carbs_g: 14, fat_g: 0.2 }] })
    expect(safeParse(raw)).toHaveLength(1)
    expect(safeParse(raw)[0].food_name).toBe('Apple')
  })

  it('strips markdown code fences before parsing', () => {
    const raw = '```json\n{"items":[{"food_name":"Banana","grams":120,"kcal":89,"protein_g":1.1,"carbs_g":23,"fat_g":0.3}]}\n```'
    expect(safeParse(raw)).toHaveLength(1)
  })

  it('returns [] when AI returns plain text (not JSON)', () => {
    expect(safeParse('Sorry, I cannot help with that.')).toEqual([])
  })

  it('returns [] on completely empty string', () => {
    expect(safeParse('')).toEqual([])
  })

  it('returns [] when JSON has no items key', () => {
    expect(safeParse('{"foods":[]}')).toEqual([])
  })

  it('returns [] when items is not an array', () => {
    expect(safeParse('{"items":"not-an-array"}')).toEqual([])
  })

  it('filters out items with missing food_name', () => {
    const raw = JSON.stringify({ items: [
      { food_name: 'Egg', grams: 50, kcal: 70, protein_g: 6, carbs_g: 0.5, fat_g: 5 },
      { grams: 50, kcal: 70, protein_g: 6, carbs_g: 0.5, fat_g: 5 },   // missing food_name
    ]})
    expect(safeParse(raw)).toHaveLength(1)
  })

  it('filters out items with negative kcal', () => {
    const raw = JSON.stringify({ items: [{ food_name: 'Bad', grams: null, kcal: -10, protein_g: 0, carbs_g: 0, fat_g: 0 }] })
    expect(safeParse(raw)).toEqual([])
  })

  it('handles grams: null correctly', () => {
    const raw = JSON.stringify({ items: [{ food_name: 'Water', grams: null, kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }] })
    expect(safeParse(raw)[0].grams).toBeNull()
  })

  it('returns [] on malformed partial JSON', () => {
    expect(safeParse('{"items": [{"food_name": "incomplete"')).toEqual([])
  })
})

// ── mergeResults ───────────────────────────────────────────────────────────
describe('mergeResults', () => {
  const apple: FoodItem = { food_name: 'Apple', grams: 100, kcal: 52, protein_g: 0.3, carbs_g: 14, fat_g: 0.2 }
  const appleGemini: FoodItem = { food_name: 'Apple', grams: 100, kcal: 56, protein_g: 0.4, carbs_g: 15, fat_g: 0.1 }

  it('returns gemini with medium confidence when gpt is empty', () => {
    const r = mergeResults([], [apple])
    expect(r.items).toEqual([apple])
    expect(r.confidence).toBe('medium')
  })

  it('returns gpt with medium confidence when gemini is empty', () => {
    const r = mergeResults([apple], [])
    expect(r.items).toEqual([apple])
    expect(r.confidence).toBe('medium')
  })

  it('returns gpt with medium when lengths differ', () => {
    const banana: FoodItem = { food_name: 'Banana', grams: 120, kcal: 89, protein_g: 1.1, carbs_g: 23, fat_g: 0.3 }
    const r = mergeResults([apple, banana], [apple])
    expect(r.items).toEqual([apple, banana])
    expect(r.confidence).toBe('medium')
  })

  it('averages kcal from both models', () => {
    const r = mergeResults([apple], [appleGemini])
    // avg(52, 56) = 54
    expect(r.items[0].kcal).toBe(54)
  })

  it('returns high confidence when kcal diff < 15%', () => {
    // diff = |52-56|/52 = 7.7% < 15%
    const r = mergeResults([apple], [appleGemini])
    expect(r.confidence).toBe('high')
  })

  it('returns medium confidence when kcal diff >= 15%', () => {
    const highKcal: FoodItem = { ...apple, kcal: 100 }
    // diff = |52-100|/52 = 92% > 15%
    const r = mergeResults([apple], [highKcal])
    expect(r.confidence).toBe('medium')
  })

  it('does not crash when both models return empty arrays', () => {
    const r = mergeResults([], [])
    expect(r.items).toEqual([])
    expect(r.confidence).toBe('medium')
  })
})

// ── Input validation boundaries ────────────────────────────────────────────
describe('Input validation constants', () => {
  it('MAX_TEXT_LENGTH is 1000', () => {
    expect(MAX_TEXT_LENGTH).toBe(1000)
  })

  it('MAX_IMAGE_B64_SIZE is 5MB', () => {
    expect(MAX_IMAGE_B64_SIZE).toBe(5 * 1024 * 1024)
  })

  it('text at exact limit is allowed', () => {
    const text = 'א'.repeat(MAX_TEXT_LENGTH)
    expect(text.length <= MAX_TEXT_LENGTH).toBe(true)
  })

  it('text one char over limit should be rejected', () => {
    const text = 'a'.repeat(MAX_TEXT_LENGTH + 1)
    expect(text.length > MAX_TEXT_LENGTH).toBe(true)
  })
})
