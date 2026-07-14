import { describe, expect, it } from 'vitest'
import { savingRateChanges } from './savingRateData'

describe('savingRateChanges', () => {
  it('uses the exact year-earlier month and preserves unavailable values and inputs', () => {
    const observations = [
      { date: '2024-01-01', value: 5 },
      { date: '2025-01-01', value: 4 },
      { date: '2025-02-01', value: 6 },
      { date: '2026-01-01', value: null },
    ]
    const original = structuredClone(observations)
    expect(savingRateChanges(observations).map((item) => item.change)).toEqual([
      null, -1, null, null,
    ])
    expect(observations).toEqual(original)
  })
})
