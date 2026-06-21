'use client'
import { useId } from 'react'
import { cn } from '@/lib/utils'

interface ReadinessRingProps {
  score:    number
  label?:   string
  className?: string
}

export default function ReadinessRing({ score, label = 'READINESS', className }: ReadinessRingProps) {
  const uid = useId().replace(/:/g, '')
  const gradId = `rg-${uid}`

  const R = 40
  const circumference = 2 * Math.PI * R
  // Show at least 2% arc even at score 0 so ring is visible
  const displayScore = Math.max(score, 0)
  const offset = circumference - (displayScore / 100) * circumference

  const noData = score === 0

  return (
    <div className={cn('relative w-24 h-24 flex-shrink-0', className)}>
      <svg width="96" height="96" viewBox="0 0 96 96" style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
        <circle cx="48" cy="48" r={R} fill="none" stroke="#1c2535" strokeWidth="8"/>
        {!noData && (
          <circle
            cx="48" cy="48" r={R}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        )}
        {noData && (
          <circle
            cx="48" cy="48" r={R}
            fill="none"
            stroke="#1c2535"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="4 8"
          />
        )}
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6"/>
            <stop offset="100%" stopColor="#8b5cf6"/>
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {noData ? (
          <>
            <span className="text-[18px] font-bold text-[#3d4f65]">--</span>
            <span className="text-[8px] text-[#3d4f65] font-medium mt-0.5">NO DATA</span>
          </>
        ) : (
          <>
            <span className="text-[26px] font-extrabold leading-none tabular text-[#e8edf5]">{displayScore}</span>
            <span className="text-[9px] text-[#8896aa] font-medium mt-0.5">{label}</span>
          </>
        )}
      </div>
    </div>
  )
}
