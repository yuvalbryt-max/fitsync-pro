import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import BottomNav from '@/components/layout/BottomNav'
import ReadinessRing from '@/components/dashboard/ReadinessRing'
import type { DailySummary, HealthMetric, AiInsight } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const today = new Date().toISOString().slice(0, 10)
  const [{ data: summary }, { data: metrics }, { data: insight }] = await Promise.all([
    supabase.from('daily_summary').select('*').eq('user_id', user.id).eq('date', today).maybeSingle(),
    supabase.from('health_metrics').select('*').eq('user_id', user.id)
      .in('metric_type', ['hrv','hr_resting','stress','steps','vo2max'])
      .gte('recorded_at', today).order('recorded_at', { ascending: false }),
    supabase.from('ai_insights').select('*').eq('user_id', user.id).eq('insight_date', today).maybeSingle(),
  ])

  const getM = (t: string) => (metrics as HealthMetric[] | null)?.find(m => m.metric_type === t)?.value ?? null
  const hrv = getM('hrv'), hr = getM('hr_resting'), stress = getM('stress'), steps = getM('steps'), vo2 = getM('vo2max')
  const ds  = summary as DailySummary | null
  const ins = insight as AiInsight | null

  const readiness = hrv ? Math.min(100, Math.round((hrv / 80) * 100)) : 0
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'בוקר טוב' : hour < 17 ? 'צהריים טובים' : 'ערב טוב'
  const dateStr = new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })

  const BLUE = '#1E56C4'

  return (
    <div className="flex flex-col min-h-dvh" style={{ background: '#F0F4F8' }}>

      {/* ─── TOP BAR ─── */}
      <div className="bg-white px-5 pt-4 pb-3 sticky top-0 z-50" style={{ boxShadow: '0 1px 0 #E5EAF0' }}>
        <div className="flex items-center justify-between">
          <div className="w-9 h-9 flex items-center justify-center rounded-full bg-[#F0F4F8]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
          </div>
          <div className="text-center">
            <p className="text-[16px] font-bold" style={{ color: BLUE }}>{greeting}, יובל</p>
            <p className="text-[11px] text-[#94A3B8]">{dateStr}</p>
          </div>
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
            style={{ background: `linear-gradient(135deg, ${BLUE}, #7C3AED)` }}>י</div>
        </div>
      </div>

      {/* ─── QUICK ACTIONS — all same blue (Maccabi style) ─── */}
      <div className="bg-white px-5 py-4" style={{ borderBottom: '1px solid #E5EAF0' }}>
        <div className="flex justify-between">
          {[
            { href: '/nutrition', label: 'הוסף ארוחה', icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/> },
            { href: '/ai',        label: 'AI Coach',   icon: <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/> },
            { href: '/body/weight', label: 'הוסף משקל', icon: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></> },
            { href: '/training',  label: 'אימון כוח', icon: <><line x1="6" y1="6" x2="18" y2="6"/><line x1="6" y1="18" x2="18" y2="18"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/><line x1="5" y1="9" x2="5" y2="15"/><line x1="19" y1="9" x2="19" y2="15"/></> },
            { href: '/analytics', label: 'ניתוח',      icon: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></> },
          ].map(({ href, label, icon }) => (
            <Link key={href} href={href} className="flex flex-col items-center gap-1.5 active:opacity-70">
              <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center"
                style={{ background: BLUE, boxShadow: `0 3px 10px ${BLUE}35` }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
              </div>
              <span className="text-[10px] font-medium text-[#64748B] text-center leading-tight w-14">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ─── CONTENT ─── */}
      <div className="flex-1 px-4 pb-4">

        {/* Readiness */}
        <p className="text-[15px] font-bold text-[#0F1729] mt-4 mb-2">מוכנות יומית</p>
        <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
          <div className="flex items-center gap-4">
            <ReadinessRing score={readiness} />
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-bold text-[#0F1729] mb-2">
                {!hrv ? 'מחכה לגארמין' : readiness >= 75 ? 'כושר טוב' : readiness >= 50 ? 'כושר בינוני' : 'מנוחה מומלצת'}
              </p>
              {!hrv ? (
                <p className="text-[12px] text-[#94A3B8]">סנכרן גארמין להציג נתונים</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {hrv    && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">HRV {hrv}ms</span>}
                  {hr     && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">{hr} BPM</span>}
                  {stress && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">עקה {stress}</span>}
                  {vo2    && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]">VO₂ {vo2}</span>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Daily stats — clean list, no grid */}
        <div className="flex items-center justify-between mt-4 mb-2">
          <p className="text-[15px] font-bold text-[#0F1729]">סיכום יומי</p>
          <Link href="/analytics" className="text-[13px] font-semibold" style={{ color: BLUE }}>הכול</Link>
        </div>
        <div className="bg-white rounded-2xl divide-y divide-[#F1F5F9]" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
          {[
            { label: 'מאזן קלורי', value: ds ? `${ds.net_balance > 0 ? '+' : ''}${ds.net_balance.toLocaleString('he-IL')}` : '--', unit: 'קל׳',
              sub: ds ? `נאכל ${ds.consumed_kcal.toLocaleString('he-IL')} קל׳` : 'לא הוזנה תזונה', color: ds && ds.net_balance <= 0 ? '#059669' : '#DC2626', href: '/nutrition' },
            { label: 'צעדים', value: steps ? steps.toLocaleString('he-IL') : '--', unit: '',
              sub: 'יעד: 10,000', color: BLUE, href: undefined },
            ...(ds ? [{ label: 'חלבון', value: `${ds.protein_g}`, unit: 'g',
              sub: `שרפה ${(ds.bmr_kcal + ds.active_kcal).toLocaleString('he-IL')} קל׳`, color: '#7C3AED', href: undefined }] : []),
          ].map(row => {
            const inner = (
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-[13px] font-semibold text-[#0F1729]">{row.label}</p>
                  <p className="text-[11px] text-[#94A3B8] mt-0.5">{row.sub}</p>
                </div>
                <div className="text-left">
                  <span className="text-[20px] font-extrabold tabular" style={{ color: row.color }}>{row.value}</span>
                  {row.unit && <span className="text-[12px] text-[#94A3B8] mr-1">{row.unit}</span>}
                </div>
              </div>
            )
            return row.href
              ? <Link key={row.label} href={row.href} className="block active:bg-[#F8FAFC] transition-colors">{inner}</Link>
              : <div key={row.label}>{inner}</div>
          })}
        </div>

        {/* AI Insight */}
        {ins && (
          <>
            <p className="text-[15px] font-bold text-[#0F1729] mt-4 mb-2">תובנת AI</p>
            <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)', borderRight: '4px solid #DB2777' }}>
              <span className="text-[9px] font-bold bg-[#FDF2F8] text-[#DB2777] border border-[#FBCFE8] px-2 py-0.5 rounded-full uppercase inline-block mb-2">✦ AI Coach</span>
              <p className="text-[13px] text-[#374151] leading-relaxed"
                dangerouslySetInnerHTML={{ __html: ins.content.replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#0F1729]">$1</strong>') }} />
            </div>
          </>
        )}

      </div>
      <BottomNav />
    </div>
  )
}
