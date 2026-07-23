import { describe, expect, it } from 'vitest'
import {
  buildInflationContributionCategories,
  contributionResidual,
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
    [[2.1, 0.8, 0.2, 0.1, 0.1], 'Shelter is the dominant driver.'],
    [[1.4, 1.3, 0.4, 0.1, 0.1], 'Shelter and other services are the main drivers.'],
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

  it('formats zero, singular, plural, and unavailable changes', () => {
    expect(formatContributionChange(0.01)).toBe('about the same as a year ago')
    expect(formatContributionChange(1)).toBe('up 1.0 percentage point from a year ago')
    expect(formatContributionChange(-0.4)).toBe('down 0.4 percentage points from a year ago')
    expect(formatContributionChange(null)).toBe('change from a year ago unavailable')
  })
})
