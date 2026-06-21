'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

type IconProps = { active: boolean }

function HomeIcon({ active }: IconProps) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3.5 10.4 12 3.8l8.5 6.6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.2 9.2v9.1c0 .77.62 1.4 1.4 1.4h3v-4.6c0-.83.67-1.5 1.5-1.5h1.8c.83 0 1.5.67 1.5 1.5v4.6h3c.78 0 1.4-.63 1.4-1.4V9.2"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DumbbellIcon({ active }: IconProps) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 9v6M15 9v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <rect x="3.4" y="7.6" width="3.2" height="8.8" rx="1.2" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" />
      <rect x="17.4" y="7.6" width="3.2" height="8.8" rx="1.2" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

function NutritionIcon({ active }: IconProps) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3.2 5 5.6v5.3c0 4.3 2.9 7.6 7 9 4.1-1.4 7-4.7 7-9V5.6L12 3.2Z"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M9 11.8c1.2 1.2 4.2 1.4 6-1.2-2 .2-2.8-.8-3.6-1.8"
        stroke={active ? 'var(--card)' : 'currentColor'}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

function BarChartIcon({ active }: IconProps) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="12" width="3.6" height="8" rx="1.2" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" />
      <rect x="10.2" y="7" width="3.6" height="13" rx="1.2" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" />
      <rect x="16.4" y="9.5" width="3.6" height="10.5" rx="1.2" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

function ChatIcon({ active }: IconProps) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 6.5C4 5.4 4.9 4.5 6 4.5h12c1.1 0 2 .9 2 2v7c0 1.1-.9 2-2 2H9l-4 3.5v-3.5H6c-1.1 0-2-.9-2-2v-7Z"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="10" r="1.1" fill={active ? 'var(--card)' : 'currentColor'} />
      <circle cx="12" cy="10" r="1.1" fill={active ? 'var(--card)' : 'currentColor'} />
      <circle cx="15" cy="10" r="1.1" fill={active ? 'var(--card)' : 'currentColor'} />
    </svg>
  )
}

const NAV = [
  { href: '/', label: 'בית', Icon: HomeIcon },
  { href: '/training', label: 'אימון', Icon: DumbbellIcon },
  { href: '/nutrition', label: 'תזונה', Icon: NutritionIcon },
  { href: '/analytics', label: 'ניתוח', Icon: BarChartIcon },
  { href: '/ai', label: 'AI', Icon: ChatIcon },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="ניווט ראשי"
      className="sticky bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur-md"
    >
      <ul className="flex items-stretch justify-around px-1 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1">
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname === href
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className="relative flex flex-col items-center gap-1 rounded-xl py-2 transition-colors"
              >
                <span
                  className={cn(
                    'absolute top-0 h-1 w-8 rounded-full transition-all',
                    active ? 'bg-primary' : 'bg-transparent',
                  )}
                />
                <span className={cn(active ? 'text-primary' : 'text-muted-foreground')}>
                  <Icon active={active} />
                </span>
                <span
                  className={cn(
                    'text-[11px] font-semibold leading-none',
                    active ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  {label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
