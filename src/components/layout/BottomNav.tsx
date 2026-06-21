'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ITEMS = [
  {
    href: '/ai', label: 'AI Coach', color: '#DB2777',
    icon: (a: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={a ? '#DB2777' : '#94A3B8'} strokeWidth={a ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a8 8 0 00-8 8c0 2.5 1 4.7 2.7 6.3L6 20l4.3-1.4A8 8 0 1012 2z"/>
        <circle cx="9" cy="10" r="1" fill={a ? '#DB2777' : '#94A3B8'}/>
        <circle cx="12" cy="10" r="1" fill={a ? '#DB2777' : '#94A3B8'}/>
        <circle cx="15" cy="10" r="1" fill={a ? '#DB2777' : '#94A3B8'}/>
      </svg>
    ),
  },
  {
    href: '/analytics', label: 'ניתוח', color: '#D97706',
    icon: (a: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={a ? '#D97706' : '#94A3B8'} strokeWidth={a ? 2.5 : 1.8} strokeLinecap="round">
        <rect x="3" y="12" width="4" height="9" rx="1.5" fill={a ? '#D97706' : 'none'}/>
        <rect x="10" y="7" width="4" height="14" rx="1.5" fill={a ? '#D97706' : 'none'}/>
        <rect x="17" y="3" width="4" height="18" rx="1.5" fill={a ? '#D97706' : 'none'}/>
      </svg>
    ),
  },
  {
    href: '/nutrition', label: 'תזונה', color: '#059669',
    icon: (a: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3C8 3 5 6.5 5 10.5c0 3 1.5 5.5 3.5 7l-.5 2a1 1 0 001 1h6a1 1 0 001-1l-.5-2c2-1.5 3.5-4 3.5-7C19 6.5 16 3 12 3z"
          fill={a ? '#059669' : 'none'} stroke={a ? '#059669' : '#94A3B8'} strokeWidth={a ? 2 : 1.8}/>
        <line x1="12" y1="3" x2="12" y2="8" stroke={a ? '#059669' : '#94A3B8'} strokeWidth={a ? 2 : 1.8}/>
      </svg>
    ),
  },
  {
    href: '/training', label: 'אימון', color: '#7C3AED',
    icon: (a: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={a ? '#7C3AED' : '#94A3B8'} strokeWidth={a ? 2.5 : 1.8} strokeLinecap="round">
        <rect x="2" y="11" width="4" height="3" rx="1" fill={a ? '#7C3AED' : 'none'}/>
        <rect x="18" y="11" width="4" height="3" rx="1" fill={a ? '#7C3AED' : 'none'}/>
        <line x1="6" y1="12.5" x2="9" y2="12.5"/>
        <line x1="15" y1="12.5" x2="18" y2="12.5"/>
        <rect x="9" y="8" width="6" height="9" rx="2" fill={a ? '#7C3AED' : 'none'}/>
      </svg>
    ),
  },
  {
    href: '/', label: 'בית', color: '#1D4ED8',
    icon: (a: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill={a ? '#1D4ED8' : 'none'} stroke={a ? '#1D4ED8' : '#94A3B8'} strokeWidth={a ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11l9-8 9 8v10a1 1 0 01-1 1H4a1 1 0 01-1-1z"/>
        <path d="M9 21V12h6v9" fill={a ? 'white' : 'none'} stroke={a ? 'white' : '#94A3B8'} strokeWidth="1.5"/>
      </svg>
    ),
  },
]

export default function BottomNav() {
  const pathname = usePathname()
  return (
    <nav
      className="sticky bottom-0 z-50 bg-white"
      style={{
        borderTop: '1px solid #E8EEF6',
        paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
        boxShadow: '0 -2px 20px rgba(0,0,0,0.06)',
      }}
      aria-label="ניווט ראשי"
    >
      <div className="flex items-stretch">
        {ITEMS.map(({ href, label, color, icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link key={href} href={href}
              className="flex-1 flex flex-col items-center justify-center py-2 relative transition-all active:scale-95"
              aria-current={active ? 'page' : undefined}
            >
              {active && (
                <span className="absolute top-0 inset-x-4 h-[3px] rounded-b-full" style={{ background: color }}/>
              )}
              <span className="flex items-center justify-center h-7">
                {icon(active)}
              </span>
              <span className="mt-1 text-[10px] font-semibold" style={{ color: active ? color : '#94A3B8' }}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
