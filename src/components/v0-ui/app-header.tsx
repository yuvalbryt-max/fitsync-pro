import type { ReactNode } from 'react'
import { Activity, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'

type AppHeaderProps = {
  title: string
  subtitle?: string
  badge?: ReactNode
  className?: string
}

export function AppHeader({ title, subtitle, badge, className }: AppHeaderProps) {
  return (
    <header className={cn('sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-card/90 px-4 py-3 backdrop-blur-md', className)}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-primary">
        <Activity className="h-5 w-5" strokeWidth={2.4}/>
      </div>
      <div className="flex min-w-0 flex-1 flex-col items-center text-center">
        <h1 className="truncate text-base font-bold text-foreground">{title}</h1>
        {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
        {badge && <div className="mt-0.5">{badge}</div>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button type="button" aria-label="התראות"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-muted-foreground transition-colors hover:text-foreground">
          <Bell className="h-5 w-5"/>
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red ring-2 ring-card"/>
        </button>
        <div aria-label="פרופיל"
          className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-teal ring-2 ring-card"/>
      </div>
    </header>
  )
}
