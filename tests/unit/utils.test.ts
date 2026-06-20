import { describe, it, expect } from 'vitest'
import { cn, formatKcal, formatKg } from '@/lib/utils'

describe('cn', () => {
  it('merges classes', () => expect(cn('a', 'b')).toBe('a b'))
  it('drops falsy', () => expect(cn('a', false && 'b', 'c')).toBe('a c'))
  it('deduplicates Tailwind', () => expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500'))
})
describe('formatKcal', () => {
  it('hebrew locale separator for 2050', () => expect(formatKcal(2050)).toBe('2,050'))
  it('hebrew locale negative format', () => expect(formatKcal(-350)).toBe('‎-350'))
})
describe('formatKg', () => {
  it('one decimal', () => expect(formatKg(79.2)).toBe('79.2'))
})
