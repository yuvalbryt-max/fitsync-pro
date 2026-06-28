'use client'
import { useId } from 'react'
import { cn } from '@/lib/utils'

interface Props { score: number; label?: string; className?: string }

export default function ReadinessRing({ score, label = 'READINESS', className }: Props) {
  const uid = useId().replace(/:/g, '')
  const gradId = `rg-${uid}`
  const R = 40
  const C = 2 * Math.PI * R
  const noData = score === 0
  const offset = C - (score / 100) * C

  return (
    <div className={cn('relative w-24 h-24 flex-shrink-0', className)}>
      <svg width="96" height="96" viewBox="0 0 96 96" style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
        <circle cx="48" cy="48" r={R} fill="none" stroke="var(--border)" strokeWidth="8"/>
        {!noData && (
          <circle cx="48" cy="48" r={R} fill="none" stroke={`url(#${gradId})`} strokeWidth="8"
            strokeLinecap="round" strokeDasharray={C} strokeDashoffset={offset}/>
        )}
        {noData && (
          <circle cx="48" cy="48" r={R} fill="none" stroke="var(--muted-foreground)" strokeWidth="8"
            strokeOpacity="0.3" strokeLinecap="round" strokeDasharray="4 8"/>
        )}
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--primary)"/>
            <stop offset="100%" stopColor="var(--purple)"/>
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {noData ? (
          <>
            <span className="text-[20px] font-bold text-muted-foreground/40">--</span>
            <span className="text-[8px] text-muted-foreground/60 font-medium mt-0.5">NO DATA</span>
          </>
        ) : (
          <>
            <span className="text-[26px] font-extrabold leading-none tabular text-foreground">{score}</span>
            <span className="text-[9px] text-muted-foreground font-medium mt-0.5">{label}</span>
          </>
        )}
      </div>
    </div>
  )
}
