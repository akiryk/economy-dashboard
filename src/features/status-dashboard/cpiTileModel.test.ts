import { describe, expect, it } from 'vitest'
import type { EconomicObservation, EconomicSeries } from '../economic-series/models/economicSeries'
import {
  calculateHistoricalPercentile,
  classifyCpiInflation,
  createCpiTileModel,
  selectMonthlyLookback,
} from './cpiTileModel'

const observations = (values: Array<number | null>): EconomicObservation[] =>
  values.map((value, index) => ({
    date: `${2020 + Math.floor(index / 12)}-${String(index % 12 + 1).padStart(2, '0')}-01`,
    value,
  }))

function series(slug: string, values: Array<number | null>): EconomicSeries {
  return {
    id: slug, slug, provider: 'FRED', providerSeriesId: slug,
    title: slug, shortTitle: slug, description: slug, question: slug,
    units: 'Percent', frequency: 'monthly', seasonalAdjustment: 'Seasonally adjusted',
    transformation: 'FRED units=pc1', sourceName: 'FRED', sourceUrl: 'https://example.com',
    retrievedAt: '2026-08-10', observations: observations(values),
  }
}

describe('CPI tile model', () => {
  it.each([
    [1.5, 'notable-good'], [2.5, 'notable-good'], [2.5001, 'normal'],
    [3.5, 'normal'], [3.5001, 'notable-bad'], [0.5, 'normal'],
    [0.4999, 'notable-bad'],
  ] as const)('classifies %s as %s using the unrounded value', (value, expected) => {
    expect(classifyCpiInflation(value)).toBe(expected)
  })

  it('uses latest valid headline and core values while preserving their dates', () => {
    const model = createCpiTileModel(
      series('headline', [1, 1.6, null]),
      series('core', [2, 1.9, null]),
    )
    expect(model.headline).toEqual({ date: '2020-02-01', value: 1.6 })
    expect(model.core).toEqual({ date: '2020-02-01', value: 1.9 })
    expect(model.state).toBe('notable-good')
  })

  it('selects five years through the latest period without smoothing or filling gaps', () => {
    const history = observations(Array.from({ length: 73 }, (_, index) =>
      index === 2 ? null : index))
    const selected = selectMonthlyLookback(history, history.at(-1)!.date, 5)
    expect(selected[0].date).toBe('2021-01-01')
    expect(selected).toHaveLength(61)
    expect(selected.some(({ value }) => value === null)).toBe(false)

    const recentGapHistory = history.map((point, index) =>
      index === 70 ? { ...point, value: null } : point)
    expect(selectMonthlyLookback(recentGapHistory, history.at(-1)!.date, 5))
      .toContainEqual({ date: '2025-11-01', value: null })
  })

  it('computes midpoint rank over full valid history and excludes missing values', () => {
    const history = observations([1, 2, null, 2, 3, 4])
    const result = calculateHistoricalPercentile(
      history,
      { date: '2020-04-01', value: 2 },
    )
    expect(result.percentile).toBe(40)
    expect(result.historyStart).toBe('2020-01-01')
    expect(result.historyEnd).toBe('2020-06-01')
    expect(result.minimum).toEqual({ date: '2020-01-01', value: 1 })
    expect(result.maximum).toEqual({ date: '2020-06-01', value: 4 })
    expect(result.record).toBeNull()
  })

  it('pins record lows and highs to the endpoints', () => {
    const history = observations([1, 2, 3])
    expect(calculateHistoricalPercentile(history, { date: '2020-01-01', value: 1 }))
      .toMatchObject({ percentile: 0, record: 'low' })
    expect(calculateHistoricalPercentile(history, { date: '2020-03-01', value: 3 }))
      .toMatchObject({ percentile: 100, record: 'high' })
  })
})
