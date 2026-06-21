import { cn } from '@/lib/utils'

type Bar = {
  day: string
  value: number // negative = deficit (good/green), positive = surplus (red)
}

export function CalorieBalanceChart({ data }: { data: Bar[] }) {
  const maxAbs = Math.max(...data.map((d) => Math.abs(d.value)), 1)

  return (
    <div className="flex h-44 items-stretch justify-between gap-2">
      {data.map((bar, i) => {
        const pct = (Math.abs(bar.value) / maxAbs) * 50
        const isSurplus = bar.value > 0
        return (
          <div key={i} className="flex flex-1 flex-col items-center">
            <div className="relative flex w-full flex-1 items-center justify-center">
              <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
              {bar.value !== 0 && (
                <div
                  className={cn(
                    'absolute w-full max-w-[22px] rounded-md',
                    isSurplus ? 'bg-red' : 'bg-green',
                  )}
                  style={{
                    height: `${pct}%`,
                    top: isSurplus ? undefined : '50%',
                    bottom: isSurplus ? '50%' : undefined,
                  }}
                />
              )}
            </div>
            <span className="mt-1 text-[11px] font-semibold text-muted-foreground">
              {bar.day}
            </span>
          </div>
        )
      })}
    </div>
  )
}
