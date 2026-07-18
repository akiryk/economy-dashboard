import { describe, expect, it } from 'vitest'
import type { EconomicSeries } from '../../src/features/economic-series/models/economicSeries'
import { corporateProfitShareConfiguration } from './seriesConfigurations'
import { deriveCorporateProfitShareSeries } from './deriveCorporateProfitShareSeries'

function source(
  providerSeriesId: string,
  observations: EconomicSeries['observations'],
): EconomicSeries {
  return {
    id: providerSeriesId,
    slug: providerSeriesId,
    provider: 'FRED',
    providerSeriesId,
    title: providerSeriesId,
    shortTitle: providerSeriesId,
    description: providerSeriesId,
    question: providerSeriesId,
    units: 'Billions of dollars',
    frequency: 'quarterly',
    seasonalAdjustment: 'Seasonally adjusted annual rate',
    transformation: 'Provider-published level',
    sourceName: 'BEA via FRED',
    sourceUrl: `https://fred.stlouisfed.org/series/${providerSeriesId}`,
    retrievedAt: '2026-07-18',
    observations,
  }
}

describe('deriveCorporateProfitShareSeries', () => {
  it('aligns exact quarters without premature rounding', () => {
    const derived = deriveCorporateProfitShareSeries(
      source('CPATAX', [
        { date: '2025-01-01', value: 123.456 },
        { date: '2025-04-01', value: 130 },
        { date: '2025-07-01', value: 140 },
      ]),
      source('GDP', [
        { date: '2025-01-01', value: 987.654 },
        { date: '2025-07-01', value: 0 },
      ]),
      '2026-07-18',
      corporateProfitShareConfiguration,
    )

    expect(derived.observations).toEqual([
      { date: '2025-01-01', value: (123.456 / 987.654) * 100 },
      { date: '2025-04-01', value: null },
      { date: '2025-07-01', value: null },
    ])
    expect(derived.sources?.map((item) => item.providerSeriesId)).toEqual([
      'CPATAX',
      'GDP',
    ])
  })

  it('shows that a rising raw profit level can accompany a falling share', () => {
    const derived = deriveCorporateProfitShareSeries(
      source('CPATAX', [
        { date: '2025-01-01', value: 100 },
        { date: '2025-04-01', value: 110 },
      ]),
      source('GDP', [
        { date: '2025-01-01', value: 1_000 },
        { date: '2025-04-01', value: 1_200 },
      ]),
      '2026-07-18',
      corporateProfitShareConfiguration,
    )

    expect(derived.observations.map((item) => item.value)).toEqual([
      10,
      110 / 1_200 * 100,
    ])
    expect(derived.observations[1]!.value).toBeLessThan(derived.observations[0]!.value!)
  })
})
