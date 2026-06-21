import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import BottomNav from '@/components/layout/BottomNav'
import ReadinessRing from '@/components/dashboard/ReadinessRing'
import type { DailySummary, HealthMetric, AiInsight } from '@/lib/types'

function Section({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between px-4 pt-5 pb-2">
      <h2 className="text-[15px] font-bold text-[#0F1729]">{title}</h2>
      {href && <Link href={href} className="text-[13px] text-[#1D4ED8] font-semibold">הכול</Link>}
    </div>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-[#E8EEF6] ${className}`}
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      {children}
    </div>
  )
}

function MetricCard({ label, value, unit, sub, color, href }: {
  label: string; value: string; unit?: string; sub?: string; color: string; href?: string
}) {
  const inner = (
    <div className="bg-white rounded-2xl border border-[#E8EEF6] p-4"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderTop: `3px solid ${color}` }}>
      <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wide mb-2">{label}</p>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[28px] font-extrabold leading-none tabular" style={{ color }}>{value}</span>
        {unit && <span className="text-[12px] text-[#94A3B8]">{unit}</span>}
      </div>
      {sub && <p className="text-[11px] text-[#64748B] mt-1.5">{sub}</p>}
    </div>
  )
  return href
    ? <Link href={href} className="block active:opacity-75 transition-opacity">{inner}</Link>
    : inner
}

function QuickAction({ href, label, color, children }: {
  href: string; label: string; color: string; children: React.ReactNode
}) {
  return (
    <Link href={href} className="flex flex-col items-center gap-2 active:opacity-70 transition-opacity">
      <div className="w-[58px] h-[58px] rounded-full flex items-center justify-center"
        style={{ background: color, boxShadow: `0 4px 12px ${color}40` }}>
        {children}
      </div>
      <span className="text-[10px] font-semibold text-[#64748B] text-center leading-tight max-w-[56px]">{label}</span>
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

  return (
    <div className="flex flex-col min-h-dvh bg-[#F2F5FA]">

      {/* Top bar — Maccabi style */}
      <div className="sticky top-0 z-50 bg-white border-b border-[#E8EEF6] px-4 py-3"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round">
              <path d="M18 8A6 6 0 00 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
          </div>
          <p className="text-[17px] font-bold text-[#1D4ED8]">{greeting}, יובל</p>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1D4ED8] to-[#7C3AED] flex items-center justify-center text-[14px] font-bold text-white">י</div>
        </div>
      </div>

      {/* Quick Actions scroll — Maccabi blue circles */}
      <div className="bg-white border-b border-[#E8EEF6] px-4 py-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div className="flex gap-4 overflow-x-auto pb-1">
          <QuickAction href="/nutrition" label="הוסף ארוחה" color="#1D4ED8">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </QuickAction>
          <QuickAction href="/ai" label="AI Coach" color="#DB2777">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          </QuickAction>
          <QuickAction href="/body/weight" label="הוסף משקל" color="#D97706">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </QuickAction>
          <QuickAction href="/training" label="אימון כוח" color="#7C3AED">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><line x1="6" y1="6" x2="18" y2="6"/><line x1="6" y1="18" x2="18" y2="18"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/><line x1="5" y1="9" x2="5" y2="15"/><line x1="19" y1="9" x2="19" y2="15"/></svg>
          </QuickAction>
          <QuickAction href="/analytics" label="ניתוח" color="#059669">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          </QuickAction>
        </div>
      </div>

      <div className="flex-1 pb-4">

        {/* Readiness */}
        <Section title="מוכנות יומית" />
        <div className="px-4">
          <Card className="p-4" style={{ borderTop: '3px solid #1D4ED8' } as React.CSSProperties}>
            <div className="flex items-center gap-4">
              <ReadinessRing score={readiness} />
              <div className="flex-1 min-w-0">
                <p className="text-[16px] font-bold text-[#0F1729] mb-2">
                  {readiness >= 75 ? 'כושר טוב' : readiness >= 50 ? 'כושר בינוני' : hrv ? 'מנוחה מומלצת' : 'מחכה לגארמין'}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {hrv    && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">HRV {hrv}ms</span>}
                  {hr     && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">{hr} BPM</span>}
                  {stress && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">עקה {stress}</span>}
                  {vo2    && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]">VO₂ {vo2}</span>}
                  {!hrv   && <span className="text-[11px] text-[#94A3B8]">סנכרן גארמין להציג נתונים</span>}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Stats grid */}
        <Section title="סיכום יומי" href="/analytics" />
        <div className="px-4 grid grid-cols-2 gap-3">
          <MetricCard
            label="מאזן קלורי" unit="קל׳"
            value={ds ? String(ds.net_balance) : '--'}
            sub={ds ? `${ds.consumed_kcal.toLocaleString('he-IL')} נאכל` : 'לא הוזנה תזונה'}
            color={ds && ds.net_balance <= 0 ? '#059669' : '#DC2626'}
            href="/nutrition"
          />
          <MetricCard
            label="צעדים"
            value={steps ? steps.toLocaleString('he-IL') : '--'}
            sub="יעד: 10,000"
            color="#1D4ED8"
          />
          {ds && (
            <MetricCard label="חלבון" value={`${ds.protein_g}`} unit="g"
              sub={`שרפה ${(ds.bmr_kcal + ds.active_kcal).toLocaleString('he-IL')} קל׳`} color="#7C3AED" />
          )}
          {acts.length > 0 && (
            <MetricCard label="פעילות גארמין"
              value={String(acts.reduce((s,a) => s + (a.calories||0), 0))} unit="קל׳"
              sub={`${acts.length} פעילויות`} color="#D97706" href="/training" />
          )}
        </div>

        {/* AI Insight — adapted for light */}
        {ins && (
          <>
            <Section title="תובנת AI" />
            <div className="px-4">
              <div className="rounded-2xl p-4 border border-[#E8EEF6]"
                style={{ background: 'linear-gradient(135deg, #FDF4FF, #EFF6FF)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[9px] font-bold bg-[#DB2777] text-white px-2 py-0.5 rounded-full uppercase tracking-wide">✦ AI Coach</span>
                </div>
                <p className="text-[13px] text-[#374151] leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: ins.content.replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#0F1729]">$1</strong>') }}
                />
              </div>
            </div>
          </>
        )}

      </div>
      <BottomNav />
    </div>
  )
}
