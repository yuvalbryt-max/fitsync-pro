import { describe, it, expect, expectTypeOf } from 'vitest'
import type { DailySummary, HealthMetric, Workout, Exercise } from '@/lib/types'
import { getTimeOfDayBucket } from '@/lib/types'

describe('DailySummary', () => {
  it('has date string and net_balance number', () => {
    expectTypeOf(({} as DailySummary).date).toBeString()
    expectTypeOf(({} as DailySummary).net_balance).toBeNumber()
  })
})

describe('HealthMetric', () => {
  it('has numeric value', () => {
    expectTypeOf(({} as HealthMetric).value).toBeNumber()
  })
})

describe('Workout', () => {
  it('has Exercise array', () => {
    expectTypeOf(({} as Workout).exercises).toEqualTypeOf<Exercise[]>()
  })
})

describe('getTimeOfDayBucket', () => {
  it('returns morning for 07:00', () => {
    const d = new Date()
    d.setHours(7, 0, 0, 0)
    expect(getTimeOfDayBucket(d.toISOString())).toBe('morning')
  })

  it('returns evening for 20:00', () => {
    const d = new Date()
    d.setHours(20, 0, 0, 0)
    expect(getTimeOfDayBucket(d.toISOString())).toBe('evening')
  })
  it('returns morning at exact boundary h=5', () => {
    const d = new Date(); d.setHours(5, 0, 0, 0)
    expect(getTimeOfDayBucket(d.toISOString())).toBe('morning')
  })
  it('returns midday at exact boundary h=10', () => {
    const d = new Date(); d.setHours(10, 0, 0, 0)
    expect(getTimeOfDayBucket(d.toISOString())).toBe('midday')
  })
  it('returns evening at exact boundary h=16', () => {
    const d = new Date(); d.setHours(16, 0, 0, 0)
    expect(getTimeOfDayBucket(d.toISOString())).toBe('evening')
  })
  it('returns evening before morning boundary h=4', () => {
    const d = new Date(); d.setHours(4, 0, 0, 0)
    expect(getTimeOfDayBucket(d.toISOString())).toBe('evening')
  })
})
