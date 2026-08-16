import { describe, expect, it } from 'vitest'
import type { EconomicSeries } from '../economic-series/models/economicSeries'
import {
  classifyGdpGrowth,
  classifyInitialClaims,
  classifyUnemployment,
  createGdpTileModel,
  createInitialClaimsTileModel,
  createSahmTileModel,
  createUnemploymentTileModel,
  describeGdpGrowth,
  describeInitialClaims,
  describeUnemployment,
} from './growthLaborTileModels'

function series(slug: string, values: Array<number | null>, frequency: EconomicSeries['frequency'] = 'monthly'): EconomicSeries {
  const start = new Date('2010-01-01T00:00:00Z')
  return {
    id: slug, slug, provider: 'FRED', providerSeriesId: slug,
    title: slug, shortTitle: slug, description: slug, question: slug,
    units: 'Percent', frequency, seasonalAdjustment: null,
    transformation: 'Provider-published', sourceName: 'FRED', sourceUrl: 'https://example.com',
    retrievedAt: '2026-08-10',
    observations: values.map((value, index) => {
      const date = new Date(start)
      if (frequency === 'quarterly') date.setUTCMonth(index * 3)
      else if (frequency === 'weekly') date.setUTCDate(1 + index * 7)
      else date.setUTCMonth(index)
      return { date: date.toISOString().slice(0, 10), value }
    }),
  }
}

describe('growth and labor tile models', () => {
  it.each([
    [-0.1001, 'Contracting', 'notable-bad'], [-0.1, 'Little changed', 'normal'],
    [0, 'Little changed', 'normal'], [0.1, 'Little changed', 'normal'],
    [0.1001, 'Growing', 'notable-good'],
  ] as const)('classifies GDP %s as %s / %s', (value, label, state) => {
    expect(describeGdpGrowth(value)).toBe(label)
    expect(classifyGdpGrowth(value)).toBe(state)
  })

  it('uses the shared year-over-year growth history, no secondary, five years, and full history', () => {
    const growth = series('real-gdp-growth', Array.from({ length: 61 }, (_, i) => i / 10), 'quarterly')
    const model = createGdpTileModel(growth)
    expect(model.headline.value).toBe(6)
    expect(model.secondary).toBeNull()
    expect(model.sparkline).toHaveLength(21)
    expect(model.historical.historyStart).toBe(growth.observations[0].date)
  })

  it.each([
    [3.9, 'Low', 'notable-good'], [4, 'Moderate', 'notable-good'],
    [4.999, 'Moderate', 'normal'], [5, 'High', 'notable-bad'],
    [6.9, 'High', 'notable-bad'], [7, 'Very high', 'notable-bad'],
  ] as const)('classifies unemployment %s as %s / %s', (value, label, state) => {
    expect(describeUnemployment(value)).toBe(label)
    expect(classifyUnemployment(value)).toBe(state)
  })

  it('uses UNRATE history and the transformed PAYEMS secondary', () => {
    const unemployment = series('unemployment-rate', Array.from({ length: 73 }, () => 4.1))
    const model = createUnemploymentTileModel(unemployment, series('dashboard-payroll-change', [-23]))
    expect(model.headline.value).toBe(4.1)
    expect(model.secondary?.value).toBe(-23)
    expect(model.sparkline).toHaveLength(61)
    expect(model.historical.historyStart).toBe(unemployment.observations[0].date)
  })

  it.each([
    [219_999, 'Low', 'notable-good'], [220_000, 'Typical range', 'normal'],
    [300_000, 'Typical range', 'normal'], [300_001, 'Elevated', 'notable-bad'],
  ] as const)('classifies claims %s as %s / %s', (value, label, state) => {
    expect(describeInitialClaims(value)).toBe(label)
    expect(classifyInitialClaims(value)).toBe(state)
  })

  it('uses IC4WSA history directly and ICSA only as the secondary', () => {
    const average = series('initial-unemployment-claims-four-week-average', Array.from({ length: 120 }, (_, i) => 200_000 + i), 'weekly')
    const model = createInitialClaimsTileModel(average, series('initial-unemployment-claims', [228_000], 'weekly'))
    expect(model.headline.value).toBe(200_119)
    expect(model.secondary?.value).toBe(228_000)
    expect(model.sparkline.length).toBeGreaterThan(100)
    expect(model.historical.historyStart).toBe(average.observations[0].date)
  })

  it('uses the canonical 0.50 Sahm trigger without a good state', () => {
    expect(createSahmTileModel(series('dashboard-sahm-rule-gap', [0.49])))
      .toMatchObject({ state: 'normal', stateLabel: 'Below trigger' })
    expect(createSahmTileModel(series('dashboard-sahm-rule-gap', [0.5])))
      .toMatchObject({ state: 'notable-bad', stateLabel: 'Triggered' })
  })
})
