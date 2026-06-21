import { AppHeader } from '@/components/v0-ui/app-header'
import { BottomNav } from '@/components/v0-ui/bottom-nav'

export default function Loading() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <AppHeader title="ניתוח וגרפים" />
      <main className="flex flex-col gap-4 px-4 py-4 pb-6 flex-1 animate-pulse">
        <div className="h-40 rounded-3xl bg-secondary" />
        <div className="h-32 rounded-3xl bg-secondary" />
        <div className="h-36 rounded-3xl bg-secondary" />
      </main>
      <BottomNav />
    </div>
  )
}
