import { describe, expect, it } from 'vitest'
import type { EconomicObservation } from '../models/economicSeries'
import {
  classifyHistoricalBandPosition,
  deriveHistoricalBandContext,
  type HistoricalBandDefinition,
} from './historicalBandContext'

const definition: HistoricalBandDefinition = {
  recentObservationCount: 20,
  comparisonWindow: { kind: 'trailing-years', years: 25 },
  innerPercentiles: [25, 75], outerPercentiles: [10, 90],
  minimumFiniteObservations: 20,
  latestObservationPolicy: 'last-observation',
}

function quarters(
  values: readonly (number | null)[],
  startYear = 2000,
): EconomicObservation[] {
  return values.map((value, index) => ({
    date: new Date(Date.UTC(startYear, index * 3, 1)).toISOString().slice(0, 10),
    value,
  }))
}

describe('historical band context', () => {
  it('selects 20 recent quarters and the exact trailing 25-year boundary without mutation', () => {
    const observations = quarters(Array.from({ length: 106 }, (_, index) => index), 1999)
    const original = structuredClone(observations)
    const result = deriveHistoricalBandContext(observations, definition)
    expect(result.status).toBe('ready')
    if (result.status !== 'ready') return
    expect(result.recentObservations).toHaveLength(20)
    expect(result.comparisonStart).toBe('2000-04-01')
    expect(result.comparisonEnd).toBe('2025-04-01')
    expect(observations).toEqual(original)
  })

  it('interpolates percentiles for ties and negative values', () => {
    const result = deriveHistoricalBandContext(
      quarters([-10, -10, -5, -5, 0, 0, 5, 5, 10, 10, 15, 15, 20, 20, 25, 25, 30, 30, 35, 100]),
      definition,
    )
    expect(result.status).toBe('ready')
    if (result.status !== 'ready') return
    expect(result.outerLower).toBeCloseTo(-5.5)
    expect(result.innerLower).toBeCloseTo(0)
    expect(result.innerUpper).toBeCloseTo(25)
    expect(result.outerUpper).toBeCloseTo(30.5)
  })

  it('excludes nulls from percentiles but preserves recent gaps', () => {
    const values = Array.from({ length: 25 }, (_, index) => index as number | null)
    values[16] = null
    const result = deriveHistoricalBandContext(quarters(values), definition)
    expect(result.status).toBe('ready')
    if (result.status !== 'ready') return
    expect(result.validObservationCount).toBe(24)
    expect(result.recentObservations[11]).toMatchObject({ value: null })
  })

  it('returns explicit insufficient and unavailable-latest results', () => {
    expect(deriveHistoricalBandContext(quarters(Array.from({ length: 19 }, (_, index) => index)), definition))
      .toMatchObject({ status: 'insufficient-history', minimumRequired: 20 })
    expect(deriveHistoricalBandContext(quarters([...Array.from({ length: 20 }, (_, index) => index), null]), definition))
      .toMatchObject({ status: 'latest-unavailable', validObservationCount: 20 })
  })

  it('supports all-available comparison and latest-finite policies', () => {
    const result = deriveHistoricalBandContext(
      quarters([...Array.from({ length: 20 }, (_, index) => index), null]),
      {
        ...definition,
        comparisonWindow: { kind: 'all-available' },
        latestObservationPolicy: 'latest-finite',
      },
    )
    expect(result).toMatchObject({
      status: 'ready', comparisonStart: '2000-01-01',
      comparisonEnd: '2004-10-01', latestObservation: { value: 19 },
    })
  })

  it.each([
    [9, 'belowOuterBand'], [10, 'betweenOuterAndInnerLow'],
    [24, 'betweenOuterAndInnerLow'], [25, 'insideInnerBand'],
    [75, 'insideInnerBand'], [76, 'betweenInnerAndOuterHigh'],
    [90, 'betweenInnerAndOuterHigh'], [91, 'aboveOuterBand'],
    [null, 'unavailable'],
  ] as const)('classifies %s neutrally as %s', (value, expected) => {
    expect(classifyHistoricalBandPosition(value, {
      outerLower: 10, innerLower: 25, innerUpper: 75, outerUpper: 90,
    })).toBe(expected)
  })
})
