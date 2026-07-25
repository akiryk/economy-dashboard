import { describe, expect, it } from 'vitest'
import type { EconomicSeries } from '../models/economicSeries'
import {
  classifyInflationMomentumDifference,
  createRecentInflationMomentumAccessibleSummary,
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
    [1, 'substantial-pickup', 'Yes — inflation has picked up substantially in recent months.'],
    [0.3, 'pickup', 'Yes — inflation has picked up in recent months.'],
    [0.299, 'close', 'Not much — the recent pace is close to the past-year rate.'],
    [-0.299, 'close', 'Not much — the recent pace is close to the past-year rate.'],
    [-0.3, 'slowing', 'No — inflation has been slowing in recent months.'],
    [-1, 'substantial-slowing', 'No — inflation has slowed substantially in recent months.'],
    [null, 'unavailable', 'Recent inflation momentum is unavailable.'],
  ])('classifies %s at explicit boundaries', (difference, tier, answer) => {
    expect(classifyInflationMomentumDifference(difference))
      .toEqual({ answerTier: tier, answer })
  })
})

describe('deriveRecentInflationMomentumModel', () => {
  it('derives headline rates, difference, shared scale, and negative values', () => {
    const model = deriveRecentInflationMomentumModel({
      twelveMonthHeadline: series('year', [['2026-06-01', -1]]),
      threeMonthHeadline: series('recent', [['2026-06-01', -2.5]]),
    })
    expect(model).toMatchObject({
      status: 'available',
      twelveMonthRate: -1,
      threeMonthAnnualizedRate: -2.5,
      difference: -1.5,
      answerTier: 'substantial-slowing',
      slopeDirection: 'down',
      differenceLabel: '1.5 percentage points slower',
    })
    expect(model.scale?.[0]).toBeLessThan(-2.5)
    expect(model.scale?.[1]).toBeGreaterThan(0)
  })

  it.each([
    [3, 3.31, 'up', '0.3 percentage points faster'],
    [3, 2.69, 'down', '0.3 percentage points slower'],
    [3, 3.2, 'level', 'About the same — 0.2 percentage points apart'],
  ] as const)(
    'uses deterministic slope geometry and wording for %s versus %s',
    (pastRate, recentRate, direction, differenceLabel) => {
      const model = deriveRecentInflationMomentumModel({
        twelveMonthHeadline: series('year', [['2026-06-01', pastRate]]),
        threeMonthHeadline: series('recent', [['2026-06-01', recentRate]]),
      })
      expect(model.slopeDirection).toBe(direction)
      expect(model.differenceLabel).toBe(differenceLabel)
      const [past, recent] = model.items
      if (direction === 'up') expect(recent!.slopeYPercent).toBeLessThan(past!.slopeYPercent)
      if (direction === 'down') expect(recent!.slopeYPercent).toBeGreaterThan(past!.slopeYPercent)
      if (direction === 'level') expect(recent!.slopeYPercent).toBe(past!.slopeYPercent)
    },
  )

  it('requires the recent rate at the latest 12-month period', () => {
    const model = deriveRecentInflationMomentumModel({
      twelveMonthHeadline: series('year', [['2026-06-01', 3]]),
      threeMonthHeadline: series('recent', [['2026-05-01', 4]]),
    })
    expect(model.status).toBe('unavailable')
    expect(model.threeMonthAnnualizedRate).toBeNull()
  })

  it('does not bridge a null latest recent observation', () => {
    const model = deriveRecentInflationMomentumModel({
      twelveMonthHeadline: series('year', [['2026-06-01', 3]]),
      threeMonthHeadline: series('recent', [
        ['2026-05-01', 4], ['2026-06-01', null],
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
      threeMonthHeadline: series('recent', [['2026-06-01', 4]]),
    })
    expect(year.observations[0]?.date).toBe('2026-06-01')
  })

  it('creates a complete nonforecast accessible summary', () => {
    const model = deriveRecentInflationMomentumModel({
      twelveMonthHeadline: series('year', [['2026-06-01', 3.5]]),
      threeMonthHeadline: series('recent', [['2026-06-01', 2.8]]),
    })
    expect(createRecentInflationMomentumAccessibleSummary(model))
      .toContain('slower; the recent-minus-past-year difference was −0.7 percentage points')
    expect(createRecentInflationMomentumAccessibleSummary(model))
      .toContain('compares two measurement windows rather than consecutive observations')
    expect(createRecentInflationMomentumAccessibleSummary(model))
      .toContain('it is not a forecast')
    expect(
      model.items[1]!.slopeYPercent - model.items[0]!.slopeYPercent,
    ).toBeGreaterThan(8)
  })
})
