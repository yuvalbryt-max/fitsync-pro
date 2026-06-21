interface DayBar { day: string; value: number }

export function WeeklyActivity({ data }: { data: DayBar[] }) {
  const hasRealData = data.some(d => d.value > 5)

  if (!hasRealData) {
    return (
      <section className="rounded-3xl border bg-white p-5 sm:p-6" style={{ borderColor: 'var(--border)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold" style={{ color: 'var(--foreground)' }}>פעילות שבועית</h2>
          <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}>השבוע</span>
        </div>
        <div className="flex flex-col items-center justify-center py-6 gap-2" style={{ color: 'var(--muted-foreground)' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
          <p className="text-sm font-medium">אין נתוני פעילות לשבוע זה</p>
          <p className="text-xs text-center">הנתונים יופיעו לאחר סינכרון גארמין</p>
        </div>
      </section>
    )
  }

  const peak = Math.max(...data.map(d => d.value))
  return (
    <section className="rounded-3xl border bg-white p-5 sm:p-6" style={{ borderColor: 'var(--border)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold" style={{ color: 'var(--foreground)' }}>פעילות שבועית</h2>
        <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}>השבוע</span>
      </div>
      <div className="mt-6 flex h-44 items-end justify-between gap-2">
        {data.map(d => {
          const isPeak = d.value === peak && d.value > 5
          return (
            <div key={d.day} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
              {d.value > 5 && (
                <span className="text-xs font-semibold tabular" style={{ color: 'var(--muted-foreground)' }}>{d.value}%</span>
              )}
              <div className="w-full rounded-t-lg transition-all"
                style={{ height: `${Math.max(d.value, 8)}%`, background: isPeak ? 'var(--primary)' : 'rgba(29,78,216,0.18)', borderRadius: '6px 6px 3px 3px' }}/>
              <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>{d.day}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
