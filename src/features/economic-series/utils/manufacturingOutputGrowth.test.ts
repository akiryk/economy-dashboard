import { describe, expect, it } from 'vitest'
import type { EconomicObservation } from '../models/economicSeries'
import manufacturingOutputData from '../data/manufacturing-output.json'
import { validateEconomicSeries } from '../models/validateEconomicSeries'
import { deriveHistoricalBandContext } from './historicalBandContext'
import { manufacturingOutputCompactDefinition } from './compactHistoricalMetrics'
import {
  classifyManufacturingDirection,
  createManufacturingAccessibleSummary,
  deriveManufacturingOutputGrowth,
  formatManufacturingDirection,
  formatManufacturingHistoricalPosition,
} from './manufacturingOutputGrowth'

const months = (values: readonly (number | null)[]): EconomicObservation[] =>
  values.map((value, index) => ({
    date: new Date(Date.UTC(2024, index, 1)).toISOString().slice(0, 10),
    value,
  }))

describe('manufacturing output growth', () => {
  it('requires three constituent months and an exact average 12 months earlier', () => {
    const data = deriveManufacturingOutputGrowth(months([
      100, 101, 102, 103, 104, 105, null, 107, 108, 109, 110, 111,
      112, 113, 114, 115,
    ]))
    expect(data.averages[2]?.value).toBe(101)
    expect(data.averages[8]?.value).toBeNull()
    expect(data.growth[13]?.value).toBeNull()
    expect(data.growth[14]?.value).toBeCloseTo((113 / 101 - 1) * 100)
  })

  it.each([
    [0.200001, 'more'], [0.2, 'flat'], [0, 'flat'], [-0.2, 'flat'], [-0.200001, 'less'],
  ] as const)('classifies the exact neutral boundary %s as %s', (value, expected) => {
    expect(classifyManufacturingDirection(value)).toBe(expected)
  })

  it('uses plain positive, negative, and flat answer wording', () => {
    expect(formatManufacturingDirection(1)).toMatch(/^Yes —/)
    expect(formatManufacturingDirection(-1)).toMatch(/^No —/)
    expect(formatManufacturingDirection(0)).toMatch(/^About flat —/)
  })

  it.each([
    [9, 'very weak'], [10, 'weak'], [25, 'typical'], [76, 'strong'], [91, 'very strong'],
  ] as const)('formats historical state for %s as %s', (value, expected) => {
    expect(formatManufacturingHistoricalPosition(value, {
      status: 'ready', recentObservations: [], comparisonStart: '2000-01-01',
      comparisonEnd: '2025-01-01', outerLower: 10, innerLower: 25,
      median: 50, innerUpper: 75, outerUpper: 90,
      latestObservation: { date: '2025-01-01', value },
      validObservationCount: 300, recentObservationCount: 61,
    })).toBe(expected)
  })

  it('matches the latest committed source calculation and five-year compact window', () => {
    const series = validateEconomicSeries(manufacturingOutputData)
    const derived = deriveManufacturingOutputGrowth(series.observations)
    const model = deriveHistoricalBandContext(
      derived.growth,
      manufacturingOutputCompactDefinition.historicalBands,
    )
    expect(model.status).toBe('ready')
    if (model.status !== 'ready') return
    const latestDerived = [...derived.growth].reverse().find(({ value }) => value !== null)!
    expect(model.latestObservation).toEqual(latestDerived)
    expect(model.recentObservations).toHaveLength(61)
    expect(model.recentObservations[0]?.date)
      .toBe(derived.growth.filter(({ value }) => value !== null).slice(-61)[0]?.date)
    expect(createManufacturingAccessibleSummary(model)).toContain(
      'inflation-adjusted volume of manufacturing production, not employment, sales revenue, or prices',
    )
  })
})
