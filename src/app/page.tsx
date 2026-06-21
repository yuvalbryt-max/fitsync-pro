import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import BottomNav from '@/components/layout/BottomNav'
import ReadinessRing from '@/components/dashboard/ReadinessRing'
import AiInsightCard from '@/components/dashboard/AiInsightCard'
import type { DailySummary, HealthMetric, AiInsight } from '@/lib/types'

function SectionHeader({ title, href, linkText }: { title: string; href?: string; linkText?: string }) {
  return (
    <div className="flex items-center justify-between px-4 pt-5 pb-2">
      <h2 className="text-[11px] font-bold text-[#8896aa] uppercase tracking-[0.08em]">{title}</h2>
      {href && linkText && (
        <Link href={href} className="text-[12px] text-[#3b82f6] font-semibold">{linkText} ›</Link>
      )}
    </div>
  )
}

function StatCard({ label, value, unit, sub, accent, href }: {
  label: string; value: string; unit?: string; sub?: string; accent: string; href?: string
}) {
  const inner = (
    <div className="bg-[#0f1520] border border-[#1c2535] rounded-2xl p-4 h-full" style={{ borderTop: `2px solid ${accent}` }}>
      <p className="text-[10px] font-bold text-[#8896aa] uppercase tracking-wider mb-2">{label}</p>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[28px] font-extrabold leading-none tabular" style={{ color: accent }}>{value}</span>
        {unit && <span className="text-[12px] text-[#8896aa]">{unit}</span>}
      </div>
      {sub && <p className="text-[11px] text-[#8896aa] mt-1.5">{sub}</p>}
    </div>
  )
  return href ? <Link href={href} className="block active:opacity-75 transition-opacity">{inner}</Link> : inner
}

