import Link from 'next/link'
import { BottomNav } from '@/components/v0-ui/bottom-nav'

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <main className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-soft">
          <span className="text-4xl">🔍</span>
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">404</h1>
          <h2 className="mt-1 text-base font-semibold text-foreground">הדף לא נמצא</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            הדף שחיפשת לא קיים או הוסר.
          </p>
        </div>
        <Link
          href="/"
          className="rounded-2xl bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          חזרה לדשבורד
        </Link>
      </main>
      <BottomNav />
    </div>
  )
}
