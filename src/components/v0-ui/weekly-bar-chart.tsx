import { cn } from '@/lib/utils'

type Bar = {
  day: string
  value: number
}

type WeeklyBarChartProps = {
  data: Bar[]
  unit?: string
}

export function WeeklyBarChart({ data, unit }: WeeklyBarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1)
  const peak = Math.max(...data.map((d) => d.value))

  return (
    <div className="flex h-40 items-end justify-between gap-2">
      {data.map((bar, i) => {
        const isPeak = bar.value === peak && bar.value > 0
        const heightPct = Math.max((bar.value / max) * 100, 6)
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-28 w-full items-end justify-center">
              <div
                className={cn(
                  'w-full max-w-[26px] rounded-lg transition-all',
                  isPeak ? 'bg-primary' : 'bg-brand-soft',
                )}
                style={{ height: `${heightPct}%` }}
                title={`${bar.value}${unit ?? ''}`}
              />
            </div>
            <span
              className={cn(
                'text-[11px] font-semibold',
                isPeak ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              {bar.day}
            </span>
          </div>
        )
      })}
    </div>
  )
}
