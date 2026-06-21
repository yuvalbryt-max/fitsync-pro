import { describe, it, expect } from 'vitest'
import { cn, formatKcal, formatKg, todayStr, daysAgo, nextDayStr } from '@/lib/utils'

describe('cn', () => {
  it('merges classes', () => expect(cn('a', 'b')).toBe('a b'))
  it('drops falsy', () => expect(cn('a', false && 'b', 'c')).toBe('a c'))
  it('deduplicates Tailwind', () => expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500'))
})

describe('formatKcal', () => {
  it('hebrew locale separator for 2050', () => expect(formatKcal(2050)).toBe('2,050'))
  it('hebrew locale negative format', () => expect(formatKcal(-350)).toContain('350'))
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
  it('returns "ג€”" for null',             () => expect(formatKg(null)).toBe('ג€”'))
  it('returns "ג€”" for undefined',        () => expect(formatKg(undefined)).toBe('ג€”'))
  it('returns "ג€”" for NaN',             () => expect(formatKg(NaN)).toBe('ג€”'))
  it('returns "ג€”" for Infinity',        () => expect(formatKg(Infinity)).toBe('ג€”'))
  it('handles zero correctly',           () => expect(formatKg(0)).toBe('0.0'))
  it('handles negative weight',          () => expect(formatKg(-1.5)).toBe('-1.5'))
})


describe('todayStr', () => {
  it('returns a string in YYYY-MM-DD format', () => {
    expect(todayStr()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
  it('matches new Date().toISOString().slice(0,10)', () => {
    expect(todayStr()).toBe(new Date().toISOString().slice(0, 10))
  })
})

describe('daysAgo', () => {
  it('daysAgo(0) returns today', () => {
    expect(daysAgo(0)).toBe(new Date().toISOString().slice(0, 10))
  })
  it('daysAgo(1) returns yesterday', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    expect(daysAgo(1)).toBe(yesterday)
  })
  it('daysAgo(7) returns 7 days ago', () => {
    const expected = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
    expect(daysAgo(7)).toBe(expected)
  })
  it('returns YYYY-MM-DD format', () => {
    expect(daysAgo(30)).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('nextDayStr', () => {
  it('returns the next calendar day', () => {
    expect(nextDayStr('2024-01-01')).toBe('2024-01-02')
  })
  it('handles month boundary', () => {
    expect(nextDayStr('2024-01-31')).toBe('2024-02-01')
  })
  it('handles year boundary', () => {
    expect(nextDayStr('2024-12-31')).toBe('2025-01-01')
  })
  it('handles leap year', () => {
    expect(nextDayStr('2024-02-28')).toBe('2024-02-29')
  })
  it('returns YYYY-MM-DD format', () => {
    expect(nextDayStr('2024-06-15')).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

