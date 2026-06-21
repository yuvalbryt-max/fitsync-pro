import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  Footprints, HeartPulse, Flame, Dumbbell,
  Activity, UtensilsCrossed, Scale, MessageSquare,
} from 'lucide-react'
import BottomNav from '@/components/layout/BottomNav'
import { DashboardHeader }  from '@/components/v0/dashboard-header'
import { SummaryHero }      from '@/components/v0/summary-hero'
import { StatsList }        from '@/components/v0/stats-list'
import { WeeklyActivity }   from '@/components/v0/weekly-activity'
import { QuickActions }     from '@/components/v0/quick-actions'
import type { DailySummary, HealthMetric } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const today = new Date().toISOString().slice(0, 10)
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - 6)
  const weekStr = weekStart.toISOString().slice(0, 10)

  const [{ data: summary }, { data: metricsRaw }, { data: workoutsRaw }, { data: weekData }] = await Promise.all([
    supabase.from('daily_summary').select('*').eq('user_id', user.id).eq('date', today).maybeSingle(),
    supabase.from('health_metrics').select('*').eq('user_id', user.id)
      .in('metric_type', ['hrv','hr_resting','stress','steps','vo2max'])
      .gte('recorded_at', today).order('recorded_at', { ascending: false }),
    supabase.from('workouts').select('workout_date,total_volume_kg').eq('user_id', user.id)
      .gte('workout_date', weekStr).order('workout_date'),
    supabase.from('daily_summary').select('date,active_kcal').eq('user_id', user.id)
      .gte('date', weekStr).order('date'),
  ])

  const ds     = summary as DailySummary | null
  const metrics = (metricsRaw || []) as HealthMetric[]
  const workouts = workoutsRaw || []
  const week   = weekData || []

  const getM = (t: string) => metrics.find(m => m.metric_type === t)?.value ?? null
  const hrv   = getM('hrv')
  const hr    = getM('hr_resting')
  const steps = getM('steps')
  const vo2   = getM('vo2max')

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'בוקר טוב' : hour < 17 ? 'צהריים טובים' : 'ערב טוב'
  const userName = user.email?.split('@')[0] ?? 'יובל'

  // Completion percentage based on available metrics
  const targets = [
    { val: steps ? steps / 10000 : 0 },
    { val: ds ? Math.min(ds.consumed_kcal / 2000, 1) : 0 },
    { val: workouts.length ? Math.min(workouts.length / 5, 1) : 0 },
  ]
  const completionPct = Math.round(targets.reduce((s, t) => s + t.val, 0) / targets.length * 100)

  // Rings for hero
  const rings = [
    { label: 'קלוריות', value: ds?.consumed_kcal ?? 0, goal: 2000 },
    { label: 'אימונים', value: workouts.length, goal: 5 },
    { label: 'צעדים',  value: steps ? Math.round(steps / 1000) : 0, goal: 10 },
  ]

  // Stats list
  const statItems = [
    {
      id: 'steps', label: 'צעדים', Icon: Footprints,
      value: steps ? steps.toLocaleString('he-IL') : '--',
      unit: 'צעדים', goal: 'יעד: 10,000',
      progress: steps ? Math.min((steps / 10000) * 100, 100) : 0,
    },
    {
      id: 'hr', label: 'דופק מנוחה', Icon: HeartPulse,
      value: hr ? String(Math.round(hr)) : '--',
      unit: 'פעימות/דקה', goal: 'טווח: 60–70',
      progress: hr ? Math.max(0, 100 - Math.abs(hr - 65) * 3) : 0,
    },
    {
      id: 'calories', label: 'קלוריות נאכלו', Icon: Flame,
      value: ds ? ds.consumed_kcal.toLocaleString('he-IL') : '--',
      unit: 'קל׳', goal: 'יעד: 2,000',
      progress: ds ? Math.min((ds.consumed_kcal / 2000) * 100, 100) : 0,
    },
    {
      id: 'protein', label: 'חלבון', Icon: Activity,
      value: ds ? String(ds.protein_g) : '--',
      unit: 'g', goal: `יעד: ${Math.round(79 * 1.8)}g`,
      progress: ds ? Math.min((ds.protein_g / 142) * 100, 100) : 0,
    },
    {
      id: 'workouts', label: 'אימונים השבוע', Icon: Dumbbell,
      value: String(workouts.length),
      unit: 'אימונים', goal: 'יעד: 5',
      progress: Math.min((workouts.length / 5) * 100, 100),
    },
    ...(vo2 ? [{
      id: 'vo2', label: 'VO₂ Max', Icon: Activity,
      value: String(Math.round(vo2)),
      unit: 'ml/kg/min', goal: 'כושר אירובי',
      progress: Math.min((vo2 / 60) * 100, 100),
    }] : []),
  ]

  // Weekly bar chart (steps % of goal or active kcal)
  const dayNames = ['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ש׳']
  const today7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    const dateStr = d.toISOString().slice(0, 10)
    const found = week.find(w => w.date === dateStr)
    const active = found?.active_kcal ?? 0
    const pct = Math.min(Math.round((active / 600) * 100), 100) || (i < 5 ? 0 : 0)
    return { day: dayNames[d.getDay()], value: pct || 5 }
  })

  // Quick actions
  const quickActions = [
    { id: 'nutrition', label: 'הוסף ארוחה',  href: '/nutrition',    Icon: UtensilsCrossed },
    { id: 'weight',    label: 'הוסף משקל',   href: '/body/weight',  Icon: Scale           },
    { id: 'ai',        label: 'AI Coach',     href: '/ai',           Icon: MessageSquare   },
    { id: 'training',  label: 'אימון כוח',   href: '/training',     Icon: Dumbbell        },
  ]

  return (
    <>
      <main className="mx-auto min-h-screen w-full max-w-5xl px-4 pb-28 pt-6">
        <DashboardHeader userName={userName} greeting={greeting} />

        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-5">
          <div className="flex flex-col gap-5 lg:col-span-3">
            <SummaryHero completionPct={completionPct} rings={rings} />
            <WeeklyActivity data={today7} />
          </div>
          <div className="lg:col-span-2">
            <StatsList stats={statItems} updatedText={hrv ? 'מסונכרן' : 'אין נתוני גארמין'} />
          </div>
        </div>

        <div className="mt-5">
          <QuickActions actions={quickActions} />
        </div>
      </main>

      <BottomNav />
    </>
  )
}
