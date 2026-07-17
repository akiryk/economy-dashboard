import { describe, expect, it } from 'vitest'
import { alignRateObservations } from './rateComparisonData'

describe('alignRateObservations', () => {
  it('aligns exact months and calculates GS10 minus FEDFUNDS at full precision', () => {
    expect(alignRateObservations(
      [{ date: '2026-01-01', value: 3.625 }, { date: '2026-02-01', value: 3.5 }],
      [{ date: '2026-01-01', value: 4.471 }, { date: '2026-03-01', value: 4.4 }],
    )).toEqual([{ date: '2026-01-01', federalFundsRate: 3.625, treasuryYield: 4.471, difference: 0.8460000000000001 }])
  })

  it('does not pair missing or null months by array position', () => {
    expect(alignRateObservations(
      [{ date: '2026-01-01', value: 3.5 }, { date: '2026-02-01', value: null }],
      [{ date: '2026-02-01', value: 4.5 }, { date: '2026-03-01', value: 4.4 }],
    )).toEqual([])
  })
})
