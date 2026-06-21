'use client'

interface Ring { label: string; value: number; goal: number }
interface SummaryHeroProps {
  completionPct: number
  rings: Ring[]
  subtitle?: string
}

function ArcRing({ radius, progress }: { radius: number; progress: number }) {
  const C = 2 * Math.PI * radius
  const offset = C * (1 - Math.min(progress, 1))
  return (
    <>
      <circle cx="90" cy="90" r={radius} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="11"/>
      <circle cx="90" cy="90" r={radius} fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="11"
        strokeLinecap="round" strokeDasharray={C} strokeDashoffset={offset} transform="rotate(-90 90 90)"/>
    </>
  )
}

export function SummaryHero({ completionPct, rings, subtitle }: SummaryHeroProps) {
  return (
    <section className="rounded-3xl p-6 sm:p-8" style={{ background: 'var(--primary)' }}>
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
        <div className="order-2 text-center sm:order-1 sm:text-right">
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>סיכום פעילות יומי</p>
          <p className="mt-1 text-5xl font-extrabold tabular tracking-tight text-white">{completionPct}%</p>
          <p className="mt-2 max-w-xs text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.8)' }}>
            {subtitle || (completionPct >= 80
              ? 'אתה קרוב מאוד להשלמת היעדים! עוד מעט ותסגור את כל הטבעות.'
              : completionPct >= 50
              ? 'המשך כך! אתה בדרך הנכונה להשגת היעדים שלך.'
              : 'התחל את יומך — כל צעד קטן מקרב אותך ליעד.')}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-5 sm:justify-start">
            {rings.map((r) => (
              <div key={r.label} className="text-center sm:text-right">
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>{r.label}</p>
                <p className="text-lg font-bold text-white tabular">
                  {r.value}
                  <span className="text-xs font-normal" style={{ color: 'rgba(255,255,255,0.6)' }}> / {r.goal}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative order-1 shrink-0 sm:order-2">
          <svg viewBox="0 0 180 180" className="size-44" role="img" aria-label={`התקדמות יעדים: ${completionPct}%`}>
            <ArcRing radius={78} progress={rings[0]?.value / Math.max(rings[0]?.goal, 1) || 0} />
            <ArcRing radius={62} progress={rings[1]?.value / Math.max(rings[1]?.goal, 1) || 0} />
            <ArcRing radius={46} progress={rings[2]?.value / Math.max(rings[2]?.goal, 1) || 0} />
          </svg>
        </div>
      </div>
    </section>
  )
}
