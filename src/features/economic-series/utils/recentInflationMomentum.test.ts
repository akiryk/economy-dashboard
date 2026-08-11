import { describe, expect, it } from 'vitest'
import type { EconomicSeries } from '../models/economicSeries'
import {
  classifyInflationMomentumDifference,
  createRecentInflationMomentumAccessibleSummary,
  deriveInflationMomentumHero,
  deriveRecentInflationMomentumModel,
} from './recentInflationMomentum'

function series(slug: string, observations: Array<[string, number | null]>): EconomicSeries {
  return {
    id: slug, slug, provider: 'test', providerSeriesId: slug, title: slug,
    shortTitle: slug, description: slug, question: slug, units: 'Percent',
    frequency: 'monthly', seasonalAdjustment: null, transformation: 'test',
    sourceName: 'test', sourceUrl: 'https://example.com', retrievedAt: '2026-07-24',
    observations: observations.map(([date, value]) => ({ date, value })),
  }
}

describe('classifyInflationMomentumDifference', () => {
  it.each([
    [0.1, 'pickup', 'Yes — inflation has picked up in recent months.'],
    [0.099, 'close', 'Inflation momentum is little changed.'],
    [-0.099, 'close', 'Inflation momentum is little changed.'],
    [-0.1, 'slowing', 'No — inflation has slowed in recent months.'],
    [null, 'unavailable', 'Recent inflation momentum is unavailable.'],
  ])('classifies %s at explicit boundaries', (difference, tier, answer) => {
    expect(classifyInflationMomentumDifference(difference))
      .toEqual({ answerTier: tier, answer })
  })
})

describe('deriveRecentInflationMomentumModel', () => {
  it('derives headline rates, difference, shared scale, and negative values', () => {
    const model = deriveRecentInflationMomentumModel({
      twelveMonthHeadline: series('year', [['2026-06-01', 3.5]]),
      threeMonthHeadline: series('recent', [
        ['2026-03-01', -1], ['2026-06-01', -2.5],
      ]),
    })
    expect(model).toMatchObject({
      status: 'available',
      twelveMonthRate: 3.5,
      previousThreeMonthAnnualizedRate: -1,
      threeMonthAnnualizedRate: -2.5,
      difference: -1.5,
      answerTier: 'slowing',
      slopeDirection: 'down',
      differenceLabel: '1.5 percentage points slower',
      heroValue: '−1.5 pp',
      showRelativeHero: false,
    })
    expect(model.scale?.[0]).toBeLessThan(-2.5)
    expect(model.scale?.[1]).toBeGreaterThan(0)
  })

  it.each([
    [3, 3.31, 'up', '0.3 percentage points faster'],
    [3, 2.69, 'down', '0.3 percentage points slower'],
    [3, 3.099, 'level', 'About the same — 0.1 percentage points apart'],
  ] as const)(
    'uses deterministic slope geometry and wording for %s versus %s',
    (pastRate, recentRate, direction, differenceLabel) => {
      const model = deriveRecentInflationMomentumModel({
        twelveMonthHeadline: series('year', [['2026-06-01', 4]]),
        threeMonthHeadline: series('recent', [
          ['2026-03-01', pastRate], ['2026-06-01', recentRate],
        ]),
      })
      expect(model.slopeDirection).toBe(direction)
      expect(model.differenceLabel).toBe(differenceLabel)
      const [past, recent] = model.items
      if (direction === 'up') expect(recent!.slopeYPercent).toBeLessThan(past!.slopeYPercent)
      if (direction === 'down') expect(recent!.slopeYPercent).toBeGreaterThan(past!.slopeYPercent)
      if (direction === 'level') expect(recent!.slopeYPercent).toBe(past!.slopeYPercent)
    },
  )

  it('requires the previous non-overlapping three-month period', () => {
    const model = deriveRecentInflationMomentumModel({
      twelveMonthHeadline: series('year', [['2026-06-01', 3]]),
      threeMonthHeadline: series('recent', [
        ['2026-02-01', 4], ['2026-06-01', 5],
      ]),
    })
    expect(model.status).toBe('unavailable')
    expect(model.threeMonthAnnualizedRate).toBeNull()
  })

  it('does not bridge a null previous-window observation', () => {
    const model = deriveRecentInflationMomentumModel({
      twelveMonthHeadline: series('year', [['2026-06-01', 3]]),
      threeMonthHeadline: series('recent', [
        ['2026-03-01', null], ['2026-06-01', 4],
      ]),
    })
    expect(model.answerTier).toBe('unavailable')
  })

  it('does not mutate source observations', () => {
    const year = series('year', [
      ['2026-06-01', 3], ['2026-05-01', 2],
    ])
    deriveRecentInflationMomentumModel({
      twelveMonthHeadline: year,
      threeMonthHeadline: series('recent', [
        ['2026-03-01', 3], ['2026-06-01', 4],
      ]),
    })
    expect(year.observations[0]?.date).toBe('2026-06-01')
  })

  it('creates a complete nonforecast accessible summary', () => {
    const model = deriveRecentInflationMomentumModel({
      twelveMonthHeadline: series('year', [['2026-06-01', 3.5]]),
      threeMonthHeadline: series('recent', [
        ['2026-03-01', 2.2], ['2026-06-01', 2.8],
      ]),
    })
    expect(createRecentInflationMomentumAccessibleSummary(model))
      .toContain('Momentum was faster; the change was +0.6 percentage points')
    expect(createRecentInflationMomentumAccessibleSummary(model))
      .toContain('12-month inflation rate was +3.5%')
    expect(createRecentInflationMomentumAccessibleSummary(model))
      .toContain('adjacent, non-overlapping three-month windows')
    expect(createRecentInflationMomentumAccessibleSummary(model))
      .toContain('not forecasts')
    expect(model.threeMonthAnnualizedRate).toBeLessThan(model.twelveMonthRate!)
    expect(model.answer).toBe('Yes — inflation has picked up in recent months.')
  })

  it('recalculates both windows when revised derived CPI history is supplied', () => {
    const first = deriveRecentInflationMomentumModel({
      twelveMonthHeadline: series('year', [['2026-06-01', 3.5]]),
      threeMonthHeadline: series('recent', [
        ['2026-03-01', 2], ['2026-06-01', 3],
      ]),
    })
    const revised = deriveRecentInflationMomentumModel({
      twelveMonthHeadline: series('year', [['2026-06-01', 3.5]]),
      threeMonthHeadline: series('recent', [
        ['2026-03-01', 2.4], ['2026-06-01', 2.8],
      ]),
    })
    expect(first.difference).toBe(1)
    expect(revised.difference).toBeCloseTo(0.4)
  })
})

describe('percentage-point inflation momentum hero', () => {
  it('uses the unrounded difference and rounds only the display', () => {
    const hero = deriveInflationMomentumHero({
      difference: -0.694,
      answerTier: 'slowing',
    })
    expect(hero.relativeDifference).toBeNull()
    expect(hero.heroValue).toBe('−0.7 pp')
  })

  it('uses About the same inside the existing neutral threshold', () => {
    expect(deriveInflationMomentumHero({
      difference: 0.099,
      answerTier: 'close',
    })).toMatchObject({
      showRelativeHero: false,
      heroValue: '0.0 pp',
    })
  })
})
