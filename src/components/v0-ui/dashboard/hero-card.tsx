import { ActivityRings } from '@/components/v0-ui/activity-rings'

type Ring = { value: number; color: string }
type MiniStat = { label: string; value: string }

interface HeroCardProps {
  completion?: number
  rings?: Ring[]
  miniStats?: MiniStat[]
}

export function HeroCard({ completion = 0, rings, miniStats }: HeroCardProps) {
  const defaultRings: Ring[] = [
    { value: 0, color: '#ffffff' },
    { value: 0, color: '#bfdbfe' },
    { value: 0, color: '#7dd3fc' },
  ]
  const defaultStats: MiniStat[] = [
    { label: 'קלוריות', value: '0/2000' },
    { label: 'אימון',   value: '0/5' },
    { label: 'צעדים',   value: '0/10K' },
  ]
  const displayRings = rings ?? defaultRings
  const displayStats = miniStats ?? defaultStats

  return (
    <section className="rounded-3xl bg-primary p-5 text-primary-foreground shadow-lg shadow-primary/25">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <h2 className="text-sm font-semibold text-primary-foreground/80">סיכום פעילות יומי</h2>
          <span className="mt-1 text-5xl font-extrabold leading-none">{completion}%</span>
          <span className="mt-2 text-xs font-medium text-primary-foreground/70">
            {completion >= 80 ? 'כמעט סיימת את היעדים! 🎯' : completion >= 50 ? 'בדרך הנכונה! 💪' : 'השלמת היעדים היומיים שלך'}
          </span>
        </div>
        <ActivityRings size={120} rings={displayRings} />
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3">
        {displayStats.map((stat) => (
          <div key={stat.label} className="rounded-2xl bg-white/10 px-3 py-3 text-center backdrop-blur-sm">
            <div className="text-base font-bold">{stat.value}</div>
            <div className="mt-0.5 text-[11px] font-medium text-primary-foreground/75">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
