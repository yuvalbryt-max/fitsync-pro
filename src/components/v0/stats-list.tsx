import { TrendingUp, TrendingDown } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface Stat {
  id: string; label: string; value: string; unit: string
  goal: string; progress: number; delta?: string; trend?: 'up' | 'down'; Icon: LucideIcon
}

export function StatsList({ stats, updatedText }: { stats: Stat[]; updatedText?: string }) {
  return (
    <section className="rounded-3xl border bg-white" style={{ borderColor: 'var(--border)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <h2 className="text-base font-bold" style={{ color: 'var(--foreground)' }}>המדדים שלי היום</h2>
        {updatedText && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}>
            {updatedText}
          </span>
        )}
      </div>
      <ul>
        {stats.map((stat, i) => {
          const { Icon } = stat
          const hasValue = stat.value !== '--' && stat.value !== '0'
          const isLast = i === stats.length - 1
          return (
            <li key={stat.id}
              className={`flex items-center gap-4 px-4 py-3.5 ${!isLast ? 'border-b' : ''}`}
              style={{ borderColor: 'var(--border)' }}>
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}>
                <Icon className="size-5" aria-hidden="true" strokeWidth={1.8}/>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--muted-foreground)' }}>{stat.label}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-[22px] font-extrabold tabular leading-none"
                    style={{ color: hasValue ? 'var(--foreground)' : 'var(--muted-foreground)' }}>
                    {stat.value}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{stat.unit}</span>
                </div>
                {hasValue && (
                  <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full" style={{ background: 'var(--muted)' }}>
                    <div className="h-full rounded-full" style={{ width: `${stat.progress}%`, background: 'var(--primary)', transition: 'width 0.6s ease' }}/>
                  </div>
                )}
              </div>
              <div className="shrink-0 text-left">
                {stat.delta && stat.trend ? (
                  <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${stat.trend === 'up' ? 'text-green-700 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                    {stat.trend === 'up' ? <TrendingUp className="size-3"/> : <TrendingDown className="size-3"/>}
                    {stat.delta}
                  </span>
                ) : (
                  <span className="text-xs text-right block max-w-[60px]" style={{ color: 'var(--muted-foreground)' }}>{stat.goal}</span>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
