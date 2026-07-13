import { describe, expect, it } from 'vitest'
import type { EconomicObservation, EconomicSeries } from '../../src/features/economic-series/models/economicSeries'
import { validateEconomicSeries } from '../../src/features/economic-series/models/validateEconomicSeries'
import {
  deriveNominalWageGrowth,
  deriveRealWageGrowth,
  deriveWageSeries,
} from './deriveWageSeries'
import { wageSeriesConfiguration } from './seriesConfigurations'

function cpiSeries(observations: EconomicObservation[]): EconomicSeries {
  return validateEconomicSeries({
    id: 'headline-cpi-inflation', slug: 'headline-cpi-inflation',
    provider: 'Federal Reserve Bank of St. Louis', providerSeriesId: 'CPIAUCSL',
    title: 'CPI', shortTitle: 'CPI inflation', description: 'CPI inflation',
    question: 'Prices?', units: 'Percent change from year ago', frequency: 'monthly',
    seasonalAdjustment: 'Seasonally adjusted', transformation: 'Percent change from year ago',
    sourceName: 'BLS via FRED', sourceUrl: 'https://fred.stlouisfed.org/series/CPIAUCSL',
    retrievedAt: '2026-07-13', observations,
  })
}

describe('deriveNominalWageGrowth', () => {
  it('uses the exact calendar month one year earlier without mutation', () => {
    const levels: EconomicObservation[] = [
      { date: '1965-02-01', value: 2.2 },
      { date: '1964-01-01', value: 2 },
      { date: '1965-01-01', value: 2.1 },
    ]
    const original = structuredClone(levels)
    expect(deriveNominalWageGrowth(levels)).toEqual([
      { date: '1964-01-01', value: null },
      { date: '1965-01-01', value: 5.000000000000004 },
      { date: '1965-02-01', value: null },
    ])
    expect(levels).toEqual(original)
  })

  it.each([
    [100, 110, 10],
    [100, 90, -10],
    [100, 100, 0],
  ])('preserves growth from %s to %s', (prior, current, expected) => {
    const result = deriveNominalWageGrowth([
      { date: '1964-01-01', value: prior },
      { date: '1965-01-01', value: current },
    ])
    expect(result.at(-1)?.value).toBeCloseTo(expected)
  })
})

describe('deriveRealWageGrowth', () => {
  it.each([
    ['wages faster', 110, 5, 4.7619047619],
    ['prices faster', 104, 7, -2.8037383178],
    ['same growth', 105, 5, 0],
    ['prices fall', 100, -2, 2.0408163265],
    ['wages fall', 98, 1, -2.9702970297],
  ])('%s uses the exact ratio formula', (_label, current, inflation, expected) => {
    const result = deriveRealWageGrowth(
      [
        { date: '1964-01-01', value: 100 },
        { date: '1965-01-01', value: current },
      ],
      [{ date: '1965-01-01', value: inflation }],
    )
    expect(result[0]?.value).toBeCloseTo(expected)
  })

  it('does not merely subtract rounded nominal growth and inflation', () => {
    const value = deriveRealWageGrowth(
      [
        { date: '1964-01-01', value: 100 },
        { date: '1965-01-01', value: 110 },
      ],
      [{ date: '1965-01-01', value: 5 }],
    ).at(-1)?.value
    expect(value).toBeCloseTo(4.7619047619)
    expect(value).not.toBe(5)
  })

  it('requires exact wage and CPI months and does not mutate inputs', () => {
    const wages: EconomicObservation[] = [
      { date: '1964-01-01', value: 100 },
      { date: '1965-01-01', value: 105 },
      { date: '1965-02-01', value: 106 },
    ]
    const inflation: EconomicObservation[] = [
      { date: '1965-01-01', value: null },
      { date: '1965-03-01', value: 2 },
    ]
    const originals = structuredClone({ wages, inflation })
    expect(deriveRealWageGrowth(wages, inflation)).toEqual([
      { date: '1965-01-01', value: null },
    ])
    expect({ wages, inflation }).toEqual(originals)
  })
})

describe('deriveWageSeries', () => {
  const wageObservations = Array.from({ length: 14 }, (_, index) => ({
    date: new Date(Date.UTC(1964, index, 1)).toISOString().slice(0, 10),
    value: String(2 + index / 100),
  }))

  it('builds valid outputs, excludes future dates, and discloses both real-wage sources', () => {
    const response = {
      observations: [...wageObservations, { date: '2027-01-01', value: '9' }],
    }
    const original = structuredClone(response)
    const result = deriveWageSeries(
      response,
      cpiSeries([
        { date: '1965-01-01', value: 2 },
        { date: '1965-02-01', value: 2.1 },
      ]),
      '2026-07-13',
      wageSeriesConfiguration,
    )
    expect(result.nominalWageGrowth.observations[0]?.date).toBe('1965-01-01')
    expect(result.realWageGrowth.observations.at(-1)?.date).toBe('1965-02-01')
    expect(result.realWageGrowth.sources?.map((source) => source.providerSeriesId))
      .toEqual(['AHETPI', 'CPIAUCSL'])
    expect(validateEconomicSeries(result.realWageGrowth)).toEqual(result.realWageGrowth)
    expect(response).toEqual(original)
  })

  it('rejects duplicate wage dates', () => {
    expect(() => deriveWageSeries(
      { observations: [...wageObservations, wageObservations[0]!] },
      cpiSeries([{ date: '1965-01-01', value: 2 }]),
      '2026-07-13',
      wageSeriesConfiguration,
    )).toThrow('duplicate date')
  })
})
