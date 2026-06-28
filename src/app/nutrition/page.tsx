'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { BottomNav } from '@/components/v0-ui/bottom-nav'
import { AppHeader } from '@/components/v0-ui/app-header'
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
  const [textInput, setTextInput]       = useState('')
  const [imageB64, setImageB64]         = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [textResult, setTextResult]     = useState<{ entries: NutritionEntry[]; total_kcal: number; model_used: string; confidence?: string } | null>(null)
  const [textError, setTextError]       = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Memory system
  const [memoryItems, setMemoryItems]       = useState<MemoryItem[]>([])
  const [showMemory, setShowMemory]         = useState(false)
  const [memoryLoading, setMemoryLoading]   = useState(false)
  const [selectedMemory, setSelectedMemory] = useState<MemoryItem | null>(null)

  // Manual tab
  const [form, setForm]           = useState({ food_name: '', kcal: '', protein_g: '', carbs_g: '', fat_g: '' })
  const [fetchError, setFetchError]   = useState<string | null>(null)
  const [manualError, setManualError] = useState<string | null>(null)

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch('/api/nutrition/manual')
      if (res.ok) { setEntries(await res.json()); setFetchError(null) }
      else setFetchError('שגיאה בטעינת הרשומות')
    } catch { setFetchError('בעיית חיבור — נסה לרענן') }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchEntries() }, [fetchEntries])

  async function deleteEntry(id: string, name: string) {
    if (!window.confirm('למחוק את "' + name + '"?')) return
    const res = await fetch('/api/nutrition/manual?id=' + id, { method: 'DELETE' })
    if (res.ok) await fetchEntries()
  }

  const totals = entries.reduce((acc, e) => ({
    kcal:      acc.kcal      + e.kcal,
    protein_g: acc.protein_g + (e.protein_g || 0),
    carbs_g:   acc.carbs_g   + (e.carbs_g   || 0),
    fat_g:     acc.fat_g     + (e.fat_g      || 0),
  }), { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 })

  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/use-memo
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
    setTextError(null)
    if (!imageB64) searchMemory(val)
  }

  function selectMemoryItem(item: MemoryItem) {
    setSelectedMemory(item)
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
      setShowMemory(false)
    }
    reader.readAsDataURL(file)
  }

  function clearImage() {
    setImageB64(null); setImagePreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function submitText(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setTextResult(null); setTextError(null)

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
      } else {
        const d = await res.json().catch(() => ({}))
        setTextError(d.error || 'שגיאה בשמירת הרשומה')
      }
      setLoading(false); return
    }

    const res = await fetch('/api/nutrition/text', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: textInput, imageBase64: imageB64 }),
    })
    if (res.ok) {
      const data = await res.json()
      setTextResult(data); await fetchEntries()
      setTextInput(''); clearImage(); setSelectedMemory(null)
    } else {
      const d = await res.json().catch(() => ({}))
      setTextError(d.error || 'שגיאה בניתוח המזון')
    }
    setLoading(false)
  }

  async function submitManual(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setManualError(null)
    const res = await fetch('/api/nutrition/manual', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ food_name: form.food_name, kcal: form.kcal, protein_g: form.protein_g || undefined, carbs_g: form.carbs_g || undefined, fat_g: form.fat_g || undefined }),
    })
    if (res.ok) {
      setForm({ food_name: '', kcal: '', protein_g: '', carbs_g: '', fat_g: '' })
      await fetchEntries(); setActiveTab('log')
    } else {
      const d = await res.json().catch(() => ({}))
      setManualError(d.error || 'שגיאה בשמירת הרשומה')
    }
    setLoading(false)
  }

  const inputCls = "w-full bg-muted border border-input rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary text-base"
  const labelCls = "block text-sm font-medium text-muted-foreground mb-1.5"

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <AppHeader title="תזונה" />

      {/* Tabs */}
      <div className="sticky top-[57px] z-20 bg-background/95 backdrop-blur px-4 py-2 border-b border-border">
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {([['log','יומן'],['text','מלל + תמונה'],['manual','ידני']] as [Tab,string][]).map(([t,l]) => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`flex-1 py-2 rounded-lg text-[11px] font-semibold transition-colors ${activeTab===t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 py-3 pb-6 space-y-3">

        {/* שגיאת טעינה */}
        {fetchError && (
          <div className="rounded-xl bg-red-soft border border-red px-4 py-3 text-sm text-red font-medium flex items-center justify-between">
            <span>{fetchError}</span>
            <button type="button" onClick={() => fetchEntries()} className="text-xs underline font-semibold mr-2">נסה שוב</button>
          </div>
        )}

        {/* סה״כ יומי */}
        <div className="bg-card border border-border border-t-2 border-t-green rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide mb-2">סה״כ היום</p>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-[28px] font-extrabold tabular text-green">{formatKcal(totals.kcal)}</span>
            <span className="text-xs text-muted-foreground">קל׳</span>
          </div>
          <div className="flex gap-2">
            {[
              { l: 'חלבון',    v: Math.round(totals.protein_g), c: 'text-primary'  },
              { l: 'פחמימות', v: Math.round(totals.carbs_g),   c: 'text-amber'   },
              { l: 'שומן',     v: Math.round(totals.fat_g),     c: 'text-purple'  },
            ].map(({ l, v, c }) => (
              <div key={l} className="flex-1 text-center bg-muted rounded-xl py-2">
                <p className={`text-sm font-bold tabular ${c}`}>{v}g</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">{l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* לשונית יומן */}
        {activeTab === 'log' && (
          entries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3 mx-auto opacity-30" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <p className="font-semibold text-foreground">אין רשומות להיום</p>
              <p className="text-sm mt-1">הוסף ארוחה דרך הטאבים למעלה</p>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map(entry => (
                <div key={entry.id} className="bg-card border border-border rounded-xl p-3.5 flex items-center justify-between shadow-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[14px] text-foreground truncate">{entry.food_name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {new Date(entry.logged_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                      {' · '}{entry.entry_method === 'text' ? 'AI' : entry.entry_method === 'photo' ? 'AI + תמונה' : 'ידני'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 mr-2">
                    <div className="text-left">
                      <p className="text-[15px] font-bold tabular text-foreground">{formatKcal(entry.kcal)}</p>
                      <p className="text-[10px] text-muted-foreground">קל׳</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteEntry(entry.id, entry.food_name)}
                      aria-label={'מחק ' + entry.food_name}
                      className="w-7 h-7 rounded-full bg-red-soft text-red flex items-center justify-center text-xs font-bold hover:bg-red hover:text-white transition-colors flex-shrink-0"
                    >✕</button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* לשונית מלל + תמונה */}
        {activeTab === 'text' && (
          <form onSubmit={submitText} className="space-y-3">
            <div className="relative">
              <label className={labelCls}>תאר מה אכלת</label>
              <textarea value={textInput} onChange={e => handleTextChange(e.target.value)}
                placeholder="לדוגמא: אכלתי מוצרלה 100 גרם" rows={3} required
                className={`${inputCls} resize-none`} />
              {memoryLoading && (
                <span className="absolute bottom-3 left-4 text-[10px] text-muted-foreground">מחפש בזיכרון...</span>
              )}
            </div>

            {/* הצעות מהזיכרון */}
            {showMemory && !selectedMemory && (
              <div className="bg-card border border-purple-soft rounded-xl overflow-hidden shadow-sm">
                <div className="px-3 py-2 bg-purple-soft flex items-center gap-2">
                  <span className="text-[9px] font-bold text-purple uppercase">✦ זוכר מוצרים דומים</span>
                </div>
                {memoryItems.map((item, i) => (
                  <button key={i} type="button" onClick={() => selectMemoryItem(item)}
                    className="w-full px-3 py-3 flex items-center justify-between hover:bg-muted transition-colors border-t border-border first:border-0 text-right">
                    <div>
                      <p className="text-[13px] font-semibold text-foreground">{item.food_name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {item.protein_g}g חלבון · {item.carbs_g}g פחמימות · {item.fat_g}g שומן
                        {item.grams ? ` · ${item.grams}g` : ''}
                        {item.count > 1 ? ` · ${item.count} פעמים קודמות` : ''}
                      </p>
                    </div>
                    <div className="text-left flex-shrink-0 mr-2">
                      <p className="text-[14px] font-bold tabular text-purple">{formatKcal(item.kcal)}</p>
                      <p className="text-[9px] text-muted-foreground">קל׳</p>
                    </div>
                  </button>
                ))}
                <button type="button" onClick={() => { setSelectedMemory(null); setShowMemory(false) }}
                  className="w-full px-3 py-3 text-right text-[12px] text-muted-foreground hover:bg-muted transition-colors border-t border-border">
                  אף אחת מהן — תנתח עם AI
                </button>
              </div>
            )}

            {/* מוצר נבחר מזיכרון */}
            {selectedMemory && (
              <div className="bg-purple-soft border border-purple rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-purple font-bold mb-0.5">✦ ממוצר שמור בזיכרון</p>
                  <p className="text-[13px] font-semibold text-foreground">{selectedMemory.food_name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{formatKcal(selectedMemory.kcal)} קל׳ · {selectedMemory.protein_g}g חלבון</p>
                </div>
                <button type="button" onClick={() => { setSelectedMemory(null); setShowMemory(true) }}
                  className="text-muted-foreground text-[12px] hover:text-foreground transition-colors mr-2">
                  שנה
                </button>
              </div>
            )}

            {/* העלאת תמונה */}
            {!selectedMemory && (
              <div>
                <label className={labelCls}>תמונת תווית תזונה (אופציונלי)</label>
                {imagePreview ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePreview} alt="תווית" className="w-full max-h-48 object-contain rounded-xl border border-border bg-muted" />
                    <button type="button" onClick={clearImage}
                      className="absolute top-2 left-2 w-7 h-7 rounded-full bg-red flex items-center justify-center text-white text-xs font-bold">✕</button>
                    <div className="absolute bottom-2 right-2 bg-green text-white text-[10px] font-bold px-2 py-0.5 rounded-full">GPT-4o + Gemini ✓</div>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="w-full border-2 border-dashed border-border rounded-xl py-7 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                    <span className="text-[12px] font-semibold">צלם או העלה תווית</span>
                    <span className="text-[10px]">GPT-4o + Gemini ינתחו יחד לדיוק מרבי</span>
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
              </div>
            )}

            {/* אינדיקטור מודל */}
            {!selectedMemory && (
              <div className={`border rounded-xl px-3 py-2 flex items-center gap-2 ${imageB64 ? 'bg-purple-soft border-purple' : 'bg-brand-soft border-primary'}`}>
                <span className={`text-[10px] font-bold uppercase ${imageB64 ? 'text-purple' : 'text-primary'}`}>
                  {imageB64 ? 'GPT-4o Vision + Gemini' : 'GPT-4o'}
                </span>
                <span className="text-foreground/60 text-[11px]">
                  {imageB64 ? 'שני מודלים מנתחים יחד — ממוצע לדיוק מרבי' : 'מנתח מלל חופשי'}
                </span>
              </div>
            )}

            {/* שגיאת ניתוח */}
            {textError && (
              <div className="rounded-xl bg-red-soft border border-red px-4 py-3 text-sm text-red font-medium">
                {textError}
              </div>
            )}

            <button type="submit" disabled={loading || !textInput}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-semibold py-3 rounded-xl transition-colors">
              {loading ? 'מנתח...' : selectedMemory ? 'שמור מזיכרון' : imageB64 ? 'נתח מלל + תמונה' : 'נתח טקסט'}
            </button>

            {textResult && (
              <div className="bg-green-soft border border-green rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <p className="text-green font-bold">נוסף ליומן ✓</p>
                  <span className="text-[9px] bg-green text-white px-2 py-0.5 rounded-full font-bold">{textResult.model_used}</span>
                  {textResult.confidence === 'high' && (
                    <span className="text-[9px] bg-brand-soft text-primary px-2 py-0.5 rounded-full font-bold">דיוק גבוה ✓</span>
                  )}
                </div>
                {textResult.entries.map((e: NutritionEntry, i: number) => (
                  <div key={i} className="flex justify-between text-sm py-1 text-foreground">
                    <span>{e.food_name}{e.grams ? ` (${e.grams}g)` : ''}</span>
                    <span className="font-bold tabular">{formatKcal(e.kcal)} קל׳</span>
                  </div>
                ))}
                <div className="border-t border-green mt-2 pt-2 flex justify-between font-bold text-foreground">
                  <span>סה״כ</span><span>{formatKcal(textResult.total_kcal)} קל׳</span>
                </div>
              </div>
            )}
          </form>
        )}

        {/* לשונית ידני */}
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
              {([['protein_g','חלבון (g)'],['carbs_g','פחמימות (g)'],['fat_g','שומן (g)']] as [keyof typeof form, string][]).map(([k,l]) => (
                <div key={k}>
                  <label className={labelCls}>{l}</label>
                  <input type="number" value={form[k]} onChange={e => setForm(p=>({...p,[k]:e.target.value}))} placeholder="0" min="0" step="0.1" className={inputCls} />
                </div>
              ))}
            </div>

            {manualError && (
              <div className="rounded-xl bg-red-soft border border-red px-4 py-3 text-sm text-red font-medium">
                {manualError}
              </div>
            )}

            <button type="submit" disabled={loading||!form.food_name||!form.kcal}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-semibold py-3 rounded-xl transition-colors">
              {loading ? 'שומר...' : 'הוסף לרשומות'}
            </button>
          </form>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
