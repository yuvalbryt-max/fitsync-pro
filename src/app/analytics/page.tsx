import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppHeader } from '@/components/v0-ui/app-header'
import { BottomNav } from '@/components/v0-ui/bottom-nav'
import { LineChart } from '@/components/v0-ui/line-chart'
import { WeeklyBarChart } from '@/components/v0-ui/weekly-bar-chart'
import { CalorieBalanceChart } from '@/components/v0-ui/calorie-balance-chart'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const monthAgo = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10)
  const weekAgo  = new Date(Date.now() - 6  * 86400000).toISOString().slice(0, 10)

  const [{ data: weightsRaw }, { data: summariesRaw }, { data: metricsRaw }] = await Promise.all([
    supabase.from('body_weights').select('weight_kg,recorded_at').eq('user_id', user.id)
      .gte('recorded_at', monthAgo).order('recorded_at'),
    supabase.from('daily_summary').select('date,consumed_kcal,active_kcal').eq('user_id', user.id)
      .gte('date', weekAgo).order('date'),
    supabase.from('health_metrics').select('value,recorded_at').eq('user_id', user.id)
      .eq('metric_type', 'hrv').gte('recorded_at', monthAgo).order('recorded_at'),
  ])

  const dayNames = ['א','ב','ג','ד','ה','ו','ש']
  const weekBars = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000)
    const ds = (summariesRaw || []).find(s => s.date === d.toISOString().slice(0, 10))
    return {
      day: dayNames[d.getDay()],
      value: ds?.active_kcal ? Math.min(Math.round(ds.active_kcal / 600 * 100), 100) : 0,
    }
  })

  const calBalance = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000)
    const ds = (summariesRaw || []).find(s => s.date === d.toISOString().slice(0, 10))
    if (!ds) return { day: dayNames[d.getDay()], value: 0 }
    return { day: dayNames[d.getDay()], value: (ds.consumed_kcal || 0) - (ds.active_kcal || 0) - 2000 }
  })

  const weights = (weightsRaw || []).map(w => w.weight_kg)
  const weightLabels = weightsRaw && weightsRaw.length > 0
    ? [new Date(weightsRaw[0].recorded_at).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' }),
       new Date(weightsRaw[weightsRaw.length - 1].recorded_at).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })]
    : []

  const hrvData = (metricsRaw || []).map(m => m.value)
  const latestWeight = weights.length > 0 ? weights[weights.length - 1] : null
  const weightChange = weights.length > 1 ? (weights[weights.length - 1] - weights[0]).toFixed(1) : null

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <AppHeader title="ניתוח וגרפים" />

      <main className="flex flex-col gap-4 px-4 py-4 pb-6 flex-1">

        {/* Weight card */}
        <section className="rounded-3xl bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">מגמת משקל</h2>
            <div className="flex items-center gap-2">
              {latestWeight && (
                <span className="text-sm font-bold text-foreground">{latestWeight} ק״ג</span>
              )}
              {weightChange !== null && (
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  Number(weightChange) <= 0 ? 'bg-green-soft text-green' : 'bg-red-soft text-red'
                }`}>
                  {Number(weightChange) > 0 ? '+' : ''}{weightChange} ק״ג
                </span>
              )}
            </div>
          </div>
          {weights.length > 1 ? (
            <LineChart data={weights} color="#1d4ed8" labels={weightLabels} height={100} />
          ) : (
            <div className="flex h-24 items-center justify-center">
              <p className="text-sm text-muted-foreground">אין מספיק נתוני משקל להצגת גרף</p>
            </div>
          )}
        </section>

        {/* HRV card */}
        {hrvData.length > 1 && (
          <section className="rounded-3xl bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground">HRV שינויות</h2>
              <span className="rounded-full bg-purple-soft px-2.5 py-1 text-[11px] font-semibold text-purple">
                30 יום
              </span>
            </div>
            <LineChart data={hrvData} color="#7c3aed" height={80} />
          </section>
        )}

        {/* Weekly activity */}
        <section className="rounded-3xl bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">פעילות שבועית</h2>
            <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-semibold text-primary">
              קלוריות פעילות
            </span>
          </div>
          <WeeklyBarChart data={weekBars} />
        </section>

        {/* Calorie balance */}
        <section className="rounded-3xl bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">מאזן קלורי</h2>
            <div className="flex items-center gap-3 text-[11px] font-medium">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green inline-block"/>גירעון</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red inline-block"/>עודף</span>
            </div>
          </div>
          <CalorieBalanceChart data={calBalance} />
        </section>

        {/* Summary stats */}
        <section className="rounded-3xl bg-card p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-foreground">סיכום שבועי</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'קלוריות ממוצע', value: summariesRaw && summariesRaw.length > 0
                ? Math.round(summariesRaw.reduce((s, d) => s + (d.consumed_kcal || 0), 0) / summariesRaw.length).toLocaleString('he-IL')
                : '—', unit: 'קל׳/יום', color: 'text-amber', bg: 'bg-amber-soft' },
              { label: 'פעילות ממוצע', value: summariesRaw && summariesRaw.length > 0
                ? Math.round(summariesRaw.reduce((s, d) => s + (d.active_kcal || 0), 0) / summariesRaw.length).toLocaleString('he-IL')
                : '—', unit: 'קל׳/יום', color: 'text-green', bg: 'bg-green-soft' },
            ].map(s => (
              <div key={s.label} className={`rounded-2xl ${s.bg} p-3`}>
                <p className="text-[11px] font-medium text-muted-foreground">{s.label}</p>
                <p className={`mt-1 text-xl font-extrabold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.unit}</p>
              </div>
            ))}
          </div>
        </section>

      </main>

      <BottomNav />
    </div>
  )
}
