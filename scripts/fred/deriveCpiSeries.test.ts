import { describe, expect, it } from 'vitest'
import type { EconomicObservation } from '../../src/features/economic-series/models/economicSeries'
import {
  deriveCpiSeries,
  deriveMonthlyYearOverYearGrowth,
  deriveThreeMonthAnnualizedInflation,
} from './deriveCpiSeries'
import { cpiSeriesConfiguration } from './seriesConfigurations'

function monthlyLevels(
  startYear: number,
  startMonth: number,
  count: number,
  value: (index: number) => number,
): EconomicObservation[] {
  return Array.from({ length: count }, (_, index) => ({
    date: new Date(Date.UTC(startYear, startMonth + index, 1))
      .toISOString()
      .slice(0, 10),
    value: value(index),
  }))
}

describe('deriveMonthlyYearOverYearGrowth', () => {
  it('uses the exact prior-year month without mutation or premature rounding', () => {
    const levels: EconomicObservation[] = [
      { date: '2024-01-01', value: 97 },
      { date: '2025-01-01', value: 100 },
      { date: '2025-02-01', value: 101 },
    ]
    const original = structuredClone(levels)
    const result = deriveMonthlyYearOverYearGrowth(levels)
    expect(result[1]?.value).toBe(3.092783505154628)
    expect(result[2]?.value).toBeNull()
    expect(levels).toEqual(original)
  })

  it.each([
    [100, 110, 10],
    [100, 90, -10],
    [100, 100, 0],
  ])('preserves growth from %s to %s', (prior, current, expected) => {
    expect(
      deriveMonthlyYearOverYearGrowth([
        { date: '2024-01-01', value: prior },
        { date: '2025-01-01', value: current },
      ]).at(-1)?.value,
    ).toBeCloseTo(expected)
  })

  it('does not use array position when the exact prior month is absent', () => {
    const levels = monthlyLevels(2024, 1, 12, (index) => 100 + index)
    levels.push({ date: '2025-01-01', value: 120 })
    expect(deriveMonthlyYearOverYearGrowth(levels).at(-1)?.value).toBeNull()
  })
})

describe('deriveThreeMonthAnnualizedInflation', () => {
  it.each([
    ['rising', [100, 101, 102, 103], 12.550881],
    ['falling', [100, 99, 98, 97], -11.470719],
    ['unchanged', [100, 100, 100, 100], 0],
  ])('%s prices use the exact ratio formula', (_label, values, expected) => {
    const result = deriveThreeMonthAnnualizedInflation(
      monthlyLevels(2025, 0, 4, (index) => values[index]!),
    )
    expect(result.at(-1)?.value).toBeCloseTo(expected, 5)
  })

  it('does not approximate by multiplying the three-month change by four', () => {
    const value = deriveThreeMonthAnnualizedInflation(
      monthlyLevels(2025, 0, 4, (index) => [100, 101, 102, 110][index]!),
    ).at(-1)?.value
    expect(value).toBeCloseTo(46.41)
    expect(value).not.toBe(40)
  })

  it('requires a continuous four-month window with non-null endpoints', () => {
    const missingIntermediate: EconomicObservation[] = [
      { date: '2025-01-01', value: 100 },
      { date: '2025-02-01', value: 101 },
      { date: '2025-04-01', value: 103 },
    ]
    const nullPrior = monthlyLevels(2025, 0, 4, (index) => 100 + index)
    nullPrior[0] = { ...nullPrior[0]!, value: null }
    expect(
      deriveThreeMonthAnnualizedInflation(missingIntermediate).at(-1)?.value,
    ).toBeNull()
    expect(
      deriveThreeMonthAnnualizedInflation(nullPrior).at(-1)?.value,
    ).toBeNull()
  })

  it('does not mutate input', () => {
    const levels = monthlyLevels(2025, 0, 4, (index) => 100 + index)
    const original = structuredClone(levels)
    deriveThreeMonthAnnualizedInflation(levels)
    expect(levels).toEqual(original)
  })
})

describe('deriveCpiSeries', () => {
  it('builds four valid outputs, excludes future dates, and preserves provenance', () => {
    const observations = monthlyLevels(2024, 0, 14, (index) => 100 + index).map(
      (item) => ({ date: item.date, value: String(item.value) }),
    )
    observations.push({ date: '2027-01-01', value: '999' })
    const original = structuredClone(observations)
    const result = deriveCpiSeries(
      { observations },
      { observations },
      '2026-07-13',
      { ...cpiSeriesConfiguration, minimumUsableObservations: 4 },
    )
    expect(result.headlineInflation.observations[0]?.date).toBe('2025-01-01')
    expect(result.headlineMomentum.observations[0]?.date).toBe('2024-04-01')
    expect(result.coreInflation.providerSeriesId).toBe('CPILFESL')
    expect(result.coreMomentum.transformation).toContain('Three-month annualized')
    expect(result.coreMomentum.observations.at(-1)?.date).toBe('2025-02-01')
    expect(observations).toEqual(original)
  })
})
