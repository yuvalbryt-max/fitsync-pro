'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { BottomNav } from '@/components/v0-ui/bottom-nav'
import { formatKcal } from '@/lib/utils'

type NutritionEntry = {
  id: string; food_name: string; kcal: number; grams: number | null
  protein_g: number | null; carbs_g: number | null; fat_g: number | null
  entry_method: string; logged_at: string
}
type MemoryItem = {
  food_name: string; kcal: number; protein_g: number
  carbs_g: number; fat_g: number; grams: number | null; count: number
}
type Tab = 'log' | 'text' | 'manual'

function debounce<T extends (...args: Parameters<T>) => void>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay) }
}

export default function NutritionPage() {
  const [activeTab, setActiveTab] = useState<Tab>('log')
  const [entries, setEntries]     = useState<NutritionEntry[]>([])
  const [loading, setLoading]     = useState(false)

  // Text + photo tab
  const [textInput, setTextInput]     = useState('')
  const [imageB64, setImageB64]       = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [textResult, setTextResult]   = useState<{ entries: NutritionEntry[]; total_kcal: number; model_used: string; confidence?: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Memory system
  const [memoryItems, setMemoryItems]     = useState<MemoryItem[]>([])
  const [showMemory, setShowMemory]       = useState(false)
  const [memoryLoading, setMemoryLoading] = useState(false)
  const [selectedMemory, setSelectedMemory] = useState<MemoryItem | null>(null)

  const [fetchError, setFetchError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Manual tab
  const [form, setForm] = useState({ food_name: '', kcal: '', protein_g: '', carbs_g: '', fat_g: '' })

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch('/api/nutrition/manual')
      if (res.ok) { setEntries(await res.json()); setFetchError(null) }
      else setFetchError('שגיאה בטעינת הרשומות')
    } catch { setFetchError('בעיית חיבור — נסה לרענן') }
  }, [])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  const totals = entries.reduce((acc, e) => ({
    kcal:      acc.kcal      + e.kcal,
    protein_g: acc.protein_g + (e.protein_g || 0),
    carbs_g:   acc.carbs_g   + (e.carbs_g   || 0),
    fat_g:     acc.fat_g     + (e.fat_g      || 0),
  }), { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 })

  // Debounced memory search
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const searchMemory = useCallback(debounce(async (q: string) => {
    if (q.length < 2) { setMemoryItems([]); setShowMemory(false); return }
    setMemoryLoading(true)
    const res = await fetch(`/api/nutrition/memory?q=${encodeURIComponent(q)}`)
    if (res.ok) {
      const data = await res.json()
      setMemoryItems(data)
      setShowMemory(data.length > 0)
    }
    setMemoryLoading(false)
  }, 600), [])

  function handleTextChange(val: string) {
    setTextInput(val)
    setSelectedMemory(null)
    if (!imageB64) searchMemory(val)  // Only search memory when no image
  }

  function selectMemoryItem(item: MemoryItem) {
    setSelectedMemory(item)
    setShowMemory(false)
  }

  function clearMemorySelection() {
    setSelectedMemory(null)
    setShowMemory(false)
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string
      setImagePreview(dataUrl)
      setImageB64(dataUrl.split(',')[1])
      setShowMemory(false)  // Hide memory when image selected
    }
    reader.readAsDataURL(file)
  }

  function clearImage() {
    setImageB64(null); setImagePreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function submitText(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setTextResult(null)

    // If user selected a memory item, save directly without AI
    if (selectedMemory && !imageB64) {
      const res = await fetch('/api/nutrition/manual', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          food_name: selectedMemory.food_name,
          kcal:      selectedMemory.kcal,
          protein_g: selectedMemory.protein_g,
          carbs_g:   selectedMemory.carbs_g,
          fat_g:     selectedMemory.fat_g,
          grams:     selectedMemory.grams,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setTextResult({ entries: [data], total_kcal: data.kcal, model_used: 'זיכרון מוצר', confidence: 'high' })
        await fetchEntries(); setTextInput(''); setSelectedMemory(null)
      }
      setLoading(false); return
    }

    // Otherwise call AI
    const res = await fetch('/api/nutrition/text', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: textInput, imageBase64: imageB64 }),
    })
    const data = await res.json()
    if (res.ok) {
      setTextResult(data); setSubmitError(null); await fetchEntries()
      setTextInput(''); clearImage(); setSelectedMemory(null)
    } else {
      setSubmitError(data?.error || 'שגיאה בניתוח המזון')
    }
    setLoading(false)
  }

  async function submitManual(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setSubmitError(null)
    const res = await fetch('/api/nutrition/manual', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ food_name: form.food_name, kcal: form.kcal, protein_g: form.protein_g || undefined, carbs_g: form.carbs_g || undefined, fat_g: form.fat_g || undefined }),
    })
    if (res.ok) {
      setForm({ food_name: '', kcal: '', protein_g: '', carbs_g: '', fat_g: '' })
      await fetchEntries(); setActiveTab('log')
    } else {
      const d = await res.json().catch(() => ({}))
      setSubmitError(d?.error || 'שגיאה בשמירת הרשומה')
    }
    setLoading(false)
  }

  const inputCls = "w-full bg-[#080c14] border border-[#1c2535] rounded-xl px-4 py-3 text-[#e8edf5] placeholder:text-[#3d4f65] focus:outline-none focus:border-[#3b82f6] text-base"
  const labelCls = "block text-sm font-medium text-[#8896aa] mb-1.5"

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header + Tabs */}
      <div className="sticky top-0 z-50 bg-[#080c14] px-5 pt-5 pb-3">
        <h1 className="text-xl font-bold mb-3">תזונה</h1>
        <div className="flex gap-1 bg-[#0f1520] rounded-xl p-1">
          {([['log','יומן'],['text','מלל + תמונה'],['manual','ידני']] as [Tab,string][]).map(([t,l]) => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`flex-1 py-2 rounded-lg text-[11px] font-semibold transition-colors ${activeTab===t ? 'bg-[#1c2535] text-[#e8edf5]' : 'text-[#8896aa]'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 pb-4 space-y-3">
        {fetchError && (
          <div className="bg-[#3b0a0a] border border-[#f43f5e] rounded-xl px-4 py-3 text-[#f43f5e] text-sm">{fetchError}</div>
        )}
        {submitError && (
          <div className="bg-[#3b0a0a] border border-[#f43f5e] rounded-xl px-4 py-3 text-[#f43f5e] text-sm">{submitError}</div>
        )}
        {/* Daily totals */}
        <div className="bg-[#0f1520] border border-[#1c2535] border-t-2 border-t-[#10b981] rounded-2xl p-4">
          <p className="text-[10px] text-[#8896aa] font-semibold uppercase tracking-wide mb-2">סה״כ היום</p>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-[28px] font-extrabold tabular text-[#10b981]">{formatKcal(totals.kcal)}</span>
            <span className="text-xs text-[#8896aa]">קל׳</span>
          </div>
          <div className="flex gap-2">
            {[{l:'חלבון',v:Math.round(totals.protein_g),c:'text-[#3b82f6]'},{l:'פחמימות',v:Math.round(totals.carbs_g),c:'text-[#f59e0b]'},{l:'שומן',v:Math.round(totals.fat_g),c:'text-[#8b5cf6]'}].map(({l,v,c}) => (
              <div key={l} className="flex-1 text-center bg-[#131a25] rounded-xl py-2">
                <p className={`text-sm font-bold tabular ${c}`}>{v}g</p>
                <p className="text-[9px] text-[#8896aa] mt-0.5">{l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* LOG TAB */}
        {activeTab === 'log' && (
          entries.length === 0 ? (
            <div className="text-center py-12 text-[#8896aa]">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3d4f65" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3 mx-auto" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <p className="font-semibold">אין רשומות להיום</p>
              <p className="text-sm mt-1">הוסף ארוחה באמצעות הטאבים למעלה</p>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map(entry => (
                <div key={entry.id} className="bg-[#0f1520] border border-[#1c2535] rounded-xl p-3.5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[14px]">{entry.food_name}</p>
                    <p className="text-[11px] text-[#8896aa] mt-0.5">
                      {new Date(entry.logged_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                      {' · '}{entry.entry_method === 'text' ? 'AI' : entry.entry_method === 'photo' ? 'AI + תמונה' : 'ידני'}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-[15px] font-bold tabular">{formatKcal(entry.kcal)}</p>
                    <p className="text-[10px] text-[#8896aa]">קל׳</p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* TEXT + PHOTO TAB */}
        {activeTab === 'text' && (
          <form onSubmit={submitText} className="space-y-3">
            <div className="relative">
              <label className={labelCls}>תאר מה אכלת</label>
              <textarea value={textInput} onChange={e => handleTextChange(e.target.value)}
                placeholder="לדוגמא: אכלתי מוצרלה 100 גרם" rows={3} required
                className={`${inputCls} resize-none`} />
              {memoryLoading && (
                <span className="absolute top-8 left-4 text-[10px] text-[#8896aa]">מחפש בזיכרון...</span>
              )}
            </div>

            {/* Memory suggestions */}
            {showMemory && !selectedMemory && (
              <div className="bg-[#0f1520] border border-[#2d1a52] rounded-xl overflow-hidden">
                <div className="px-3 py-2 bg-[#2d1a52]/40 flex items-center gap-2">
                  <span className="text-[9px] font-bold text-[#8b5cf6] uppercase">✦ זוכר מוצרים דומים</span>
                </div>
                {memoryItems.map((item, i) => (
                  <button key={i} type="button" onClick={() => selectMemoryItem(item)}
                    className="w-full px-3 py-3 flex items-center justify-between hover:bg-[#131a25] transition-colors border-t border-[#1c2535] first:border-0 text-right">
                    <div>
                      <p className="text-[13px] font-semibold text-[#e8edf5]">{item.food_name}</p>
                      <p className="text-[10px] text-[#8896aa] mt-0.5">
                        {item.protein_g}g חלבון · {item.carbs_g}g פחמימות · {item.fat_g}g שומן
                        {item.grams ? ` · ${item.grams}g` : ''}
                        {item.count > 1 ? ` · ${item.count} פעמים קודמות` : ''}
                      </p>
                    </div>
                    <div className="text-left flex-shrink-0 mr-2">
                      <p className="text-[14px] font-bold tabular text-[#8b5cf6]">{formatKcal(item.kcal)}</p>
                      <p className="text-[9px] text-[#8896aa]">קל׳</p>
                    </div>
                  </button>
                ))}
                <button type="button" onClick={clearMemorySelection}
                  className="w-full px-3 py-3 text-right text-[12px] text-[#8896aa] hover:bg-[#131a25] transition-colors border-t border-[#1c2535]">
                  אף אחת מהן — תנתח עם AI
                </button>
              </div>
            )}

            {/* Selected memory badge */}
            {selectedMemory && (
              <div className="bg-[#2d1a52] border border-[#5b3aac] rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-[#8b5cf6] font-bold mb-0.5">✦ ממוצר שמור בזיכרון</p>
                  <p className="text-[13px] font-semibold">{selectedMemory.food_name}</p>
                  <p className="text-[10px] text-[#8896aa] mt-0.5">{formatKcal(selectedMemory.kcal)} קל׳ · {selectedMemory.protein_g}g חלבון</p>
                </div>
                <button type="button" onClick={() => { setSelectedMemory(null); setShowMemory(true) }}
                  className="text-[#8896aa] text-[12px] hover:text-[#e8edf5] transition-colors mr-2">
                  שנה
                </button>
              </div>
            )}

            {/* Image upload */}
            {!selectedMemory && (
              <div>
                <label className={labelCls}>תמונת תווית תזונה (אופציונלי)</label>
                {imagePreview ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePreview} alt="תווית" className="w-full max-h-48 object-contain rounded-xl border border-[#1c2535] bg-[#0f1520]" />
                    <button type="button" onClick={clearImage}
                      className="absolute top-2 left-2 w-7 h-7 rounded-full bg-[#f43f5e] flex items-center justify-center text-white text-xs font-bold">✕</button>
                    <div className="absolute bottom-2 right-2 bg-[#10b981] text-black text-[10px] font-bold px-2 py-0.5 rounded-full">GPT-4o + Gemini ✓</div>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="w-full border-2 border-dashed border-[#1c2535] rounded-xl py-7 flex flex-col items-center gap-2 text-[#8896aa] hover:border-[#3b82f6] hover:text-[#3b82f6] transition-colors">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                    <span className="text-[12px] font-semibold">צלם או העלה תווית</span>
                    <span className="text-[10px]">GPT-4o + Gemini ינתחו יחד לדיוק מרבי</span>
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleImageSelect} className="hidden" />
              </div>
            )}

            {/* Model indicator */}
            {!selectedMemory && (
              <div className={`border rounded-xl px-3 py-2 flex items-center gap-2 ${imageB64 ? 'bg-[#2d1a52] border-[#5b3aac]' : 'bg-[#1d3461] border-[#2555a0]'}`}>
                <span className={`text-[10px] font-bold uppercase ${imageB64 ? 'text-[#8b5cf6]' : 'text-[#3b82f6]'}`}>
                  {imageB64 ? 'GPT-4o Vision + Gemini' : 'GPT-4o'}
                </span>
                <span className="text-[#c8d4e4] text-[11px]">
                  {imageB64 ? 'שני מודלים מנתחים יחד — ממוצע לדיוק מרבי' : 'מנתח מלל חופשי'}
                </span>
              </div>
            )}

            <button type="submit" disabled={loading || !textInput}
              className="w-full bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors">
              {loading ? 'מנתח...' : selectedMemory ? 'שמור מזיכרון' : imageB64 ? 'נתח מלל + תמונה' : 'נתח טקסט'}
            </button>

            {textResult && (
              <div className="bg-[#0d3326] border border-[#0a5e40] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <p className="text-[#10b981] font-bold">נוסף ליומן ✓</p>
                  <span className="text-[9px] bg-[#0a5e40] text-[#10b981] px-2 py-0.5 rounded-full font-bold">{textResult.model_used}</span>
                  {textResult.confidence === 'high' && (
                    <span className="text-[9px] bg-[#1d3461] text-[#3b82f6] px-2 py-0.5 rounded-full font-bold">דיוק גבוה ✓</span>
                  )}
                </div>
                {textResult.entries.map((e: NutritionEntry, i: number) => (
                  <div key={i} className="flex justify-between text-sm py-1">
                    <span>{e.food_name}{e.grams ? ` (${e.grams}g)` : ''}</span>
                    <span className="font-bold tabular">{formatKcal(e.kcal)} קל׳</span>
                  </div>
                ))}
                <div className="border-t border-[#0a5e40] mt-2 pt-2 flex justify-between font-bold">
                  <span>סה״כ</span><span>{formatKcal(textResult.total_kcal)} קל׳</span>
                </div>
              </div>
            )}
          </form>
        )}

        {/* MANUAL TAB */}
        {activeTab === 'manual' && (
          <form onSubmit={submitManual} className="space-y-3">
            <div>
              <label className={labelCls}>שם המוצר *</label>
              <input value={form.food_name} onChange={e => setForm(p=>({...p,food_name:e.target.value}))} placeholder="קוטג׳ 5%" required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>קלוריות *</label>
              <input type="number" value={form.kcal} onChange={e => setForm(p=>({...p,kcal:e.target.value}))} placeholder="350" required min="0" className={inputCls} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[['protein_g','חלבון (g)'],['carbs_g','פחמימות (g)'],['fat_g','שומן (g)']].map(([k,l]) => (
                <div key={k}>
                  <label className={labelCls}>{l}</label>
                  <input type="number" value={form[k as keyof typeof form]} onChange={e => setForm(p=>({...p,[k]:e.target.value}))} placeholder="0" min="0" step="0.1" className={inputCls} />
                </div>
              ))}
            </div>
            <button type="submit" disabled={loading||!form.food_name||!form.kcal}
              className="w-full bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors">
              {loading ? 'שומר...' : 'הוסף לרשומות'}
            </button>
          </form>
        )}
      </div>
      <BottomNav />
    </div>
  )
}



