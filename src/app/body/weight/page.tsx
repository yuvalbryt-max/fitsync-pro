'use client'
import { useState, useEffect, useCallback } from 'react'
import { BottomNav } from '@/components/v0-ui/bottom-nav'
import { AppHeader } from '@/components/v0-ui/app-header'
import { formatKg } from '@/lib/utils'

interface BodyMetric { id: number; measured_at: string; weight_kg: number; source: string }

function getBucket(iso: string): 'morning' | 'midday' | 'evening' {
  const h = new Date(iso).getHours()
  if (h >= 5 && h < 10) return 'morning'
  if (h >= 10 && h < 16) return 'midday'
  return 'evening'
}

const BUCKET_LABEL:  Record<string, string> = { morning: 'בוקר', midday: 'צהריים', evening: 'ערב' }
const BUCKET_COLOR:  Record<string, string> = { morning: 'text-primary', midday: 'text-amber', evening: 'text-purple' }
const BUCKET_BG:     Record<string, string> = { morning: 'bg-brand-soft', midday: 'bg-amber-soft', evening: 'bg-purple-soft' }
const BUCKET_BORDER: Record<string, string> = { morning: 'border-t-primary', midday: 'border-t-amber', evening: 'border-t-purple' }

export default function WeightPage() {
  const [metrics, setMetrics]   = useState<BodyMetric[]>([])
  const [weight, setWeight]     = useState('')
  const [loading, setLoading]   = useState(false)
  const [fetching, setFetching] = useState(true) // true initially — no synchronous setState in effect
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/body/weight')
      if (res.ok) setMetrics(await res.json())
      else setError('שגיאה בטעינת הנתונים')
    } catch {
      setError('בעיית חיבור — נסה לרענן')
    } finally {
      setFetching(false)
    }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load() }, [load])

  async function deleteWeight(id: number) {
    if (!window.confirm('למחוק מדידה זו?')) return
    const res = await fetch('/api/body/weight?id=' + id, { method: 'DELETE' })
    if (res.ok) await load()
  }

  async function submitWeight(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    const res = await fetch('/api/body/weight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weight_kg: weight }),
    })
    if (res.ok) {
      setSaved(true); setWeight('')
      await load()
      setTimeout(() => setSaved(false), 3000)
    } else {
      const d = await res.json().catch(() => ({}))
      setError(d.error || 'שגיאה בשמירת המשקל')
    }
    setLoading(false)
  }

  const latestMorning = metrics.find(m => getBucket(m.measured_at) === 'morning')
  const prevMorning   = metrics.filter(m => getBucket(m.measured_at) === 'morning')[1]
  const diff = latestMorning && prevMorning
    ? latestMorning.weight_kg - prevMorning.weight_kg
    : null

  const nowBucket = getBucket(new Date().toISOString())

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <AppHeader title="משקל גוף" subtitle="מגמה נפרדת לכל שעה ביום" />

      <div className="flex-1 px-4 py-3 pb-6 space-y-3">

        {/* שגיאה */}
        {error && (
          <div className="rounded-xl bg-red-soft border border-red px-4 py-3 text-sm text-red font-medium">
            {error}
          </div>
        )}

        {/* מדידה אחרונה */}
        {latestMorning && (
          <div className={`bg-card border border-border border-t-2 ${BUCKET_BORDER[getBucket(latestMorning.measured_at)]} rounded-2xl p-4 shadow-sm`}>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase mb-2">מדידה אחרונה</p>
            <div className="flex items-baseline gap-3">
              <span className={`text-[36px] font-extrabold tabular ${BUCKET_COLOR[getBucket(latestMorning.measured_at)]}`}>
                {formatKg(latestMorning.weight_kg)}
              </span>
              <span className="text-muted-foreground">ק״ג</span>
              {diff !== null && (
                <span className={`text-[13px] font-bold ${diff < 0 ? 'text-green' : diff > 0 ? 'text-red' : 'text-muted-foreground'}`}>
                  {diff > 0 ? '+' : ''}{diff.toFixed(1)} ק״ג
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {new Date(latestMorning.measured_at).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
              {' · '}{BUCKET_LABEL[getBucket(latestMorning.measured_at)]}
            </p>
          </div>
        )}

        {/* טופס הוספה */}
        <form onSubmit={submitWeight} className="bg-card border border-border rounded-2xl p-4 shadow-sm">
          <p className="text-[12px] text-muted-foreground font-semibold mb-3">
            הוסף מדידה עכשיו ·{' '}
            <span className={BUCKET_COLOR[nowBucket]}>{BUCKET_LABEL[nowBucket]}</span>
          </p>
          <div className="flex gap-2 items-center">
            <input
              type="number" value={weight} onChange={e => setWeight(e.target.value)}
              placeholder="79.5" step="0.1" min="30" max="300" required
              className="flex-1 bg-muted border border-input rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary text-base tabular"
            />
            <span className="text-muted-foreground text-sm">ק״ג</span>
            <button
              type="submit" disabled={loading || !weight}
              className={`font-bold px-5 py-3 rounded-xl transition-colors disabled:opacity-50 ${
                saved
                  ? 'bg-green text-white'
                  : `${BUCKET_BG[nowBucket]} ${BUCKET_COLOR[nowBucket]} hover:opacity-80`
              }`}
            >
              {saved ? '✓' : loading ? '...' : 'שמור'}
            </button>
          </div>
        </form>

        {/* היסטוריה */}
        <div>
          <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide mb-2 px-1">היסטוריה</p>

          {fetching ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-card border border-border rounded-xl px-4 py-3 h-[62px] animate-pulse" />
              ))}
            </div>
          ) : metrics.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <div className="text-4xl mb-2">⚖️</div>
              <p className="text-sm font-semibold text-foreground">אין מדידות עדיין</p>
              <p className="text-xs mt-1">הוסף את המשקל הראשון שלך</p>
            </div>
          ) : (
            <div className="space-y-2">
              {metrics.slice(0, 25).map(m => {
                const b = getBucket(m.measured_at)
                return (
                  <div key={m.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${BUCKET_BG[b]}`}>
                        <span className={`text-[10px] font-bold ${BUCKET_COLOR[b]}`}>{BUCKET_LABEL[b][0]}</span>
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-foreground">{BUCKET_LABEL[b]}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(m.measured_at).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}
                          {' · '}
                          {new Date(m.measured_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                    <span className={`text-[15px] font-bold tabular ${BUCKET_COLOR[b]}`}>
                      {formatKg(m.weight_kg)} ק״ג
                    </span>
                      <button type="button" onClick={() => deleteWeight(m.id)} aria-label="מחק מדידה"
                        className="w-6 h-6 rounded-full bg-red-soft text-red flex items-center justify-center text-[10px] font-bold hover:bg-red hover:text-white transition-colors">
                        ✕
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
