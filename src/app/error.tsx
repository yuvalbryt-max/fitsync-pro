'use client'
import { useEffect } from 'react'
import { BottomNav } from '@/components/v0-ui/bottom-nav'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-soft">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-lg font-bold text-foreground">משהו השתבש</h2>
        <p className="text-sm text-muted-foreground">אירעה שגיאה בטעינת הדף. נסה שוב.</p>
        <button
          onClick={reset}
          className="rounded-2xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          נסה שוב
        </button>
      </main>
      <BottomNav />
    </div>
  )
}
