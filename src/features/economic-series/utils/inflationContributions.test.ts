import { describe, expect, it } from 'vitest'
import {
  buildInflationContributionCategories,
  contributionResidual,
  deriveCompactInflationDriversModel,
  formatContributionChange,
  summarizeInflationDrivers,
  type InflationContributionCategory,
  type InflationContributionObservation,
} from './inflationContributions'

const observation = (
  values: InflationContributionObservation['categories'],
  headline = 3.5,
): InflationContributionObservation => ({
  date: '2026-06-01',
  headline,
  categories: values,
})

const values = {
  shelter: 1.159,
  'other-services': 0.753,
  food: 0.410,
  energy: 1.051,
  'goods-excluding-food-and-energy': 0.158,
}

describe('inflation contributions', () => {
  it('sorts positive and negative effects around their numeric contribution', () => {
    const categories = buildInflationContributionCategories(
      observation({ ...values, energy: -0.2 }),
      null,
    )
    expect(categories[0]?.id).toBe('shelter')
    expect(categories.at(-1)).toMatchObject({ id: 'energy', contribution: -0.2 })
  })

  it('uses exact prior-year matching input without mutating either observation', () => {
    const current = observation(values)
    const prior = { ...observation({ ...values, energy: -0.07 }, 2.7), date: '2025-06-01' }
    const original = structuredClone([current, prior])
    const energy = buildInflationContributionCategories(current, prior)
      .find(({ id }) => id === 'energy')
    expect(energy?.change).toBeCloseTo(1.121, 12)
    expect([current, prior]).toEqual(original)
  })

  it('keeps a missing prior-year value unavailable', () => {
    expect(buildInflationContributionCategories(observation(values), null)[0])
      .toMatchObject({ yearAgoContribution: null, change: null })
  })

  it('reports the published rounding residual', () => {
    const categories = buildInflationContributionCategories(observation(values), null)
    expect(contributionResidual(3.5, categories)).toBeCloseTo(-0.031, 12)
  })

  it.each([
    [[2.1, 0.8, 0.2, 0.1, 0.1], 'Shelter contributed most of the latest increase.'],
    [[1.4, 1.3, 0.4, 0.1, 0.1], 'Shelter and other services contributed most of the latest increase.'],
    [[0.8, 0.7, 0.6, 0.5, 0.4], 'Inflation is broad across several categories.'],
    [[0.25, 0.2, 0.099, 0.099, 0.099], 'Several categories are contributing to inflation.'],
  ])('applies positive-inflation summary rules', (contributions, expected) => {
    const categories = contributions.map((contribution, index) => ({
      id: ['shelter', 'other-services', 'food', 'energy', 'goods-excluding-food-and-energy'][index],
      label: ['Shelter', 'Other services', 'Food', 'Energy', 'Goods'][index],
      contribution,
      yearAgoContribution: null,
      change: null,
    })) as InflationContributionCategory[]
    expect(summarizeInflationDrivers(3, categories)).toBe(expected)
  })

  it('uses contribution-aware wording when headline inflation is zero or negative', () => {
    const categories = buildInflationContributionCategories(
      observation({ ...values, energy: -1.2 }, -0.2),
      null,
    )
    expect(summarizeInflationDrivers(-0.2, categories))
      .toBe('Energy is exerting the largest downward pull.')
  })

  it('prioritizes substantial positive and negative offsets', () => {
    const categories = buildInflationContributionCategories(
      observation({ ...values, energy: -0.8 }, 1.8),
      null,
    )
    expect(summarizeInflationDrivers(1.8, categories))
      .toBe('Positive and negative category contributions substantially offset one another.')
  })

  it('selects four categories by absolute magnitude and nets every omission', () => {
    const categories = buildInflationContributionCategories(
      observation({ ...values, energy: -1.4 }),
      null,
    )
    const model = deriveCompactInflationDriversModel({
      headlineInflation: 1.08,
      headlinePeriod: '2026-06-01',
      categories,
    })
    expect(model?.displayedContributions.map(({ id }) => id)).toEqual([
      'shelter',
      'other-services',
      'food',
      'everything-else',
      'energy',
    ])
    expect(model?.remainderContribution).toBeCloseTo(0.158, 12)
    expect(model?.displayedContributions.at(-1)).toMatchObject({
      id: 'energy',
      contribution: -1.4,
    })
  })

  it('uses the documented reconciliation tolerance without changing arithmetic', () => {
    const categories = buildInflationContributionCategories(observation(values), null)
    const exactTotal = categories.reduce(
      (total, { contribution }) => total + contribution,
      0,
    )
    expect(deriveCompactInflationDriversModel({
      headlineInflation: exactTotal + 0.05,
      headlinePeriod: '2026-06-01',
      categories,
    })?.reconciliationStatus).toBe('reconciled')
    const unreconciled = deriveCompactInflationDriversModel({
      headlineInflation: exactTotal + 0.051,
      headlinePeriod: '2026-06-01',
      categories,
    })
    expect(unreconciled?.reconciliationStatus).toBe('unreconciled')
    expect(unreconciled?.reconciliationDifference).toBeCloseTo(0.051, 12)
    expect(unreconciled?.summary).toContain('do not fully reconcile')
  })

  it('rejects missing, duplicate, unknown, and nonfinite category data', () => {
    const categories = buildInflationContributionCategories(observation(values), null)
    const derive = (input: InflationContributionCategory[]) =>
      deriveCompactInflationDriversModel({
        headlineInflation: 3.5,
        headlinePeriod: '2026-06-01',
        categories: input,
      })
    expect(derive(categories.slice(0, 1))).toBeNull()
    expect(derive([...categories, categories[0]!])).toBeNull()
    expect(derive([...categories, {
      ...categories[0]!,
      id: 'unknown-category',
    }])).toBeNull()
    expect(derive(categories.map((category, index) =>
      index === 0 ? { ...category, contribution: Number.NaN } : category)))
      .toBeNull()
  })

  it('formats zero, singular, plural, and unavailable changes', () => {
    expect(formatContributionChange(0.01)).toBe('about the same as a year ago')
    expect(formatContributionChange(1)).toBe('up 1.0 percentage point from a year ago')
    expect(formatContributionChange(-0.4)).toBe('down 0.4 percentage points from a year ago')
    expect(formatContributionChange(null)).toBe('change from a year ago unavailable')
  })
})
