import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'

interface Action { id: string; label: string; href: string; Icon: LucideIcon }

export function QuickActions({ actions }: { actions: Action[] }) {
  return (
    <section className="rounded-3xl border bg-white p-5 sm:p-6" style={{ borderColor: 'var(--border)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>פעולות מהירות</h2>
        <span className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>השירותים שלי</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {actions.map(({ id, label, href, Icon }) => (
          <Link key={id} href={href}
            className="group flex flex-col items-center gap-3 rounded-2xl border px-3 py-5 text-center transition-colors hover:border-blue-200 hover:bg-blue-50 active:opacity-70"
            style={{ borderColor: 'var(--border)', background: 'var(--secondary)' }}>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl transition-transform group-hover:scale-105"
              style={{ background: 'var(--primary)', color: 'white' }}>
              <Icon className="h-6 w-6" aria-hidden="true"/>
            </span>
            <span className="text-sm font-semibold leading-5" style={{ color: 'var(--foreground)' }}>{label}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
