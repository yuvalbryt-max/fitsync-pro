import { Footprints, Heart, Flame, Activity, Dumbbell } from 'lucide-react'

interface StatsData {
  steps?: string | null;    stepsPct: number
  hr?: string | null;       hrPct: number
  calories?: string | null; calPct: number
  protein?: string | null;  proteinPct: number
  workouts?: string;        workoutsPct: number
}

interface StatsListProps {
  stats: StatsData
  hasGarmin?: boolean
}

export function StatsList({ stats, hasGarmin = false }: StatsListProps) {
  const rows = [
    { label: 'צעדים',          value: stats.steps    ?? '--', unit: 'צעדים',      goal: 'יעד 10,000', pct: stats.stepsPct,    Icon: Footprints, color: 'text-primary',  soft: 'bg-brand-soft' },
    { label: 'דופק מנוחה',     value: stats.hr       ?? '--', unit: 'פעימות/דק׳', goal: 'טווח 60-100', pct: stats.hrPct,       Icon: Heart,      color: 'text-red',      soft: 'bg-red-soft'   },
    { label: 'קלוריות נשרפו',  value: stats.calories ?? '--', unit: 'קק״ל',       goal: 'יעד 600',    pct: stats.calPct,      Icon: Flame,      color: 'text-amber',    soft: 'bg-amber-soft' },
    { label: 'חלבון',          value: stats.protein  ?? '--', unit: 'גרם',        goal: 'יעד 140',    pct: stats.proteinPct,  Icon: Activity,   color: 'text-purple',   soft: 'bg-purple-soft'},
    { label: 'אימונים השבוע',  value: stats.workouts ?? '0',  unit: 'אימונים',    goal: 'יעד 5',      pct: stats.workoutsPct, Icon: Dumbbell,   color: 'text-green',    soft: 'bg-green-soft' },
  ]

  return (
    <section className="rounded-3xl bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-foreground">המדדים שלי היום</h2>
        <span className="text-xs font-medium text-muted-foreground">
          {hasGarmin ? 'מסונכרן ✓' : 'אין נתוני גארמין'}
        </span>
      </div>
      <ul className="flex flex-col gap-3">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center gap-3">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${row.soft} ${row.color}`}>
              <row.Icon className="h-5 w-5" strokeWidth={2.2} aria-hidden="true"/>
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-semibold text-muted-foreground">{row.label}</span>
                <span className="shrink-0 text-[11px] font-medium text-muted-foreground">{row.goal}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-foreground tabular">{row.value}</span>
                <span className="text-[11px] font-medium text-muted-foreground">{row.unit}</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.max(row.pct, row.pct > 0 ? 2 : 0)}%` }}/>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
