import { describe, expect, it } from 'vitest'
import {
  formatJobChangeProse,
  formatObservationPeriod,
  formatPercentage,
  formatSignedThousands,
  formatSignedPercentage,
} from './economicSeries'

describe('formatObservationPeriod', () => {
  it('formats monthly observations with a full UTC month', () => {
    expect(formatObservationPeriod('2026-06-01', 'monthly')).toBe('June 2026')
  })

  it('continues to format quarterly observations', () => {
    expect(formatObservationPeriod('2026-01-01', 'quarterly')).toBe('2026 Q1')
  })

  it('does not shift periods across local timezone boundaries', () => {
    expect(formatObservationPeriod('2026-12-01', 'monthly')).toBe(
      'December 2026',
    )
  })

  it('rejects invalid dates', () => {
    expect(() => formatObservationPeriod('2026-02-30', 'monthly')).toThrow(
      RangeError,
    )
  })
})

describe('payroll value formatting', () => {
  it.each([
    [125, '+125K'],
    [-42, '−42K'],
    [0, '0'],
    [145.333, '+145K'],
    [null, 'Not available'],
  ] as const)('formats %s thousand jobs as %s', (value, expected) => {
    expect(formatSignedThousands(value)).toBe(expected)
  })

  it('uses readable job-count prose for summaries', () => {
    expect(formatJobChangeProse(145.333)).toBe('a gain of 145,333 jobs')
    expect(formatJobChangeProse(-2_900)).toBe('a loss of 2.9 million jobs')
    expect(formatJobChangeProse(0)).toBe('no net change in jobs')
  })

  it('leaves percentage formatting unchanged', () => {
    expect(formatPercentage(4.166)).toBe('4.2%')
    expect(formatPercentage(null)).toBe('Not available')
  })

  it.each([
    [1.24, '+1.2%'],
    [-0.584, '−0.6%'],
    [0, '0.0%'],
    [null, 'Not available'],
  ] as const)('formats signed percentages', (value, expected) => {
    expect(formatSignedPercentage(value)).toBe(expected)
  })
})
