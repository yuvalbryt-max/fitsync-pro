import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppHeader } from '@/components/v0-ui/app-header'
import { BottomNav } from '@/components/v0-ui/bottom-nav'
import { WeeklyBarChart } from '@/components/v0-ui/weekly-bar-chart'

export default async function TrainingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const weekAgo  = new Date(Date.now() - 6  * 86400000).toISOString().slice(0, 10)
  const monthAgo = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10)

  const [{ data: workoutsRaw }, { data: recentRaw }] = await Promise.all([
    supabase.from('workouts').select('workout_date').eq('user_id', user.id).gte('workout_date', weekAgo),
    supabase.from('workouts').select('*').eq('user_id', user.id).gte('workout_date', monthAgo)
      .order('workout_date', { ascending: false }).limit(10),
  ])

  const dayNames = ['א','ב','ג','ד','ה','ו','ש']
  const weekBars = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000)
    const dateStr = d.toISOString().slice(0, 10)
    const hasWorkout = (workoutsRaw || []).some(w => w.workout_date === dateStr)
    return { day: dayNames[d.getDay()], value: hasWorkout ? 100 : 0 }
  })

  const weekCount = (workoutsRaw || []).length
  const monthCount = (recentRaw || []).length

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <AppHeader title="אימונים" />

      <main className="flex flex-col gap-4 px-4 py-4 pb-6 flex-1">

        {/* Weekly summary card */}
        <section className="rounded-3xl bg-primary p-5 text-primary-foreground shadow-lg">
          <h2 className="text-sm font-semibold text-primary-foreground/80">סיכום שבועי</h2>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-5xl font-extrabold">{weekCount}</span>
            <span className="text-lg font-medium text-primary-foreground/70">/ 5</span>
          </div>
          <p className="mt-1 text-xs text-primary-foreground/70">
            {weekCount >= 5 ? 'יעד שבועי הושג! 🎯' : weekCount >= 3 ? 'כמעט שם! 💪' : 'המשך לאמן'}
          </p>
          <div className="mt-4">
            <WeeklyBarChart data={weekBars} />
          </div>
        </section>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-card p-4 shadow-sm text-center">
            <p className="text-3xl font-extrabold text-foreground">{weekCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">אימונים השבוע</p>
          </div>
          <div className="rounded-2xl bg-card p-4 shadow-sm text-center">
            <p className="text-3xl font-extrabold text-foreground">{monthCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">אימונים בחודש</p>
          </div>
        </div>

        {/* Recent workouts */}
        <section className="rounded-3xl bg-card p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-foreground">אימונים אחרונים</h2>
          {recentRaw && recentRaw.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {recentRaw.map((w: Record<string, unknown>, i: number) => (
                <li key={i} className="flex items-center justify-between rounded-2xl bg-secondary px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {String(w.workout_type || w.source || 'אימון')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(String(w.workout_date)).toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  {typeof w.duration_min === 'number' && (
                    <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-semibold text-primary">
                      {w.duration_min} דק׳
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center py-10 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round"><path d="M9 9v6M15 9v6"/><rect x="3.4" y="7.6" width="3.2" height="8.8" rx="1.2"/><rect x="17.4" y="7.6" width="3.2" height="8.8" rx="1.2"/></svg>
              </div>
              <p className="font-semibold text-foreground">אין אימונים עדיין</p>
              <p className="mt-1 text-sm text-muted-foreground">הנתונים יסונכרנו מGarmin ו-Jefit</p>
            </div>
          )}
        </section>

      </main>

      <BottomNav />
    </div>
  )
}
