import { describe, it, expect } from 'vitest'
import { cn, formatKcal, formatKg } from '@/lib/utils'

describe('cn', () => {
  it('merges classes', () => expect(cn('a', 'b')).toBe('a b'))
  it('drops falsy', () => expect(cn('a', false && 'b', 'c')).toBe('a c'))
  it('deduplicates Tailwind', () => expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500'))
})

describe('formatKcal', () => {
  it('hebrew locale separator for 2050', () => expect(formatKcal(2050)).toBe('2,050'))
  it('hebrew locale negative format',    () => expect(formatKcal(-350)).toBe('‎-350'))
  // Edge cases added in Phase 3
  it('returns "0" for null',             () => expect(formatKcal(null)).toBe('0'))
  it('returns "0" for undefined',        () => expect(formatKcal(undefined)).toBe('0'))
  it('returns "0" for NaN',              () => expect(formatKcal(NaN)).toBe('0'))
  it('returns "0" for Infinity',         () => expect(formatKcal(Infinity)).toBe('0'))
  it('returns "0" for -Infinity',        () => expect(formatKcal(-Infinity)).toBe('0'))
  it('rounds 99.9 to 100',              () => expect(formatKcal(99.9)).toBe('100'))
  it('handles zero correctly',           () => expect(formatKcal(0)).toBe('0'))
})

describe('formatKg', () => {
  it('one decimal',                      () => expect(formatKg(79.2)).toBe('79.2'))
  it('rounds to one decimal place',      () => expect(formatKg(79.25)).toBe('79.3'))
  // Edge cases added in Phase 3
  it('returns "—" for null',             () => expect(formatKg(null)).toBe('—'))
  it('returns "—" for undefined',        () => expect(formatKg(undefined)).toBe('—'))
  it('returns "—" for NaN',             () => expect(formatKg(NaN)).toBe('—'))
  it('returns "—" for Infinity',        () => expect(formatKg(Infinity)).toBe('—'))
  it('handles zero correctly',           () => expect(formatKg(0)).toBe('0.0'))
  it('handles negative weight',          () => expect(formatKg(-1.5)).toBe('-1.5'))
})
