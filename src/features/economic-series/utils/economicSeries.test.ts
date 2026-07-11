import { describe, expect, it } from 'vitest'
import { formatObservationPeriod } from './economicSeries'

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
