import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TopBar from '@/components/layout/TopBar'
import BottomNav from '@/components/layout/BottomNav'
import ReadinessRing from '@/components/dashboard/ReadinessRing'
import MetricCard from '@/components/dashboard/MetricCard'
import CalorieBalanceCard from '@/components/dashboard/CalorieBalanceCard'
import AiInsightCard from '@/components/dashboard/AiInsightCard'
import type { DailySummary, HealthMetric, AiInsight } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const today = new Date().toISOString().slice(0, 10)

  const [{ data: summary }, { data: metrics }, { data: insight }] = await Promise.all([
    supabase.from('daily_summary').select('*').eq('user_id', user.id).eq('date', today).maybeSingle(),
    supabase.from('health_metrics').select('*').eq('user_id', user.id)
      .in('metric_type', ['hrv', 'hr_resting', 'stress', 'steps', 'vo2max'])
      .gte('recorded_at', today).order('recorded_at', { ascending: false }),
    supabase.from('ai_insights').select('*').eq('user_id', user.id).eq('insight_date', today).maybeSingle(),
  ])

  const getMetric = (type: string) =>
    (metrics as HealthMetric[] | null)?.find(m => m.metric_type === type)?.value ?? null

  const hrv    = getMetric('hrv')
  const hr     = getMetric('hr_resting')
  const stress = getMetric('stress')
  const steps  = getMetric('steps')
  const vo2    = getMetric('vo2max')
  const readiness = hrv ? Math.min(100, Math.round((hrv / 80) * 100)) : 0

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar />
      <div className="mx-5 mb-2">
        <div className="inline-flex items-center gap-2 bg-[#0f1520] border border-[#1c2535] px-3 py-1.5 rounded-full text-[11px] text-[#8896aa] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
          {new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>
      <div className="flex items-center gap-4 px-5 pb-4">
        <ReadinessRing score={readiness} />
        <div>
          {readiness === 0 ? (
            <>
              <p className="font-bold text-[15px] text-[#3d4f65]">מחכה לגארמין</p>
              <p className="text-[12px] text-[#3d4f65] mt-1">סנכרן את גארמין להציג נתונים</p>
              <p className="text-[10px] text-[#2d3d52] mt-1">פתח את Garmin Connect ← סנכרן</p>
            </>
          ) : (
            <>
              <p className="font-bold text-[15px]">
                {readiness >= 75 ? 'כושר טוב' : readiness >= 50 ? 'כושר בינוני' : 'מנוחה מומלצת'}
              </p>
              <p className="text-[12px] text-[#8896aa] mt-1">
                {`HRV: ${hrv}ms`}
              </p>
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {hrv    && <span className="text-[9px] bg-[#1d3461] border border-[#2555a0] text-[#3b82f6] px-2 py-0.5 rounded-full font-semibold">HRV {hrv}ms</span>}
                {stress && <span className="text-[9px] bg-[#3d2800] border border-[#7a5200] text-[#f59e0b] px-2 py-0.5 rounded-full font-semibold">עקה {stress}</span>}
                {vo2    && <span className="text-[9px] bg-[#2d1a52] border border-[#5b3aac] text-[#8b5cf6] px-2 py-0.5 rounded-full font-semibold">VO₂ {vo2}</span>}
              </div>
            </>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5 px-3.5 pb-3">
        <CalorieBalanceCard summary={summary as DailySummary | null} />
        {steps !== null && (
          <MetricCard label="צעדים" value={steps.toLocaleString('he-IL')} sub="יעד: 10,000" accent="blue" />
        )}
        {hrv !== null && hr !== null && (
          <MetricCard label="HRV · דופק" value={`${hrv}`} unit="ms" sub={`דופק מנוחה: ${hr} BPM`} accent="blue" />
        )}
        <AiInsightCard insight={insight as AiInsight | null} />
      </div>
      <BottomNav />
    </div>
  )
}
