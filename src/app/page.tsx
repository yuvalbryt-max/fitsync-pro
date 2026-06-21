import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BottomNav }    from '@/components/v0-ui/bottom-nav'
import { AppHeader }    from '@/components/v0-ui/app-header'
import { QuickActions } from '@/components/v0-ui/dashboard/quick-actions'
import { HeroCard }     from '@/components/v0-ui/dashboard/hero-card'
import { StatsList }    from '@/components/v0-ui/dashboard/stats-list'
import { WeeklyBarChart } from '@/components/v0-ui/weekly-bar-chart'
import AiInsightCard from '@/components/dashboard/AiInsightCard'
import type { DailySummary, HealthMetric, AiInsight } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const today    = new Date().toISOString().slice(0, 10)
  const weekAgo  = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10)

  const [{ data: summary }, { data: metricsRaw }, { data: insightRaw }, { data: workoutsRaw }, { data: weekRaw }] =
    await Promise.all([
      supabase.from('daily_summary').select('*').eq('user_id', user.id).eq('date', today).maybeSingle(),
      supabase.from('health_metrics').select('*').eq('user_id', user.id)
        .in('metric_type', ['hrv','hr_resting','stress','steps','vo2max'])
        .gte('recorded_at', today).order('recorded_at', { ascending: false }),
      supabase.from('ai_insights').select('*').eq('user_id', user.id).eq('insight_date', today).maybeSingle(),
      supabase.from('workouts').select('workout_date').eq('user_id', user.id).gte('workout_date', weekAgo),
      supabase.from('daily_summary').select('date,active_kcal').eq('user_id', user.id)
        .gte('date', weekAgo).order('date'),
    ])

  const ds      = summary as DailySummary | null
  const metrics = (metricsRaw || []) as HealthMetric[]
  const ins     = insightRaw as AiInsight | null
  const wkCount = (workoutsRaw || []).length
  const weekData = weekRaw || []

  const getM = (t: string) => metrics.find(m => m.metric_type === t)?.value ?? null
  const steps = getM('steps')
  const hr    = getM('hr_resting')
  const hrv   = getM('hrv')

  // Completion % based on steps + calories + workouts
  const stepsPct    = steps    ? Math.min(steps / 10000 * 100, 100)                  : 0
  const calPct      = ds       ? Math.min(ds.consumed_kcal / 2000 * 100, 100)        : 0
  const workoutsPct = wkCount  ? Math.min(wkCount / 5 * 100, 100)                   : 0
  const completion  = Math.round((stepsPct + calPct + workoutsPct) / 3)

  // Weekly bar chart: active kcal as % of 600 target
  const dayNames = ['א','ב','ג','ד','ה','ו','ש']
  const weekBars = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000)
    const ds2 = weekData.find(w => w.date === d.toISOString().slice(0, 10))
    return {
      day: dayNames[d.getDay()],
      value: ds2?.active_kcal ? Math.min(Math.round(ds2.active_kcal / 600 * 100), 100) : 0,
    }
  })

  // Rings for hero (each 0–100)
  const heroRings = [
    { value: calPct,      color: '#ffffff' },
    { value: workoutsPct, color: '#bfdbfe' },
    { value: stepsPct,    color: '#7dd3fc' },
  ]

  // Stats data
  const statsData = {
    steps:    steps    ? steps.toLocaleString('he-IL')                                                : null,
    hr:       hr       ? String(Math.round(hr))                                                       : null,
    calories: ds       ? String(ds.active_kcal)                                                       : null,
    protein:  ds       ? String(ds.protein_g)                                                         : null,
    workouts: String(wkCount),
    stepsPct, hrPct: hr ? Math.max(0, 100 - Math.abs(hr - 65) * 4) : 0,
    calPct,   proteinPct: ds ? Math.min(ds.protein_g / 142 * 100, 100) : 0,
    workoutsPct,
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'בוקר טוב' : hour < 17 ? 'צהריים טובים' : 'ערב טוב'
  const dateStr  = new Date().toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short' })

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <AppHeader title="לוח הבריאות שלי" subtitle={`${greeting} · ${dateStr}`} />

      <main className="flex flex-col gap-4 px-4 py-4 pb-6 flex-1">
        <QuickActions />

        <HeroCard
          completion={completion}
          rings={heroRings}
          miniStats={[
            { label: 'קלוריות', value: ds ? `${ds.consumed_kcal}/2000` : '0/2000' },
            { label: 'אימון',   value: `${wkCount}/5` },
            { label: 'צעדים',   value: steps ? `${Math.round(steps/1000)}K/10K` : '0/10K' },
          ]}
        />

        <StatsList
          stats={{
            steps:    statsData.steps,    stepsPct:    statsData.stepsPct,
            hr:       statsData.hr,       hrPct:       statsData.hrPct,
            calories: statsData.calories, calPct:      statsData.calPct,
            protein:  statsData.protein,  proteinPct:  statsData.proteinPct,
            workouts: statsData.workouts, workoutsPct: statsData.workoutsPct,
          }}
          hasGarmin={!!hrv}
        />

        {weekBars.some(b => b.value > 0) && (
          <section className="rounded-3xl bg-card p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground">פעילות שבועית</h2>
              <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-semibold text-primary">
                קלוריות
              </span>
            </div>
            <WeeklyBarChart data={weekBars} />
          </section>
        )}

        {ins && (
          <div className="rounded-3xl bg-card p-4 shadow-sm" style={{ borderRight: '4px solid var(--pink)' }}>
            <span className="inline-block mb-2 text-[9px] font-bold bg-pink text-white px-2 py-0.5 rounded-full uppercase" style={{ background: 'var(--pink)' }}>✦ AI Coach</span>
            <p className="text-[13px] text-foreground/80 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: ins.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}


