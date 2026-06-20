import { createClient } from '@/lib/supabase/server'

export default async function TopBar() {
  let initial = 'י'
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    initial = user?.email?.[0]?.toUpperCase() ?? 'י'
  } catch { /* Supabase not available during build */ }
  const hour = new Date().getHours()
  const greeting = hour<12?'בוקר טוב':hour<17?'צהריים טובים':'ערב טוב'
  return (
    <header className="flex items-center justify-between px-5 pt-4 pb-3 sticky top-0 z-50 bg-gradient-to-b from-[#080c14] via-[#080c14]/90 to-transparent">
      <div>
        <p className="text-xs text-[#8896aa] font-medium">{greeting},</p>
        <p className="text-lg font-bold">יובל 💪</p>
      </div>
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center text-sm font-bold text-white" aria-label="פרופיל">{initial}</div>
    </header>
  )
}
