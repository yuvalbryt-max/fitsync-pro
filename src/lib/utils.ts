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
