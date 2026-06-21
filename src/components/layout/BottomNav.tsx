'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Item = { href: string; label: string; color: string }
const NAV: Item[] = [
  { href: '/',          label: 'בית',   color: '#1D4ED8' },
  { href: '/training',  label: 'אימון', color: '#7C3AED' },
  { href: '/nutrition', label: 'תזונה', color: '#059669' },
  { href: '/analytics', label: 'ניתוח', color: '#D97706' },
  { href: '/ai',        label: 'AI',    color: '#DB2777' },
]

const Icon = {
  '/': (a: boolean, c: string) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={a ? c : 'none'} stroke={a ? c : '#94A3B8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  '/training': (a: boolean, c: string) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={a ? c : '#94A3B8'} strokeWidth="2" strokeLinecap="round">
      <line x1="6" y1="6" x2="18" y2="6"/><line x1="6" y1="18" x2="18" y2="18"/>
      <line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/>
      <line x1="5" y1="9" x2="5" y2="15"/><line x1="19" y1="9" x2="19" y2="15"/>
    </svg>
  ),
  '/nutrition': (a: boolean, c: string) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={a ? c : '#94A3B8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  '/analytics': (a: boolean, c: string) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={a ? c : '#94A3B8'} strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  '/ai': (a: boolean, c: string) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={a ? c : '#94A3B8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  ),
} as Record<string, (active: boolean, color: string) => React.ReactNode>

export default function BottomNav() {
  const pathname = usePathname()
  return (
    <nav
      className="sticky bottom-0 z-50 bg-white border-t border-[#E2E8F0]"
      style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))', boxShadow: '0 -1px 0 #E2E8F0' }}
      aria-label="ניווט ראשי"
    >
      <div className="flex">
        {NAV.map(({ href, label, color }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link key={href} href={href}
              className="flex-1 flex flex-col items-center pt-2 pb-1 relative"
              aria-current={active ? 'page' : undefined}>
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-[3px] w-8 rounded-b-full"
                  style={{ background: color }}/>
              )}
              <span className="h-7 flex items-center justify-center">
                {Icon[href]?.(active, color)}
              </span>
              <span className="text-[10px] font-semibold mt-0.5"
                style={{ color: active ? color : '#94A3B8' }}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
