import { describe, expect, it } from 'vitest'
import type { EconomicSeries } from '../models/economicSeries'
import { alignHouseholdComparison } from './householdComparisonData'

function series(observations: EconomicSeries['observations']): EconomicSeries {
  return {
    id: 'test', slug: 'test', provider: 'test', providerSeriesId: 'test',
    title: 'test', shortTitle: 'test', description: 'test', question: 'test',
    units: 'Percent', frequency: 'monthly', seasonalAdjustment: null,
    transformation: 'test', sourceName: 'test', sourceUrl: 'https://example.com',
    retrievedAt: '2026-07-14', observations,
  }
}

describe('alignHouseholdComparison', () => {
  it('aligns exact months and calculates spending minus income without mutating inputs', () => {
    const income = series([{ date: '2025-02-01', value: 1 }, { date: '2025-01-01', value: 2 }])
    const spending = series([{ date: '2025-01-01', value: 3 }, { date: '2025-03-01', value: 4 }])
    const original = structuredClone(income.observations)
    expect(alignHouseholdComparison(income, spending)).toEqual([
      { date: '2025-01-01', incomeGrowth: 2, spendingGrowth: 3, gap: 1 },
    ])
    expect(income.observations).toEqual(original)
  })
})
