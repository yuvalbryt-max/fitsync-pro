import { TrendingUp, TrendingDown } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface Stat {
  id: string
  label: string
  value: string
  unit: string
  goal: string
  progress: number       // 0-100
  delta?: string
  trend?: 'up' | 'down'
  Icon: LucideIcon
}

export function StatsList({ stats, updatedText }: { stats: Stat[]; updatedText?: string }) {
  return (
    <section className="rounded-3xl border bg-white p-2 sm:p-3" style={{ borderColor: 'var(--border)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-base font-bold" style={{ color: 'var(--card-foreground)' }}>המדדים שלי היום</h2>
        {updatedText && <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>{updatedText}</span>}
      </div>
      <ul className="flex flex-col">
        {stats.map((stat) => {
          const { Icon } = stat
          const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown
          const hasValue = stat.value !== '--' && stat.value !== '0'
          return (
            <li key={stat.id} className="flex items-center gap-4 rounded-2xl px-4 py-4 transition-colors hover:bg-slate-50">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl" style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}>
                <Icon className="size-6" aria-hidden="true"/>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>{stat.label}</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold tabular tracking-tight" style={{ color: hasValue ? 'var(--foreground)' : 'var(--muted-foreground)' }}>{stat.value}</span>
                  <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{stat.unit}</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--muted)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${stat.progress}%`, background: 'var(--primary)' }}/>
                </div>
              </div>
              {stat.delta && stat.trend && (
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${stat.trend === 'up' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                    <TrendIcon className="size-3" aria-hidden="true"/>
                    {stat.delta}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{stat.goal}</span>
                </div>
              )}
              {(!stat.delta || !stat.trend) && (
                <span className="text-xs shrink-0" style={{ color: 'var(--muted-foreground)' }}>{stat.goal}</span>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
