import Link from 'next/link'
import {
  Utensils,
  MessageSquareText,
  Scale,
  Dumbbell,
  BarChart3,
  type LucideIcon,
} from 'lucide-react'

type Action = {
  label: string
  href: string
  Icon: LucideIcon
}

const ACTIONS: Action[] = [
  { label: 'הוסף ארוחה', href: '/nutrition', Icon: Utensils },
  { label: 'AI Coach', href: '/ai', Icon: MessageSquareText },
  { label: 'הוסף משקל', href: '/analytics', Icon: Scale },
  { label: 'אימון כוח', href: '/training', Icon: Dumbbell },
  { label: 'ניתוח', href: '/analytics', Icon: BarChart3 },
]

export function QuickActions() {
  return (
    <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-1">
      {ACTIONS.map(({ label, href, Icon }) => (
        <Link
          key={label}
          href={href}
          className="flex shrink-0 flex-col items-center gap-2"
        >
          <span className="flex h-[58px] w-[58px] items-center justify-center rounded-full bg-primary shadow-md shadow-primary/25 transition-transform active:scale-95">
            <Icon className="h-6 w-6 text-primary-foreground" strokeWidth={2.2} />
          </span>
          <span className="w-16 text-center text-xs font-semibold text-foreground">
            {label}
          </span>
        </Link>
      ))}
    </div>
  )
}
