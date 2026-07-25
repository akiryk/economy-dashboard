import { describe, expect, it } from 'vitest'
import type { EconomicSeries } from '../models/economicSeries'
import type { CompactInflationContribution } from './inflationContributions'
import {
  contributionInflationSeriesMappings,
  deriveCategoryInflationTrendDomain,
  deriveInflationDriversSupportingTrends,
  formatCategoryInflationRange,
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

describe('deriveCategoryInflationTrendDomain', () => {
  it.each([
    [[1, 2], { min: 0, max: 2.1, includesZero: true }],
    [[4, 5], { min: 3.9, max: 5.1, includesZero: false }],
    [[-2, -1], { min: -2.1, max: 0, includesZero: true }],
    [[-2, 3], { min: -2.4, max: 3.4, includesZero: true }],
    [[4, 4], { min: 3.9, max: 4.1, includesZero: false }],
    [[0, 0], { min: -0.1, max: 0.1, includesZero: true }],
    [[0.001, 0.002], { min: -0.1, max: 0.2, includesZero: true }],
    [[7], { min: 6.9, max: 7.1, includesZero: false }],
    [[-50, 100], { min: -62, max: 112, includesZero: true }],
  ])('pads and rounds the actual values for %j', (values, expected) => {
    const observations = values.map((value, index) => ({
      date: `2026-0${index + 1}-01`,
      value,
    }))
    expect(deriveCategoryInflationTrendDomain(observations)).toEqual(expected)
    expect(observations.map(({ value }) => value)).toEqual(values)
  })

  it('includes zero at the exact two-times threshold boundary', () => {
    expect(deriveCategoryInflationTrendDomain([
      { date: '2026-01-01', value: 1.1 },
      { date: '2026-02-01', value: 1.9 },
    ])).toEqual({ min: 0, max: 2, includesZero: true })
  })

  it('ignores nulls and returns null without a finite value', () => {
    expect(deriveCategoryInflationTrendDomain([
      { date: '2026-01-01', value: null },
    ])).toBeNull()
  })

  it('formats the rounded display bounds as percent', () => {
    expect(formatCategoryInflationRange({
      min: -2.4,
      max: 3.4,
      includesZero: true,
    })).toBe('−2.4% to +3.4%')
  })

  it('updates the range label when zero is added', () => {
    expect(formatCategoryInflationRange({
      min: 0,
      max: 8.7,
      includesZero: true,
    })).toBe('0.0% to +8.7%')
  })
})
