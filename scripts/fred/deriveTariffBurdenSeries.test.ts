import { describe, expect, it } from 'vitest'
import type { EconomicSeries } from '../../src/features/economic-series/models/economicSeries'
import { deriveTariffBurdenSeries } from './deriveTariffBurdenSeries'
import { tariffBurdenConfiguration } from './seriesConfigurations'

function sourceSeries(
  providerSeriesId: string,
  observations: EconomicSeries['observations'],
): EconomicSeries {
  return {
    id: providerSeriesId,
    slug: providerSeriesId,
    provider: 'Federal Reserve Bank of St. Louis',
    providerSeriesId,
    title: providerSeriesId,
    shortTitle: providerSeriesId,
    description: providerSeriesId,
    question: providerSeriesId,
    units: 'Billions of Dollars',
    frequency: 'quarterly',
    seasonalAdjustment: 'Seasonally Adjusted Annual Rate',
    transformation: 'Level',
    sourceName: 'U.S. Bureau of Economic Analysis via FRED',
    sourceUrl: `https://fred.stlouisfed.org/series/${providerSeriesId}`,
    retrievedAt: '2026-07-17',
    observations,
  }
}

describe('deriveTariffBurdenSeries', () => {
  it('aligns exact quarters, preserves precision, and records both sources', () => {
    const result = deriveTariffBurdenSeries(
      sourceSeries('B235RC1Q027SBEA', [
        { date: '2024-01-01', value: 10 },
        { date: '2024-04-01', value: 12 },
        { date: '2024-07-01', value: 15 },
      ]),
      sourceSeries('A255RC1Q027SBEA', [
        { date: '2024-01-01', value: 200 },
        { date: '2024-07-01', value: 300 },
      ]),
      '2026-07-17',
      tariffBurdenConfiguration,
    )

    expect(result.observations).toEqual([
      { date: '2024-01-01', value: 5 },
      { date: '2024-04-01', value: null },
      { date: '2024-07-01', value: 5 },
    ])
    expect(result.sources).toEqual([
      expect.objectContaining({ providerSeriesId: 'B235RC1Q027SBEA', role: 'Customs-duty numerator' }),
      expect.objectContaining({ providerSeriesId: 'A255RC1Q027SBEA', role: 'Goods-import denominator' }),
    ])
  })

  it('trims unavailable leading quarters and rejects nonpositive denominators', () => {
    const result = deriveTariffBurdenSeries(
      sourceSeries('B235RC1Q027SBEA', [
        { date: '2024-01-01', value: null },
        { date: '2024-04-01', value: 12 },
        { date: '2024-07-01', value: 15 },
      ]),
      sourceSeries('A255RC1Q027SBEA', [
        { date: '2024-01-01', value: 200 },
        { date: '2024-04-01', value: 0 },
        { date: '2024-07-01', value: 250 },
      ]),
      '2026-07-17',
      tariffBurdenConfiguration,
    )

    expect(result.observations).toEqual([{ date: '2024-07-01', value: 6 }])
  })
})
