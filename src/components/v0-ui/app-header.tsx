import type { ReactNode } from 'react'
import { Activity } from 'lucide-react'
import { cn } from '@/lib/utils'

type AppHeaderProps = {
  title: string
  subtitle?: string
  badge?: ReactNode
  className?: string
  avatarUrl?: string    // Google OAuth profile picture URL
  userInitial?: string  // First letter of name for fallback avatar
}

export function AppHeader({ title, subtitle, badge, className, avatarUrl, userInitial }: AppHeaderProps) {
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
      <div className="flex shrink-0 items-center">
        {avatarUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={avatarUrl}
            alt="תמונת פרופיל"
            referrerPolicy="no-referrer"
            className="h-9 w-9 rounded-full object-cover ring-2 ring-card"
          />
        ) : (
          <div
            role="img"
            aria-label="אווטאר פרופיל"
            className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-teal ring-2 ring-card flex items-center justify-center text-white text-sm font-bold"
          >
            {userInitial ?? ''}
          </div>
        )}
      </div>
    </header>
  )
}