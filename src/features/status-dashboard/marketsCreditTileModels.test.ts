import { describe, expect, it } from 'vitest'
import type { EconomicSeries } from '../economic-series/models/economicSeries'
import {
  calculateAvailableHistoryDrawdown,
  calculateYearToDateChange,
  classifyHighYieldSpread,
  classifySp500Drawdown,
  createHighYieldSpreadTileModel,
  createLongRatesTileModel,
  createSp500TileModel,
  describeHighYieldSpread,
  describeSp500Drawdown,
  mortgageTreasurySpreadBasisPoints,
} from './marketsCreditTileModels'

function series(slug: string, observations: Array<[string, number | null]>): EconomicSeries {
  return {
    id: slug, slug, provider: 'FRED', providerSeriesId: slug,
    title: slug, shortTitle: slug, description: slug, question: slug,
    units: 'Percent', frequency: 'daily', seasonalAdjustment: null,
    transformation: 'FRED units', sourceName: 'FRED',
    sourceUrl: 'https://fred.stlouisfed.org', retrievedAt: '2026-08-10',
    observations: observations.map(([date, value]) => ({ date, value })),
  }
}

describe('markets and credit tile models', () => {
  it('preserves independent rate dates and calculates the mortgage spread in basis points', () => {
    const treasury = series('DGS10', [
      ['2025-08-07', 4], ['2026-08-06', 4.5], ['2026-08-07', 4.65],
    ])
    const mortgage = series('MORTGAGE30US', [
      ['2025-08-07', 6.5], ['2026-08-06', 6.69],
    ])
    const model = createLongRatesTileModel(treasury, mortgage)
    expect(model.headline).toEqual({ date: '2026-08-07', value: 4.65 })
    expect(model.mortgage).toEqual({ date: '2026-08-06', value: 6.69 })
    expect(model.mortgageSpreadBasisPoints).toBeCloseTo(204)
    expect(mortgageTreasurySpreadBasisPoints(6.72, 4.18)).toBeCloseTo(254)
    expect(model.sparkline[0]?.date).toBe('2025-08-07')
    expect(model.historical.historyStart).toBe('2025-08-07')
  })

  it('derives S&P drawdown from the available maximum and returns zero at a high', () => {
    const observations = series('SP500', [
      ['2025-12-30', 100], ['2025-12-31', 110],
      ['2026-01-02', null], ['2026-08-07', 105],
    ]).observations
    const current = { date: '2026-08-07', value: 105 }
    expect(calculateAvailableHistoryDrawdown(observations, current)).toBeCloseTo(-4.54545)
    expect(calculateAvailableHistoryDrawdown(observations, { date: '2025-12-31', value: 110 })).toBe(0)
    expect(calculateYearToDateChange(observations, current)).toBeCloseTo(-4.54545)
  })

  it('uses the last valid prior-year observation for YTD without assuming January 1', () => {
    const observations = series('SP500', [
      ['2025-12-30', 100], ['2025-12-31', null], ['2026-01-02', 101], ['2026-08-07', 110],
    ]).observations
    expect(calculateYearToDateChange(observations, { date: '2026-08-07', value: 110 })).toBeCloseTo(10)
  })

  it('applies S&P drawdown state and color boundaries', () => {
    expect(describeSp500Drawdown(0)).toBe('At high')
    expect(describeSp500Drawdown(-0.5)).toBe('Near high')
    expect(describeSp500Drawdown(-1)).toBe('Modest pullback')
    expect(describeSp500Drawdown(-5)).toBe('Meaningful pullback')
    expect(describeSp500Drawdown(-10)).toBe('Correction or worse')
    expect(classifySp500Drawdown(-0.99)).toBe('notable-good')
    expect(classifySp500Drawdown(-5)).toBe('normal')
    expect(classifySp500Drawdown(-10)).toBe('normal')
    expect(classifySp500Drawdown(-10.01)).toBe('notable-bad')
  })

  it('creates a one-year S&P drawdown sparkline and omits a percentile model', () => {
    const model = createSp500TileModel(series('SP500', [
      ['2025-08-07', 100], ['2025-12-31', 105], ['2026-08-07', 110],
    ]))
    expect(model.drawdown).toBe(0)
    expect(model.yearToDateChange).toBeCloseTo(4.7619)
    expect(model.sparkline).toEqual([
      { date: '2025-08-07', value: 0 },
      { date: '2025-12-31', value: 0 },
      { date: '2026-08-07', value: 0 },
    ])
    expect(model).not.toHaveProperty('historical')
  })

  it('converts and classifies high-yield spreads using unrounded values', () => {
    expect(describeHighYieldSpread(349.9)).toBe('Calm')
    expect(classifyHighYieldSpread(349.9)).toBe('notable-good')
    expect(describeHighYieldSpread(350)).toBe('Normal risk premium')
    expect(classifyHighYieldSpread(500)).toBe('normal')
    expect(describeHighYieldSpread(500.1)).toBe('Stressed')
    expect(classifyHighYieldSpread(500.1)).toBe('notable-bad')
    const model = createHighYieldSpreadTileModel(series('BAMLH0A0HYM2', [
      ['2025-08-07', 4], ['2026-08-07', 3.499],
    ]))
    expect(model.basisPoints).toBeCloseTo(349.9)
    expect(model.sparkline).toHaveLength(2)
    expect(model.historical.historyStart).toBe('2025-08-07')
  })
})
