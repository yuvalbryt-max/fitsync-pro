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
        <circle cx="48" cy="48" r={R} fill="none" stroke="#E2E8F0" strokeWidth="8"/>
        {!noData && (
          <circle cx="48" cy="48" r={R} fill="none" stroke={`url(#${gradId})`} strokeWidth="8"
            strokeLinecap="round" strokeDasharray={C} strokeDashoffset={offset}/>
        )}
        {noData && (
          <circle cx="48" cy="48" r={R} fill="none" stroke="#CBD5E1" strokeWidth="8"
            strokeLinecap="round" strokeDasharray="4 8"/>
        )}
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1D4ED8"/>
            <stop offset="100%" stopColor="#7C3AED"/>
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {noData ? (
          <>
            <span className="text-[20px] font-bold text-[#CBD5E1]">--</span>
            <span className="text-[8px] text-[#94A3B8] font-medium mt-0.5">NO DATA</span>
          </>
        ) : (
          <>
            <span className="text-[26px] font-extrabold leading-none tabular text-[#0F1729]">{score}</span>
            <span className="text-[9px] text-[#64748B] font-medium mt-0.5">{label}</span>
          </>
        )}
      </div>
    </div>
  )
}