function QuickAction({ href, label, color, children }: { href: string; label: string; color: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex flex-col items-center gap-1.5 active:opacity-70 transition-opacity">
      <div className="w-[54px] h-[54px] rounded-2xl flex items-center justify-center"
        style={{ background: `${color}15`, border: `1.5px solid ${color}35` }}>
        {children}
      </div>
      <span className="text-[10px] font-semibold text-center leading-tight" style={{ color: '#8896aa' }}>{label}</span>
    </Link>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const today = new Date().toISOString().slice(0, 10)

  const [{ data: summary }, { data: metrics }, { data: insight }, { data: activities }] =
    await Promise.all([
      supabase.from('daily_summary').select('*').eq('user_id', user.id).eq('date', today).maybeSingle(),
      supabase.from('health_metrics').select('*').eq('user_id', user.id)
        .in('metric_type', ['hrv','hr_resting','stress','steps','vo2max'])
        .gte('recorded_at', today).order('recorded_at', { ascending: false }),
      supabase.from('ai_insights').select('*').eq('user_id', user.id).eq('insight_date', today).maybeSingle(),
      supabase.from('activities').select('activity_type,calories,hr_avg,duration_seconds')
        .eq('user_id', user.id).gte('started_at', today).limit(4),
    ])

  const getM = (t: string) => (metrics as HealthMetric[] | null)?.find(m => m.metric_type === t)?.value ?? null
  const hrv = getM('hrv'), hr = getM('hr_resting'), stress = getM('stress'), steps = getM('steps'), vo2 = getM('vo2max')
  const ds  = summary as DailySummary | null
  const ins = insight as AiInsight | null
  const acts = (activities || []) as Array<{ activity_type: string; calories: number | null; hr_avg: number | null; duration_seconds: number | null }>

  const readiness = hrv ? Math.min(100, Math.round((hrv / 80) * 100)) : 0
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'בוקר טוב' : hour < 17 ? 'צהריים טובים' : 'ערב טוב'
  const dateStr = new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="flex flex-col min-h-dvh bg-[#080c14]">

      {/* Top bar */}
      <div className="sticky top-0 z-50 bg-[#080c14]/95 backdrop-blur-sm border-b border-[#1c2535]/60 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-[#8896aa] font-medium">{greeting} •&nbsp;{dateStr}</p>
            <p className="text-[20px] font-bold text-[#e8edf5] leading-tight mt-0.5">יובל 💪</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[#0d3326] border border-[#0a5e40] px-2 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse"/>
              <span className="text-[9px] text-[#10b981] font-bold">LIVE</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center text-sm font-bold text-white">י</div>
          </div>
        </div>
      </div>

      <div className="flex-1 pb-4">

        {/* READINESS */}
        <SectionHeader title="מוכנות יומית" />
        <div className="px-4">
          <div className="bg-[#0f1520] border border-[#1c2535] rounded-2xl p-4" style={{ borderTop: '2px solid #3b82f6' }}>
            <div className="flex items-center gap-4">
              <ReadinessRing score={readiness} />
              <div className="flex-1 min-w-0">
                <p className="text-[16px] font-bold text-[#e8edf5] mb-2">
                  {readiness >= 75 ? 'כושר טוב' : readiness >= 50 ? 'כושר בינוני' : hrv ? 'מנוחה מומלצת' : 'מחכה לגארמין'}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {hrv    && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1d3461] text-[#3b82f6] border border-[#2555a0]">HRV {hrv}ms</span>}
                  {hr     && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0d3326] text-[#10b981] border border-[#0a5e40]">{hr} BPM</span>}
                  {stress && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#3d2800] text-[#f59e0b] border border-[#7a5200]">עקה {stress}</span>}
                  {vo2    && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#2d1a52] text-[#8b5cf6] border border-[#5b3aac]">VO₂ {vo2}</span>}
                  {!hrv   && <span className="text-[11px] text-[#3d4f65]">סנכרן גארמין להציג נתונים</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TODAY STATS */}
        <SectionHeader title="היום" href="/analytics" linkText="עוד" />
        <div className="px-4 grid grid-cols-2 gap-3">
          <StatCard label="מאזן קלורי" value={ds ? String(ds.net_balance) : '--'} unit="קל׳"
            sub={ds ? `${ds.consumed_kcal.toLocaleString('he-IL')} נאכל` : 'הזן ארוחה'}
            accent={ds && ds.net_balance <= 0 ? '#10b981' : '#f43f5e'} href="/nutrition" />
          <StatCard label="צעדים" value={steps ? steps.toLocaleString('he-IL') : '--'}
            sub="יעד: 10,000" accent="#3b82f6" />
          {ds && (
            <StatCard label="חלבון" value={`${ds.protein_g}`} unit="g"
              sub={`שרפה ${(ds.bmr_kcal + ds.active_kcal).toLocaleString('he-IL')} קל׳`} accent="#8b5cf6" />
          )}
          {acts.length > 0 && (
            <StatCard label="פעילות" value={String(acts.reduce((s,a) => s + (a.calories||0), 0))} unit="קל׳"
              sub={`${acts.length} פעילויות`} accent="#f59e0b" href="/training" />
          )}
        </div>

        {/* QUICK ACTIONS — Maccabi style */}
        <SectionHeader title="פעולות מהירות" />
        <div className="px-4">
          <div className="bg-[#0f1520] border border-[#1c2535] rounded-2xl px-4 py-5">
            <div className="flex justify-around gap-2">
              <QuickAction href="/nutrition" label="הוסף ארוחה" color="#10b981">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </QuickAction>
              <QuickAction href="/ai" label="AI Coach" color="#ec4899">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              </QuickAction>
              <QuickAction href="/body/weight" label="הוסף משקל" color="#f59e0b">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </QuickAction>
              <QuickAction href="/training" label="אימון כוח" color="#8b5cf6">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round"><line x1="6" y1="6" x2="18" y2="6"/><line x1="6" y1="18" x2="18" y2="18"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/><line x1="5" y1="9" x2="5" y2="15"/><line x1="19" y1="9" x2="19" y2="15"/></svg>
              </QuickAction>
            </div>
          </div>
        </div>

        {/* AI INSIGHT */}
        {ins && (
          <>
            <SectionHeader title="תובנת AI" />
            <div className="px-4"><AiInsightCard insight={ins} /></div>
          </>
        )}

      </div>
      <BottomNav />
    </div>
  )
}
