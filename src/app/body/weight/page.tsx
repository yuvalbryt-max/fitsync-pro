'use client'
import { useState, useEffect, useCallback } from 'react'
import BottomNav from '@/components/layout/BottomNav'
import { formatKg } from '@/lib/utils'

interface BodyMetric { id: number; measured_at: string; weight_kg: number; source: string }

function getBucket(iso: string): 'morning' | 'midday' | 'evening' {
  const h = new Date(iso).getHours()
  if (h >= 5 && h < 10) return 'morning'
  if (h >= 10 && h < 16) return 'midday'
  return 'evening'
}

const BUCKET_LABEL: Record<string, string> = { morning: 'בוקר', midday: 'צהריים', evening: 'ערב' }
const BUCKET_COLOR: Record<string, string> = { morning: '#3b82f6', midday: '#f59e0b', evening: '#8b5cf6' }

export default function WeightPage() {
  const [metrics, setMetrics] = useState<BodyMetric[]>([])
  const [weight, setWeight]   = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved]     = useState(false)

  const load = useCallback(async () => {
    const res = await fetch('/api/body/weight')
    if (res.ok) setMetrics(await res.json())
  }, [])

  useEffect(() => { load() }, [load])

  async function submitWeight(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/body/weight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weight_kg: weight }),
    })
    if (res.ok) {
      setSaved(true); setWeight(''); await load()
      setTimeout(() => setSaved(false), 3000)
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
    <div className="flex flex-col min-h-screen">
      <div className="px-5 pt-5 pb-3 sticky top-0 z-50 bg-[#080c14]">
        <h1 className="text-xl font-bold mb-0.5">משקל גוף</h1>
        <p className="text-[11px] text-[#8896aa]">מגמה נפרדת לכל שעה ביום</p>
      </div>

      <div className="px-4 space-y-3 flex-1">
        {latestMorning && (
          <div className="bg-[#0f1520] border border-[#1c2535] border-t-2 border-t-[#f59e0b] rounded-2xl p-4">
            <p className="text-[10px] text-[#8896aa] font-semibold uppercase mb-2">מדידה אחרונה</p>
            <div className="flex items-baseline gap-3">
              <span className="text-[36px] font-extrabold tabular text-[#f59e0b]">{formatKg(latestMorning.weight_kg)}</span>
              <span className="text-[#8896aa]">ק״ג</span>
              {diff !== null && (
                <span className={`text-[13px] font-bold ${diff < 0 ? 'text-[#10b981]' : diff > 0 ? 'text-[#f43f5e]' : 'text-[#8896aa]'}`}>
                  {diff > 0 ? '+' : ''}{diff.toFixed(1)} ק״ג
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#8896aa] mt-1">
              {new Date(latestMorning.measured_at).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
              {' · '}{BUCKET_LABEL[getBucket(latestMorning.measured_at)]}
            </p>
          </div>
        )}

        <form onSubmit={submitWeight} className="bg-[#0f1520] border border-[#1c2535] rounded-2xl p-4">
          <p className="text-[12px] text-[#8896aa] font-semibold mb-3">
            הוסף מדידה עכשיו ·{' '}
            <span style={{ color: BUCKET_COLOR[nowBucket] }}>{BUCKET_LABEL[nowBucket]}</span>
          </p>
          <div className="flex gap-2 items-center">
            <input type="number" value={weight} onChange={e => setWeight(e.target.value)}
              placeholder="79.5" step="0.1" min="30" max="300" required
              className="flex-1 bg-[#080c14] border border-[#1c2535] rounded-xl px-4 py-3 text-[#e8edf5] placeholder:text-[#3d4f65] focus:outline-none focus:border-[#f59e0b] text-base tabular" />
            <span className="text-[#8896aa] text-sm">ק״ג</span>
            <button type="submit" disabled={loading || !weight}
              className="bg-[#f59e0b] hover:bg-[#d97706] disabled:opacity-50 text-black font-bold px-5 py-3 rounded-xl transition-colors">
              {saved ? '✓' : loading ? '...' : 'שמור'}
            </button>
          </div>
        </form>

        <div>
          <p className="text-[11px] text-[#8896aa] font-semibold uppercase tracking-wide mb-2 px-1">היסטוריה</p>
          {metrics.length === 0 ? (
            <div className="text-center py-10 text-[#8896aa]">
              <p className="text-4xl mb-2">⚖️</p>
              <p className="text-sm font-semibold">אין מדידות עדיין</p>
              <p className="text-xs mt-1">הוסף את המשקל הראשון שלך</p>
            </div>
          ) : (
            <div className="space-y-2">
              {metrics.slice(0, 25).map(m => {
                const b = getBucket(m.measured_at)
                return (
                  <div key={m.id} className="bg-[#0f1520] border border-[#1c2535] rounded-xl px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: BUCKET_COLOR[b] }} />
                      <div>
                        <p className="text-[13px] font-semibold">{BUCKET_LABEL[b]}</p>
                        <p className="text-[11px] text-[#8896aa]">
                          {new Date(m.measured_at).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}
                          {' · '}
                          {new Date(m.measured_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <span className="text-[15px] font-bold tabular" style={{ color: BUCKET_COLOR[b] }}>
                      {formatKg(m.weight_kg)} ק״ג
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      <div className="h-4" />
      <BottomNav />
    </div>
  )
}
