'use client'

import { useState } from 'react'
import { Sparkles, Camera, Clock, Send } from 'lucide-react'
import { cn } from '@/lib/utils'

type TabKey = 'log' | 'ai' | 'manual'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'log', label: 'יומן' },
  { key: 'ai', label: 'מלל + תמונה' },
  { key: 'manual', label: 'ידני' },
]

type Macro = {
  label: string
  value: number
  goal: number
  barClass: string
}

const MACROS: Macro[] = [
  { label: 'חלבון', value: 0, goal: 140, barClass: 'bg-primary' },
  { label: 'פחמימות', value: 0, goal: 220, barClass: 'bg-amber' },
  { label: 'שומן', value: 0, goal: 70, barClass: 'bg-purple' },
]

type Method = 'AI' | 'צילום' | 'ידני'

type FoodEntry = {
  name: string
  time: string
  method: Method
  calories: number
}

const FOOD_LOG: FoodEntry[] = [
  { name: 'חביתה עם ירקות', time: '08:30', method: 'AI', calories: 320 },
  { name: 'יוגורט יווני ופירות יער', time: '11:00', method: 'צילום', calories: 210 },
  { name: 'חזה עוף עם אורז מלא', time: '13:45', method: 'ידני', calories: 540 },
  { name: 'שייק חלבון', time: '17:20', method: 'AI', calories: 180 },
]

const METHOD_STYLE: Record<Method, string> = {
  AI: 'bg-brand-soft text-primary',
  צילום: 'bg-teal-soft text-teal',
  ידני: 'bg-secondary text-muted-foreground',
}

function MacroSummary() {
  return (
    <section className="rounded-3xl bg-card p-5 shadow-sm">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-xs font-semibold text-muted-foreground">סך הכל קלוריות היום</p>
          <p className="mt-1 text-4xl font-extrabold text-foreground">
            0<span className="mr-1 text-base font-medium text-muted-foreground">/ 2000 קק״ל</span>
          </p>
        </div>
        <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-primary">
          נותרו 2000
        </span>
      </div>

      <div className="mt-5 flex flex-col gap-4">
        {MACROS.map((m) => (
          <div key={m.label}>
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="text-xs font-semibold text-foreground">{m.label}</span>
              <span className="text-[11px] font-medium text-muted-foreground">
                {m.value} / {m.goal} ג׳
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={cn('h-full rounded-full', m.barClass)}
                style={{ width: `${Math.max((m.value / m.goal) * 100, 2)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function FoodLog() {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="px-1 text-sm font-bold text-foreground">יומן ארוחות</h2>
      {FOOD_LOG.map((entry, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-3 rounded-2xl bg-card p-3.5 shadow-sm"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">{entry.name}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                <Clock className="h-3 w-3" />
                {entry.time}
              </span>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[11px] font-bold',
                  METHOD_STYLE[entry.method],
                )}
              >
                {entry.method}
              </span>
            </div>
          </div>
          <div className="shrink-0 text-left">
            <span className="text-lg font-extrabold text-foreground">{entry.calories}</span>
            <span className="block text-[11px] font-medium text-muted-foreground">קק״ל</span>
          </div>
        </div>
      ))}
    </section>
  )
}

function AiCapture() {
  return (
    <section className="flex flex-col gap-4">
      <div className="rounded-3xl bg-card p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="meal-text" className="text-sm font-bold text-foreground">
            תאר את הארוחה
          </label>
          <span className="inline-flex items-center gap-1 rounded-full bg-pink-soft px-2.5 py-1 text-[11px] font-bold text-pink">
            <Sparkles className="h-3 w-3" />
            GPT-4o Vision
          </span>
        </div>
        <textarea
          id="meal-text"
          dir="rtl"
          rows={3}
          placeholder="לדוגמה: צלחת פסטה ברוטב עגבניות עם פרמזן וכוס יין אדום..."
          className="w-full resize-none rounded-2xl bg-secondary p-3 text-sm text-foreground outline-none ring-primary/30 placeholder:text-muted-foreground focus:ring-2"
        />
      </div>

      <button
        type="button"
        className="flex flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-border bg-card/60 px-4 py-8 text-center transition-colors hover:border-primary/50"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-primary">
          <Camera className="h-6 w-6" />
        </span>
        <span className="text-sm font-bold text-foreground">צלם או העלה תמונה</span>
        <span className="text-xs text-muted-foreground">
          ה-AI יזהה את המנה ויחשב קלוריות אוטומטית
        </span>
      </button>

      <button
        type="button"
        className="flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-md shadow-primary/25 active:scale-[0.99]"
      >
        <Send className="h-4 w-4" />
        נתח באמצעות AI
      </button>
    </section>
  )
}

function ManualEntry() {
  const fields = [
    { label: 'שם המאכל', placeholder: 'לדוגמה: בננה' },
    { label: 'קלוריות', placeholder: '0' },
    { label: 'חלבון (גרם)', placeholder: '0' },
    { label: 'פחמימות (גרם)', placeholder: '0' },
  ]
  return (
    <section className="rounded-3xl bg-card p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-bold text-foreground">הוספה ידנית</h2>
      <div className="flex flex-col gap-3">
        {fields.map((f) => (
          <div key={f.label}>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">
              {f.label}
            </label>
            <input
              dir="rtl"
              placeholder={f.placeholder}
              className="w-full rounded-2xl bg-secondary p-3 text-sm text-foreground outline-none ring-primary/30 placeholder:text-muted-foreground focus:ring-2"
            />
          </div>
        ))}
        <button
          type="button"
          className="mt-1 rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-md shadow-primary/25 active:scale-[0.99]"
        >
          הוסף לארוחה
        </button>
      </div>
    </section>
  )
}

export function NutritionView() {
  const [tab, setTab] = useState<TabKey>('log')

  return (
    <main className="flex flex-col gap-5 px-4 py-5 pb-8">
      <div className="flex rounded-2xl bg-secondary p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              'flex-1 rounded-xl py-2 text-xs font-bold transition-colors',
              tab === t.key
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <MacroSummary />

      {tab === 'log' && <FoodLog />}
      {tab === 'ai' && <AiCapture />}
      {tab === 'manual' && <ManualEntry />}
    </main>
  )
}
