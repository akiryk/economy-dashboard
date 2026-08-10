import { describe, expect, it } from 'vitest'
import type { EconomicSeries } from '../economic-series/models/economicSeries'
import {
  classifyExpectedInflation,
  createExpectedInflationTileModel,
  createFedFundsTileModel,
  createYieldCurveTileModel,
  describeExpectedInflation,
  describeFedFunds,
  formatBasisPoints,
} from './pricesRatesTileModels'

function series(slug: string, values: Array<{ date: string; value: number | null }>): EconomicSeries {
  return {
    id: slug, slug, provider: 'FRED', providerSeriesId: slug,
    title: slug, shortTitle: slug, description: slug, question: slug,
    units: 'Percent', frequency: 'daily', seasonalAdjustment: null,
    transformation: 'Provider-published daily value', sourceName: 'FRED',
    sourceUrl: 'https://example.com', retrievedAt: '2026-08-10', observations: values,
  }
}

const history = [
  { date: '2024-01-02', value: 1 },
  { date: '2025-08-08', value: 2 },
  { date: '2026-08-07', value: 2.7 },
]

describe('prices and rates tile models', () => {
  it.each([
    [0.9, 'Very low', 'notable-bad'],
    [1, 'Low', 'normal'],
    [1.8, 'Near price-stability range', 'notable-good'],
    [2.5, 'Near price-stability range', 'notable-good'],
    [2.7, 'Elevated', 'normal'],
    [3, 'Elevated', 'normal'],
    [3.01, 'High', 'notable-bad'],
  ] as const)('classifies expected inflation %s', (value, label, state) => {
    expect(describeExpectedInflation(value)).toBe(label)
    expect(classifyExpectedInflation(value)).toBe(state)
  })

  it('uses a one-year sparkline and full expected-inflation history', () => {
    const model = createExpectedInflationTileModel(series('expected', history))
    expect(model.headline.value).toBe(2.7)
    expect(model.sparkline.map(({ date }) => date)).toEqual(['2025-08-08', '2026-08-07'])
    expect(model.historical.historyStart).toBe('2024-01-02')
  })

  it.each([
    [4.33, 4.5, 'Within target range'],
    [4.51, 4.5, 'Above target range'],
    [4, 4.5, 'Below target upper'],
    [4, null, 'Target unavailable'],
  ] as const)('describes available target-upper relationship', (effective, upper, label) => {
    expect(describeFedFunds(effective, upper)).toBe(label)
  })

  it('keeps Fed funds neutral and compares the latest available upper bound', () => {
    const model = createFedFundsTileModel(
      series('effective', history),
      series('upper', [{ date: '2026-08-07', value: 2.75 }]),
    )
    expect(model.state).toBe('normal')
    expect(model.stateLabel).toBe('Within target range')
    expect(model.historical.historyStart).toBe('2024-01-02')
  })

  it('formats source percentage points as signed basis points', () => {
    expect(formatBasisPoints(0.58)).toBe('+58 bps')
    expect(formatBasisPoints(-0.42)).toBe('−42 bps')
    expect(formatBasisPoints(0)).toBe('0 bps')
  })

  it('makes only an inverted yield curve notable-bad and preserves both provider spreads', () => {
    const inverted = createYieldCurveTileModel(
      series('2y', [{ date: '2026-08-07', value: -0.42 }]),
      series('3m', [{ date: '2026-08-07', value: 0.34 }]),
    )
    expect(inverted.state).toBe('notable-bad')
    expect(inverted.stateLabel).toBe('Inverted')
    expect(inverted.secondary?.value).toBe(0.34)
    const positive = createYieldCurveTileModel(
      series('2y', [{ date: '2026-08-07', value: 0 }]), null,
    )
    expect(positive.state).toBe('normal')
    expect(positive.stateLabel).toBe('Positive slope')
  })
})
