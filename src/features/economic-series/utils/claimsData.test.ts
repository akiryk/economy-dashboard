import { describe, expect, it } from 'vitest'
import {
  alignClaimsObservations,
  claimsSeries,
  formatClaims,
  medianClaims,
} from './claimsData'

describe('claimsData', () => {
  it('aligns the official series by exact date without filling weekly gaps', () => {
    const aligned = alignClaimsObservations(
      [
        { date: '2026-01-10', value: 220_000 },
        { date: '2026-01-03', value: 225_000 },
      ],
      [{ date: '2026-01-10', value: 215_000 }],
    )

    expect(aligned).toEqual([
      { date: '2026-01-03', movingAverage: 225_000, weeklyClaims: null },
      { date: '2026-01-10', movingAverage: 220_000, weeklyClaims: 215_000 },
    ])
    expect(claimsSeries(aligned, 'weeklyClaims')).toEqual([
      { date: '2026-01-03', value: null },
      { date: '2026-01-10', value: 215_000 },
    ])
  })

  it('formats whole claims and calculates odd and even medians', () => {
    expect(formatClaims(214_250)).toBe('214,250')
    expect(formatClaims(null)).toBe('Not available')
    expect(medianClaims([null, 30, 10, 20])).toBe(20)
    expect(medianClaims([40, 10, 30, 20])).toBe(25)
    expect(medianClaims([null])).toBeNull()
  })
})
