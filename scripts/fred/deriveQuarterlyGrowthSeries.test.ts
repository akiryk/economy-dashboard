import { describe, expect, it } from 'vitest'
import type { EconomicObservation } from '../../src/features/economic-series/models/economicSeries'
import {
  deriveQuarterlyGrowthSeries,
  deriveQuarterlyYearOverYearGrowth,
} from './deriveQuarterlyGrowthSeries'
import { fredSeriesConfigurations } from './seriesConfigurations'

const perCapitaConfig = fredSeriesConfigurations.find(
  (config) => config.providerSeriesId === 'A939RX0Q048SBEA',
)!

describe('deriveQuarterlyYearOverYearGrowth', () => {
  it('uses the exact calendar quarter one year earlier without mutation or premature rounding', () => {
    const levels: EconomicObservation[] = [
      { date: '2024-01-01', value: 97 },
      { date: '2025-01-01', value: 100 },
      { date: '2025-04-01', value: 101 },
    ]
    const original = structuredClone(levels)

    expect(deriveQuarterlyYearOverYearGrowth(levels)).toEqual([
      { date: '2024-01-01', value: null },
      { date: '2025-01-01', value: 3.092783505154628 },
      { date: '2025-04-01', value: null },
    ])
    expect(levels).toEqual(original)
  })

  it.each([
    [100, 110, 10],
    [100, 90, -10],
    [100, 100, 0],
  ])('preserves growth from %s to %s', (prior, current, expected) => {
    const result = deriveQuarterlyYearOverYearGrowth([
      { date: '2024-01-01', value: prior },
      { date: '2025-01-01', value: current },
    ])
    expect(result.at(-1)?.value).toBeCloseTo(expected)
  })

  it('returns unavailable values with fewer than four quarters', () => {
    expect(
      deriveQuarterlyYearOverYearGrowth([
        { date: '2025-01-01', value: 100 },
        { date: '2025-04-01', value: 101 },
        { date: '2025-07-01', value: 102 },
      ]).every((observation) => observation.value === null),
    ).toBe(true)
  })

  it('does not bridge a missing prior-year quarter by array position', () => {
    const result = deriveQuarterlyYearOverYearGrowth([
      { date: '2023-10-01', value: 90 },
      { date: '2024-04-01', value: 100 },
      { date: '2024-07-01', value: 105 },
      { date: '2024-10-01', value: 110 },
      { date: '2025-01-01', value: 120 },
    ])
    expect(result.at(-1)).toEqual({ date: '2025-01-01', value: null })
  })

  it('preserves missing source levels as unavailable', () => {
    const result = deriveQuarterlyYearOverYearGrowth([
      { date: '2024-01-01', value: null },
      { date: '2025-01-01', value: 110 },
    ])
    expect(result.at(-1)?.value).toBeNull()
  })
})

describe('deriveQuarterlyGrowthSeries', () => {
  it('excludes future dates, trims only leading nulls, and preserves source provenance', () => {
    const response = {
      observations: [
        { date: '2024-01-01', value: '100' },
        { date: '2024-04-01', value: '101' },
        { date: '2024-07-01', value: '102' },
        { date: '2024-10-01', value: '103' },
        { date: '2025-01-01', value: '104' },
        { date: '2025-04-01', value: '.' },
        { date: '2027-01-01', value: '999' },
      ],
    }
    const original = structuredClone(response)
    const result = deriveQuarterlyGrowthSeries(
      response,
      '2026-07-13',
      { ...perCapitaConfig, minimumUsableObservations: 1 },
    )

    expect(result.observations).toEqual([
      { date: '2025-01-01', value: 4.0000000000000036 },
      { date: '2025-04-01', value: null },
    ])
    expect(result).toMatchObject({
      providerSeriesId: 'A939RX0Q048SBEA',
      frequency: 'quarterly',
      transformation:
        'Percent change from year ago, calculated by the application',
    })
    expect(response).toEqual(original)
  })

  it('rejects duplicate provider dates', () => {
    expect(() =>
      deriveQuarterlyGrowthSeries(
        {
          observations: [
            { date: '2024-01-01', value: '100' },
            { date: '2024-01-01', value: '101' },
          ],
        },
        '2026-07-13',
        { ...perCapitaConfig, minimumUsableObservations: 1 },
      ),
    ).toThrow('duplicate date')
  })
})
