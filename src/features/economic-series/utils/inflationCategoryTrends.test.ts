import { describe, expect, it } from 'vitest'
import type { EconomicSeries } from '../models/economicSeries'
import type { CompactInflationContribution } from './inflationContributions'
import {
  calculateCategoryInflationSharedDomain,
  contributionInflationSeriesMappings,
  deriveInflationDriversSupportingTrends,
} from './inflationCategoryTrends'

const selected: CompactInflationContribution[] = [
  { id: 'other-services', label: 'Other services', contribution: 1, kind: 'category' },
  { id: 'energy', label: 'Energy', contribution: -0.8, kind: 'category' },
  { id: 'food', label: 'Food', contribution: 0.4, kind: 'category' },
  { id: 'shelter', label: 'Shelter', contribution: 0.3, kind: 'category' },
  { id: 'everything-else', label: 'Everything else', contribution: 0.1, kind: 'remainder' },
]

function series(slug: string, values: Array<[string, number | null]>): EconomicSeries {
  return {
    id: slug, slug, provider: 'BLS', providerSeriesId: slug,
    title: slug, shortTitle: slug, description: slug, question: slug,
    units: 'Percent change from year ago', frequency: 'monthly',
    seasonalAdjustment: 'Not seasonally adjusted', transformation: 'Year over year',
    sourceName: 'BLS', sourceUrl: 'https://bls.gov', retrievedAt: '2026-07-24',
    observations: values.map(([date, value]) => ({ date, value })),
  }
}

describe('contributionInflationSeriesMappings', () => {
  it('uses exact IDs and does not map unsupported Other services', () => {
    expect(contributionInflationSeriesMappings.map((item) => item.contributionCategoryId))
      .toEqual(['shelter', 'energy', 'food'])
    expect(contributionInflationSeriesMappings.some((item) =>
      item.label === 'Other services')).toBe(false)
  })
})

describe('deriveInflationDriversSupportingTrends', () => {
  it('keeps selected order, omits unsupported categories, and never substitutes the remainder', () => {
    const input = [
      series('energy-cpi-inflation', [['2026-06-01', -2]]),
      series('food-cpi-inflation', [['2026-05-01', 3]]),
      series('shelter-cpi-inflation', [['2026-06-01', 4]]),
    ]
    const model = deriveInflationDriversSupportingTrends({
      selectedContributions: selected,
      supportingSeries: input,
    })
    expect(model.trends.map((trend) => trend.contributionCategoryId))
      .toEqual(['energy', 'food', 'shelter'])
    expect(model.unsupportedCategoryIds).toEqual(['other-services'])
    expect(model.trends[1]?.currentPeriod).toBe('2026-05-01')
  })

  it('preserves chronological null and negative observations without source mutation', () => {
    const input = series('energy-cpi-inflation', [
      ['2026-06-01', -2], ['2025-10-01', null], ['2021-06-01', 4],
    ])
    const model = deriveInflationDriversSupportingTrends({
      selectedContributions: [selected[1]!],
      supportingSeries: [input],
    })
    expect(model.trends[0]?.observations).toEqual([
      { date: '2021-06-01', value: 4 },
      { date: '2025-10-01', value: null },
      { date: '2026-06-01', value: -2 },
    ])
    expect(input.observations[0]?.date).toBe('2026-06-01')
  })

  it('degrades to no trends when mapped series are unavailable', () => {
    const model = deriveInflationDriversSupportingTrends({
      selectedContributions: [selected[1]!],
      supportingSeries: [],
    })
    expect(model.trends).toEqual([])
    expect(model.unavailableCategoryIds).toEqual(['energy'])
    expect(model.unavailableLabels).toEqual(['Energy'])
  })
})

describe('calculateCategoryInflationSharedDomain', () => {
  it.each([
    [[1, 2], [-0.16, 2.16]],
    [[-2, 3], [-2.4, 3.4]],
    [[0, 0], [-0.1, 0.1]],
  ])('includes zero with deterministic padding for %j', (values, expected) => {
    expect(calculateCategoryInflationSharedDomain([{
      observations: values.map((value, index) => ({
        date: `2026-0${index + 1}-01`,
        value,
      })),
    }])).toEqual(expected)
  })
})
