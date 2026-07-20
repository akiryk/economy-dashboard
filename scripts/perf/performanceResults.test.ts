import { describe, expect, it } from 'vitest'
import { compareSummaries, summarize } from './performanceResults.ts'

describe('performance result summaries', () => {
  it('reports median, range, and half-range noise floor', () => {
    const result = summarize([120, 100, 140, 110, 130])
    expect(result).toMatchObject({
      median: 120,
      min: 100,
      max: 140,
      noiseFloor: 20,
    })
    expect(result.noiseFloorPercent).toBeCloseTo(100 / 6)
  })

  it('keeps unavailable metrics explicitly null', () => {
    expect(summarize([null, null])).toEqual({
      median: null,
      min: null,
      max: null,
      noiseFloor: null,
      noiseFloorPercent: null,
    })
  })

  it('flags only changes larger than the baseline noise floor', () => {
    const baseline = { lcp: summarize([900, 1000, 1100]) }
    const inside = { lcp: summarize([950, 1050, 1150]) }
    const outside = { lcp: summarize([1200, 1300, 1400]) }

    expect(compareSummaries(baseline, inside)[0].significant).toBe(false)
    expect(compareSummaries(baseline, outside)[0].significant).toBe(true)
  })
})
