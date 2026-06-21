'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

type NavItem = { href: string; label: string; color: string }

const NAV: NavItem[] = [
  { href: '/',          label: 'בית',     color: '#3b82f6' },
  { href: '/training',  label: 'אימון',   color: '#8b5cf6' },
  { href: '/nutrition', label: 'תזונה',   color: '#10b981' },
  { href: '/analytics', label: 'ניתוח',   color: '#f59e0b' },
  { href: '/ai',        label: 'AI',      color: '#ec4899' },
]

const Icons: Record<string, (active: boolean, color: string) => React.ReactNode> = {
  '/': (a, c) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={a ? c : 'none'} stroke={a ? c : '#4b5568'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  '/training': (a, c) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? c : '#4b5568'} strokeWidth="2" strokeLinecap="round">
      <line x1="6" y1="6" x2="18" y2="6"/><line x1="6" y1="18" x2="18" y2="18"/>
      <line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/>
      <line x1="5" y1="9" x2="5" y2="15"/><line x1="19" y1="9" x2="19" y2="15"/>
    </svg>
  ),
  '/nutrition': (a, c) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? c : '#4b5568'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  '/analytics': (a, c) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? c : '#4b5568'} strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  '/ai': (a, c) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? c : '#4b5568'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  ),
}

export default function BottomNav() {
  const pathname = usePathname()
  return (
    <nav
      className="sticky bottom-0 z-50 bg-[#080c14] border-t border-[#1c2535]"
      style={{ paddingBottom: 'max(14px, env(safe-area-inset-bottom))' }}
      aria-label="ניווט ראשי"
    >
      <div className="flex">
        {NAV.map(({ href, label, color }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center pt-3 pb-1 relative"
              aria-current={active ? 'page' : undefined}
            >
              {active && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-8 rounded-b-full"
                  style={{ background: color }}
                />
              )}
              <span className="h-6 flex items-center justify-center">
                {Icons[href]?.(active, color)}
              </span>
              <span
                className="text-[9px] font-semibold mt-1.5"
                style={{ color: active ? color : '#4b5568' }}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
