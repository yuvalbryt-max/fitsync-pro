interface DayBar { day: string; value: number }

export function WeeklyActivity({ data }: { data: DayBar[] }) {
  if (!data.length) return null
  const peak = Math.max(...data.map(d => d.value))
  return (
    <section className="rounded-3xl border bg-white p-5 sm:p-6" style={{ borderColor: 'var(--border)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold" style={{ color: 'var(--foreground)' }}>פעילות שבועית</h2>
        <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}>השבוע</span>
      </div>
      <div className="mt-6 flex h-44 items-end justify-between gap-2">
        {data.map(d => {
          const isPeak = d.value === peak
          return (
            <div key={d.day} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
              <span className="text-xs font-semibold tabular" style={{ color: 'var(--muted-foreground)' }}>{d.value}</span>
              <div className="w-full rounded-t-lg rounded-b-sm transition-all"
                style={{ height: `${d.value}%`, background: isPeak ? 'var(--primary)' : 'rgba(29,78,216,0.2)' }}/>
              <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>{d.day}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
