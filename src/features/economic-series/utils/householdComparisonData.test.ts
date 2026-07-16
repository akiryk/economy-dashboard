import { describe, expect, it } from 'vitest'
import type { EconomicSeries } from '../models/economicSeries'
import { alignHouseholdComparison, filterHouseholdComparison } from './householdComparisonData'

function series(observations: EconomicSeries['observations']): EconomicSeries {
  return {
    id: 'test', slug: 'test', provider: 'test', providerSeriesId: 'test',
    title: 'test', shortTitle: 'test', description: 'test', question: 'test',
    units: 'Percent', frequency: 'quarterly', seasonalAdjustment: null,
    transformation: 'test', sourceName: 'test', sourceUrl: 'https://example.com',
    retrievedAt: '2026-07-14', observations,
  }
}

describe('alignHouseholdComparison', () => {
  it('aligns exact quarters and calculates spending minus income without mutating inputs', () => {
    const income = series([{ date: '2025-02-01', value: 1 }, { date: '2025-01-01', value: 2 }])
    const spending = series([{ date: '2025-01-01', value: 3 }, { date: '2025-03-01', value: 4 }])
    const original = structuredClone(income.observations)
    expect(alignHouseholdComparison(income, spending)).toEqual([
      { date: '2025-01-01', incomeGrowth: 2, spendingGrowth: 3, gap: 1 },
    ])
    expect(income.observations).toEqual(original)
  })

  it('anchors ranges to the latest shared valid quarter and preserves Maximum history', () => {
    const observations = [
      { date: '1970-01-01', incomeGrowth: 1, spendingGrowth: 2, gap: 1 },
      { date: '2021-01-01', incomeGrowth: 2, spendingGrowth: 3, gap: 1 },
      { date: '2026-01-01', incomeGrowth: 3, spendingGrowth: 4, gap: 1 },
      { date: '2026-04-01', incomeGrowth: 4, spendingGrowth: null, gap: null },
    ]
    expect(filterHouseholdComparison(observations, '5y').map((item) => item.date)).toEqual(['2021-01-01', '2026-01-01'])
    expect(filterHouseholdComparison(observations, 'max').map((item) => item.date)).toEqual(['1970-01-01', '2021-01-01', '2026-01-01'])
  })
})
