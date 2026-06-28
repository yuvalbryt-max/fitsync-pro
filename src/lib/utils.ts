import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatKcal(kcal: number | null | undefined): string {
  if (kcal == null || isNaN(kcal) || !isFinite(kcal)) return '0'
  return Math.round(kcal).toLocaleString('he-IL')
}

export function formatKg(kg: number | null | undefined): string {
  if (kg == null || isNaN(kg) || !isFinite(kg)) return '—'
  return kg.toFixed(1)
}

/** Returns today's date as YYYY-MM-DD in UTC */
export function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Returns the date N days ago as YYYY-MM-DD in UTC */
export function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86400000).toISOString().slice(0, 10)
}

/** ISO date string for start-of-day (00:00:00) */
export function startOfDay(dateStr: string): string {
  return `${dateStr}T00:00:00`
}

/** Returns the start of the NEXT day — use as exclusive upper bound in date queries */
export function nextDayStr(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

