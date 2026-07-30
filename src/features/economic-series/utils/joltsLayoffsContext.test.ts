import { describe, expect, it } from 'vitest'
import type { EconomicObservation } from '../models/economicSeries'
import {
  classifyJoltsLevel,
  deriveJoltsDirection,
  deriveJoltsHistoricalContext,
  joltsLevelStatement,
} from './joltsLayoffsContext'

function months(values: Array<number | null>): EconomicObservation[] {
  return values.map((value, index) => ({
    date: `2026-${String(index + 1).padStart(2, '0')}-01`,
    value,
  }))
}

describe('JOLTS layoffs context', () => {
  it('compares two complete consecutive three-month averages', () => {
    const result = deriveJoltsDirection(months([1, 1, 1, 1.1, 1.1, 1.1]))
    expect(result.precedingAverage).toBe(1)
    expect(result.latestAverage).toBeCloseTo(1.1)
    expect(result.difference).toBeCloseTo(0.1)
    expect(result.state).toBe('rising')
  })

  it('uses both exact threshold boundaries and compares unrounded values', () => {
    expect(deriveJoltsDirection(months([1, 1, 1, 1.1, 1.1, 1.1])).state)
      .toBe('rising')
    expect(deriveJoltsDirection(months([1.1, 1.1, 1.1, 1, 1, 1])).state)
      .toBe('falling')
    expect(deriveJoltsDirection(months([1, 1, 1, 1.099, 1.099, 1.099])).state)
      .toBe('broadly-stable')
  })

  it('requires six consecutive valid months', () => {
    expect(deriveJoltsDirection(months([1, 1, null, 1.2, 1.2, 1.2])).state)
      .toBe('unavailable')
    const missingMonth = months([1, 1, 1, 1.2, 1.2, 1.2])
    missingMonth[3] = { date: '2026-05-01', value: 1.2 }
    expect(deriveJoltsDirection(missingMonth).state).toBe('unavailable')
  })

  it('uses a five-year line and valid observations in the trailing 25 years', () => {
    const observations = Array.from({ length: 306 }, (_, index) => ({
      date: `${2000 + Math.floor(index / 12)}-${String(index % 12 + 1).padStart(2, '0')}-01`,
      value: index === 20 ? null : 0.5 + index / 100,
    }))
    const model = deriveJoltsHistoricalContext(observations)
    expect(model.status).toBe('ready')
    if (model.status !== 'ready') return
    expect(model.recentObservations).toHaveLength(61)
    expect(model.validObservationCount).toBe(300)
    expect(model.comparisonStart).toBe('2000-06-01')
  })

  it('maps all five lower-is-better historical positions independently', () => {
    const model = {
      status: 'ready' as const,
      recentObservations: [],
      comparisonStart: '2001-01-01',
      comparisonEnd: '2026-01-01',
      outerLower: 1,
      innerLower: 2,
      median: 3,
      innerUpper: 4,
      outerUpper: 5,
      latestObservation: { date: '2026-01-01', value: 0.9 },
      validObservationCount: 300,
      recentObservationCount: 61,
    }
    expect(classifyJoltsLevel(model)).toBe('belowOuterBand')
    expect(joltsLevelStatement('belowOuterBand')).toContain('very low')
    expect(joltsLevelStatement('betweenOuterAndInnerLow')).toContain('low')
    expect(joltsLevelStatement('insideInnerBand')).toContain('typical')
    expect(joltsLevelStatement('betweenInnerAndOuterHigh')).toContain('high')
    expect(joltsLevelStatement('aboveOuterBand')).toContain('very high')
  })
})
