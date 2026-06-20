import { cn } from '@/lib/utils'

type Accent = 'blue' | 'emerald' | 'amber' | 'purple' | 'pink' | 'red'

const ACCENT_MAP: Record<Accent, { border: string; value: string }> = {
  blue:    { border: 'border-t-[#3b82f6]', value: 'text-[#3b82f6]'  },
  emerald: { border: 'border-t-[#10b981]', value: 'text-[#10b981]'  },
  amber:   { border: 'border-t-[#f59e0b]', value: 'text-[#f59e0b]'  },
  purple:  { border: 'border-t-[#8b5cf6]', value: 'text-[#8b5cf6]'  },
  pink:    { border: 'border-t-[#ec4899]', value: 'text-[#ec4899]'  },
  red:     { border: 'border-t-[#f43f5e]', value: 'text-[#f43f5e]'  },
}

interface MetricCardProps {
  label:    string
  value:    string
  unit?:    string
  sub?:     string
  accent:   Accent
  className?: string
  onClick?: () => void
}

export default function MetricCard({
  label, value, unit, sub, accent, className, onClick
}: MetricCardProps) {
  const s = ACCENT_MAP[accent]

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-[#0f1520] border border-[#1c2535] border-t-2 rounded-2xl p-3.5 text-right',
        'transition-transform active:scale-[0.97]',
        onClick && 'cursor-pointer',
        s.border,
        className
      )}
    >
      <p className="text-[10px] text-[#8896aa] font-semibold uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className={cn('text-[22px] font-extrabold leading-none tabular', s.value)}>
        {value}
        {unit && (
          <span className="text-xs text-[#8896aa] font-medium mr-1">{unit}</span>
        )}
      </p>
      {sub && <p className="text-[11px] text-[#8896aa] mt-1">{sub}</p>}
    </div>
  )
}
