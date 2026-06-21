import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'

interface Action { id: string; label: string; href: string; Icon: LucideIcon; color?: string }

export function QuickActions({ actions }: { actions: Action[] }) {
  return (
    <section className="rounded-3xl border bg-white p-5 sm:p-6" style={{ borderColor: 'var(--border)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-base font-bold" style={{ color: 'var(--foreground)' }}>פעולות מהירות</h2>
        <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>השירותים שלי</span>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {actions.map(({ id, label, href, Icon }) => (
          <Link key={id} href={href}
            className="flex flex-col items-center gap-2 active:opacity-70 transition-opacity">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-white"
              style={{ background: 'var(--primary)', boxShadow: '0 4px 14px rgba(29,78,216,0.3)' }}>
              <Icon className="w-6 h-6" strokeWidth={2} aria-hidden="true"/>
            </div>
            <span className="text-center leading-tight font-medium" style={{ fontSize: '11px', color: 'var(--foreground)' }}>{label}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
