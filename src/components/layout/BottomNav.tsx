'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Heart, Shield, BarChart2, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href:'/',          label:'בית',     Icon:Home          },
  { href:'/training',  label:'אימון',   Icon:Heart         },
  { href:'/nutrition', label:'תזונה',   Icon:Shield        },
  { href:'/analytics', label:'ניתוח',   Icon:BarChart2     },
  { href:'/ai',        label:'AI Chat', Icon:MessageCircle },
] as const

export default function BottomNav() {
  const pathname = usePathname()
  return (
    <nav
      className="sticky bottom-0 bg-gradient-to-t from-[#080c14] via-[#080c14]/95 to-transparent pt-3"
      style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}
      aria-label="ניווט ראשי"
    >
      <div className="flex justify-around items-center">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = pathname===href || (href!=='/'&&pathname.startsWith(href))
          return (
            <Link key={href} href={href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-xl',
                'transition-all duration-150 active:scale-90',
                active ? 'text-[#3b82f6]' : 'text-[#3d4f65]'
              )}
              aria-current={active ? 'page' : undefined}>
              <Icon size={22} strokeWidth={active ? 2.5 : 2} aria-hidden="true"/>
              <span className="text-[9px] font-semibold">{label}</span>
              {active && <div className="w-1 h-1 rounded-full bg-[#3b82f6]"/>}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
