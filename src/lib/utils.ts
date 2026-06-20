import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatKcal(kcal: number): string {
  return kcal.toLocaleString('en-US')
}

export function formatKg(kg: number): string {
  return kg.toFixed(1)
}
