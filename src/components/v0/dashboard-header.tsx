interface Props { userName: string; greeting: string }

export function DashboardHeader({ userName, greeting }: Props) {
  const initial = userName[0]?.toUpperCase() ?? 'י'
  return (
    <header className="flex items-center justify-between gap-4 pb-1">
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl text-white shrink-0"
          style={{ background: 'var(--primary)' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-sm leading-tight" style={{ color: 'var(--muted-foreground)' }}>{greeting}</p>
          <h1 className="text-xl font-extrabold leading-tight truncate" style={{ color: 'var(--foreground)' }}>
            לוח הבריאות שלי
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button type="button"
          className="relative flex size-10 items-center justify-center rounded-2xl border transition-colors"
          style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--muted-foreground)' }}
          aria-label="התראות">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
        </button>
        <div className="flex size-10 items-center justify-center rounded-2xl font-bold text-white text-sm"
          style={{ background: 'linear-gradient(135deg, #1D4ED8, #7C3AED)' }}>
          {initial}
        </div>
      </div>
    </header>
  )
}
