import { describe, expect, it } from 'vitest'
import gdpData from '../data/real-gdp-growth.json'
import type { EconomicObservation } from '../models/economicSeries'
import { validateEconomicSeries } from '../models/validateEconomicSeries'
import {
  classifyGdpHistoricalPosition,
  deriveCompactGdpHistoricalContext,
  GDP_MINIMUM_COMPARISON_OBSERVATIONS,
  type GdpHistoricalThresholds,
} from './gdpCompactHistoricalContext'

function quarters(values: readonly (number | null)[], startYear = 2020): EconomicObservation[] {
  return values.map((value, index) => ({
    date: new Date(Date.UTC(startYear, index * 3, 1)).toISOString().slice(0, 10),
    value,
  }))
}

describe('compact GDP historical context', () => {
  it('includes the exact trailing 25-year boundary and excludes the prior quarter', () => {
    const observations = quarters(Array.from({ length: 106 }, (_, index) => index), 1999)
    const result = deriveCompactGdpHistoricalContext(observations)
    expect(result.status).toBe('ready')
    if (result.status !== 'ready') return
    expect(result.comparisonStart).toBe('2000-04-01')
    expect(result.comparisonEnd).toBe('2025-04-01')
    expect(result.validObservationCount).toBe(101)
    expect(observations.find(({ date }) => date === '2000-01-01')).toBeDefined()
  })

  it('uses linearly interpolated zero-based quantiles for odd, tied, and outlier values', () => {
    const values = [0, 0, 0, 0, 0, 10, 10, 10, 10, 10, 20, 20, 20, 20, 20, 30, 30, 30, 30, 30, 1000]
    const result = deriveCompactGdpHistoricalContext(quarters(values))
    expect(result.status).toBe('ready')
    if (result.status !== 'ready') return
    expect(result).toMatchObject({ outerLower: 0, innerLower: 10, median: 20, innerUpper: 30, outerUpper: 30 })
  })

  it('interpolates even samples without rounding and retains negative values', () => {
    const result = deriveCompactGdpHistoricalContext(quarters(Array.from({ length: 20 }, (_, index) => index - 10)))
    expect(result.status).toBe('ready')
    if (result.status !== 'ready') return
    expect(result.outerLower).toBeCloseTo(-8.1)
    expect(result.innerLower).toBeCloseTo(-5.25)
    expect(result.median).toBeCloseTo(-0.5)
    expect(result.innerUpper).toBeCloseTo(4.25)
    expect(result.outerUpper).toBeCloseTo(7.1)
  })

  it('excludes nulls from percentiles while preserving internal recent gaps', () => {
    const values = Array.from({ length: 25 }, (_, index) => index as number | null)
    values[16] = null
    const result = deriveCompactGdpHistoricalContext(quarters(values))
    expect(result.status).toBe('ready')
    if (result.status !== 'ready') return
    expect(result.validObservationCount).toBe(24)
    expect(result.recentObservations).toHaveLength(20)
    expect(result.recentObservations[11]).toMatchObject({ value: null })
    expect(result.recentObservations.map(({ date }) => date)).toEqual([...result.recentObservations].map(({ date }) => date).sort())
    expect(result.latestObservation).toEqual(result.recentObservations.at(-1))
  })

  it('returns every available recent observation when fewer than 20 exist', () => {
    const result = deriveCompactGdpHistoricalContext(quarters([1, 2, 3, 4, 5]))
    expect(result.status).toBe('insufficient-history')
    expect(result.recentObservations).toHaveLength(5)
    expect(result.recentObservationCount).toBe(5)
  })

  it.each([
    [9, 'belowOuterBand'], [10, 'betweenOuterAndInnerLow'], [20, 'betweenOuterAndInnerLow'],
    [25, 'insideInnerBand'], [50, 'insideInnerBand'], [75, 'insideInnerBand'],
    [80, 'betweenInnerAndOuterHigh'], [90, 'betweenInnerAndOuterHigh'], [91, 'aboveOuterBand'],
    [null, 'unavailable'],
  ] as const)('classifies %s with documented boundary semantics', (value, expected) => {
    const thresholds: GdpHistoricalThresholds = { outerLower: 10, innerLower: 25, median: 50, innerUpper: 75, outerUpper: 90 }
    expect(classifyGdpHistoricalPosition(value, thresholds)).toBe(expected)
  })

  it('returns explicit empty, insufficient-history, all-null, and unavailable-latest states', () => {
    expect(deriveCompactGdpHistoricalContext([])).toMatchObject({ status: 'empty', validObservationCount: 0 })
    expect(deriveCompactGdpHistoricalContext(quarters(Array.from({ length: GDP_MINIMUM_COMPARISON_OBSERVATIONS - 1 }, (_, index) => index))))
      .toMatchObject({ status: 'insufficient-history', validObservationCount: 19, minimumRequired: 20 })
    expect(deriveCompactGdpHistoricalContext(quarters(Array.from({ length: 25 }, () => null))))
      .toMatchObject({ status: 'insufficient-history', validObservationCount: 0 })
    expect(deriveCompactGdpHistoricalContext(quarters([...Array.from({ length: 20 }, (_, index) => index), null])))
      .toMatchObject({ status: 'latest-unavailable', latestPosition: 'unavailable', validObservationCount: 20 })
  })

  it('derives the reviewed current context from the committed GDP series', () => {
    const series = validateEconomicSeries(gdpData)
    const result = deriveCompactGdpHistoricalContext(series.observations)
    expect(result.status).toBe('ready')
    if (result.status !== 'ready') return
    expect(result.latestObservation).toEqual({ date: '2026-01-01', value: 2.68474 })
    expect(result.recentObservations).toHaveLength(20)
    expect(result.comparisonStart).toBe('2001-01-01')
    expect(result.comparisonEnd).toBe('2026-01-01')
    expect(result.validObservationCount).toBe(101)
    expect(result).toMatchObject({
      outerLower: 0.48924,
      innerLower: 1.67926,
      median: 2.32528,
      innerUpper: 3.00914,
      outerUpper: 3.49486,
      latestPosition: 'insideInnerBand',
    })
  })
})
