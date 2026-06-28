import { cn } from '@/lib/utils'

type Accent = 'blue' | 'emerald' | 'amber' | 'purple' | 'pink' | 'red'

const ACCENT_MAP: Record<Accent, { border: string; value: string }> = {
  blue:    { border: 'border-t-primary', value: 'text-primary'  },
  emerald: { border: 'border-t-green',   value: 'text-green'    },
  amber:   { border: 'border-t-amber',   value: 'text-amber'    },
  purple:  { border: 'border-t-purple',  value: 'text-purple'   },
  pink:    { border: 'border-t-pink',    value: 'text-pink'     },
  red:     { border: 'border-t-red',     value: 'text-red'      },
}

interface MetricCardProps {
  label:      string
  value:      string
  unit?:      string
  sub?:       string
  accent:     Accent
  className?: string
  onClick?:   () => void
}

export default function MetricCard({
  label, value, unit, sub, accent, className, onClick
}: MetricCardProps) {
  const s = ACCENT_MAP[accent]

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-card border border-border border-t-2 rounded-2xl p-3.5 text-right shadow-sm',
        'transition-transform active:scale-[0.97]',
        onClick && 'cursor-pointer',
        s.border,
        className
      )}
    >
      <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className={cn('text-[22px] font-extrabold leading-none tabular', s.value)}>
        {value}
        {unit && (
          <span className="text-xs text-muted-foreground font-medium mr-1">{unit}</span>
        )}
      </p>
      {sub && <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>}
    </div>
  )
}
