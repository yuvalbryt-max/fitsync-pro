import { Bell } from 'lucide-react'

interface Props { userName: string; greeting: string }

export function DashboardHeader({ userName, greeting }: Props) {
  const initial = userName[0]?.toUpperCase() ?? 'י'
  return (
    <header className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl text-white"
          style={{ background: 'var(--primary)' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
        </div>
        <div>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{greeting}</p>
          <h1 className="text-xl font-bold leading-tight" style={{ color: 'var(--foreground)' }}>לוח הבריאות שלי</h1>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" className="relative flex size-11 items-center justify-center rounded-2xl border transition-colors hover:bg-slate-50"
          style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--muted-foreground)' }} aria-label="התראות">
          <Bell className="size-5" aria-hidden="true"/>
        </button>
        <div className="flex size-11 items-center justify-center rounded-2xl font-bold text-white"
          style={{ background: 'linear-gradient(135deg, var(--primary), #7C3AED)' }} aria-hidden="true">
          {initial}
        </div>
      </div>
    </header>
  )
}
