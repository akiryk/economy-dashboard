import { describe, expect, it } from 'vitest'
import type { EconomicSeries } from '../models/economicSeries'
import {
  alignWageComparisonObservations,
  calculateWageComparisonSummary,
  filterWageComparisonByTimeRange,
} from './comparisonData'

function series(slug: string, observations: EconomicSeries['observations']): EconomicSeries {
  return {
    id: slug, slug, provider: 'FRED', providerSeriesId: slug, title: slug,
    shortTitle: slug, description: slug, question: `${slug}?`, units: 'Percent',
    frequency: 'monthly', seasonalAdjustment: 'Seasonally adjusted',
    transformation: 'Test', sourceName: 'Test', sourceUrl: 'https://example.com',
    retrievedAt: '2026-07-13', observations,
  }
}

describe('wage comparison data', () => {
  it('aligns exact months rather than array positions without mutation', () => {
    const real = series('real', [
      { date: '2025-01-01', value: 1 },
      { date: '2025-02-01', value: 2 },
    ])
    const nominal = series('nominal', [
      { date: '2024-12-01', value: 3 },
      { date: '2025-02-01', value: 4 },
    ])
    const cpi = series('cpi', [
      { date: '2025-01-01', value: 2 },
      { date: '2025-02-01', value: 2.5 },
    ])
    const originals = structuredClone({ real, nominal, cpi })

    expect(alignWageComparisonObservations(real, nominal, cpi)).toEqual([
      {
        date: '2025-02-01', nominalWageGrowth: 4,
        cpiInflation: 2.5, realWageGrowth: 2,
      },
    ])
    expect({ real, nominal, cpi }).toEqual(originals)
  })

  it('filters every measure to identical ranges and preserves maximum', () => {
    const observations = Array.from({ length: 73 }, (_, index) => ({
      date: new Date(Date.UTC(2020, 4 + index, 1)).toISOString().slice(0, 10),
      nominalWageGrowth: index,
      cpiInflation: index / 2,
      realWageGrowth: index / 3,
    })).reverse()
    const original = structuredClone(observations)

    const fiveYears = filterWageComparisonByTimeRange(observations, '5y')
    expect(fiveYears).toHaveLength(61)
    expect(fiveYears[0]?.date).toBe('2021-05-01')
    expect(filterWageComparisonByTimeRange(observations, 'max')).toHaveLength(73)
    expect(observations).toEqual(original)
  })

  it('summarizes real-wage extrema with recent tie behavior', () => {
    const summary = calculateWageComparisonSummary([
      { date: '2024-01-01', nominalWageGrowth: 3, cpiInflation: 2, realWageGrowth: 1 },
      { date: '2025-01-01', nominalWageGrowth: 3, cpiInflation: 2, realWageGrowth: 1 },
      { date: '2026-01-01', nominalWageGrowth: 1, cpiInflation: 3, realWageGrowth: -2 },
    ])
    expect(summary.minimum?.date).toBe('2026-01-01')
    expect(summary.maximum?.date).toBe('2025-01-01')
    expect(summary.latest?.value).toBe(-2)
  })
})
