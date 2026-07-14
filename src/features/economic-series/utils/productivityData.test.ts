import { describe, expect, it } from 'vitest'
import {
  calculateProductivityMomentum,
  cumulativeProductivityChange,
  normalizeProductivityRange,
} from './productivityData'

describe('productivity presentation data', () => {
  it('normalizes from the first valid selected-range value and preserves gaps', () => {
    const input = [
      { date: '2020-01-01', value: null },
      { date: '2020-04-01', value: 50 },
      { date: '2020-07-01', value: null },
      { date: '2020-10-01', value: 60 },
    ]
    const original = structuredClone(input)
    expect(normalizeProductivityRange(input)).toEqual([
      { date: '2020-01-01', value: null, changeFromBaseline: null },
      { date: '2020-04-01', value: 100, changeFromBaseline: 0 },
      { date: '2020-07-01', value: null, changeFromBaseline: null },
      { date: '2020-10-01', value: 120, changeFromBaseline: 20 },
    ])
    expect(cumulativeProductivityChange(input)).toBe(20)
    expect(input).toEqual(original)
  })

  it('returns unavailable normalized output for a missing or zero baseline', () => {
    expect(normalizeProductivityRange([{ date: '2020-01-01', value: 0 }])[0]?.value).toBeNull()
    expect(cumulativeProductivityChange([{ date: '2020-01-01', value: null }])).toBeNull()
  })

  it('calculates positive, negative, zero, and missing-latest cumulative changes', () => {
    expect(cumulativeProductivityChange([
      { date: '2020-01-01', value: 100 },
      { date: '2020-04-01', value: 90 },
    ])).toBe(-10)
    expect(cumulativeProductivityChange([
      { date: '2020-01-01', value: 100 },
      { date: '2020-04-01', value: 100 },
    ])).toBe(0)
    expect(cumulativeProductivityChange([
      { date: '2020-01-01', value: 100 },
      { date: '2020-04-01', value: null },
    ])).toBeNull()
  })

  it('compares momentum with the exact quarter one year earlier', () => {
    const input = [
      { date: '2020-01-01', value: 1 },
      { date: '2020-04-01', value: 9 },
      { date: '2021-01-01', value: 2.5 },
      { date: '2021-07-01', value: 4 },
    ]
    expect(calculateProductivityMomentum(input).map((item) => item.momentumChange)).toEqual([
      null, null, 1.5, null,
    ])
  })

  it('preserves acceleration, slowing, and unchanged momentum', () => {
    const result = calculateProductivityMomentum([
      { date: '2020-01-01', value: 2 },
      { date: '2020-04-01', value: 2 },
      { date: '2020-07-01', value: 2 },
      { date: '2021-01-01', value: 3 },
      { date: '2021-04-01', value: 1 },
      { date: '2021-07-01', value: 2 },
    ])
    expect(result.slice(-3).map((item) => item.momentumChange)).toEqual([1, -1, 0])
  })
})
