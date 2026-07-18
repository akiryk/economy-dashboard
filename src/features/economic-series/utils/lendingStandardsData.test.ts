import { describe, expect, it } from 'vitest'
import {
  describeLendingStandardsChange,
  formatLendingStandardsCallout,
  lendingStandardsCounts,
  medianLendingStandards,
} from './lendingStandardsData'

describe('lendingStandardsData', () => {
  it.each([
    [14.5, '14.5% net tightening'],
    [0, 'No net tightening or easing'],
    [-8.2, '8.2% net easing'],
    [null, 'Not available'],
  ])('formats %s without mislabeling its sign', (value, expected) => {
    expect(formatLendingStandardsCallout(value)).toBe(expected)
  })

  it.each([
    [10, 25, 'more tightening'],
    [25, 10, 'less tightening'],
    [10, -5, 'net tightening to net easing'],
    [-10, -5, 'less easing'],
    [-5, -10, 'more easing'],
  ])('describes a move from %s to %s precisely', (previous, latest, phrase) => {
    expect(describeLendingStandardsChange(previous, latest)).toContain(phrase)
  })

  it('counts signs and calculates the visible median without filling nulls', () => {
    const observations = [
      { date: '2025-01-01', value: -10 },
      { date: '2025-04-01', value: 0 },
      { date: '2025-07-01', value: 10 },
      { date: '2025-10-01', value: null },
      { date: '2026-01-01', value: 20 },
    ]
    expect(lendingStandardsCounts(observations)).toEqual({ above: 2, below: 1, zero: 1 })
    expect(medianLendingStandards(observations)).toBe(5)
  })
})
