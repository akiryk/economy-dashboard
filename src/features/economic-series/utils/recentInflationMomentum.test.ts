import { describe, expect, it } from 'vitest'
import type { EconomicSeries } from '../models/economicSeries'
import {
  classifyInflationMomentumDifference,
  annualizeThreeMonthCpiGrowth,
  createRecentInflationMomentumAccessibleSummary,
  deriveRecentInflationMomentumModel as deriveModelFromSeries,
  deriveConditionalInflationScenario,
  resolveConditionalInflationBase,
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

function deriveRecentInflationMomentumModel({
  twelveMonthHeadline,
  threeMonthHeadline,
}: {
  twelveMonthHeadline: EconomicSeries
  threeMonthHeadline: EconomicSeries
}) {
  return deriveModelFromSeries({
    twelveMonthHeadline,
    threeMonthHeadline,
    headlineSaLevels: series('sa-level', [
      ['2026-03-01', 100],
      ['2026-06-01', 101],
    ]),
    headlineNsaLevels: series('nsa-level', [
      ['2025-09-01', 100],
      ['2026-06-01', 103],
    ]),
  })
}

describe('classifyInflationMomentumDifference', () => {
  it.each([
    [0.1, 'pickup', 'Inflation has accelerated in recent months.'],
    [0.099, 'close', 'Inflation momentum is little changed.'],
    [-0.099, 'close', 'Inflation momentum is little changed.'],
    [-0.1, 'slowing', 'Inflation has slowed in recent months.'],
    [1, 'substantial-pickup', 'Inflation has accelerated sharply in recent months.'],
    [-1, 'substantial-slowing', 'Inflation has slowed sharply in recent months.'],
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
      .toContain('actual 12-month inflation rate was 3.5%')
    expect(createRecentInflationMomentumAccessibleSummary(model))
      .toContain('adjacent, non-overlapping three-month windows')
    expect(createRecentInflationMomentumAccessibleSummary(model))
      .toContain('not a forecast')
    expect(model.threeMonthAnnualizedRate).toBeLessThan(model.twelveMonthRate!)
    expect(model.answer).toBe('Inflation has accelerated in recent months.')
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

describe('conditional 12-month inflation scenario', () => {
  it('uses exact SA levels and an observed t−9 NSA base', () => {
    const scenario = deriveConditionalInflationScenario({
      latestDate: '2025-07-01',
      headlineSaLevels: series('sa', [
        ['2025-04-01', 320.302],
        ['2025-07-01', 322.169],
      ]),
      headlineNsaLevels: series('nsa', [
        ['2024-10-01', 315.664],
        ['2025-07-01', 323.048],
      ]),
    })

    expect(scenario.recentThreeMonthGrowth)
      .toBe(322.169 / 320.302 - 1)
    expect(annualizeThreeMonthCpiGrowth(scenario.recentThreeMonthGrowth!))
      .toBeCloseTo(2.3520143949639083, 12)
    expect(scenario.conditionalCpiNsa)
      .toBe(323.048 * (322.169 / 320.302))
    expect(scenario.conditionalRate).toBeCloseTo(2.9357183866403513, 12)
    expect(scenario.baseObservation).toEqual({
      kind: 'observed',
      date: '2024-10-01',
      value: 315.664,
    })
  })

  it('bridges only an explicit isolated missing NSA base geometrically', () => {
    const nsa = series('nsa', [
      ['2025-09-01', 324.8],
      ['2025-10-01', null],
      ['2025-11-01', 324.122],
      ['2026-07-01', 333.918],
    ])
    const original = structuredClone(nsa.observations)
    const scenario = deriveConditionalInflationScenario({
      latestDate: '2026-07-01',
      headlineSaLevels: series('sa', [
        ['2026-04-01', 332.407],
        ['2026-07-01', 332.813],
      ]),
      headlineNsaLevels: nsa,
    })

    expect(scenario.baseObservation).toMatchObject({
      kind: 'interpolated',
      date: '2025-10-01',
      previousDate: '2025-09-01',
      nextDate: '2025-11-01',
      value: Math.sqrt(324.8 * 324.122),
    })
    expect(scenario.conditionalRate).not.toBeNull()
    expect(nsa.observations).toEqual(original)
  })

  it('prefers an observed base and rejects unbracketed or consecutive gaps', () => {
    expect(resolveConditionalInflationBase([
      { date: '2025-09-01', value: 99 },
      { date: '2025-10-01', value: 100 },
      { date: '2025-11-01', value: 101 },
    ], '2025-10-01')).toEqual({
      kind: 'observed', date: '2025-10-01', value: 100,
    })
    expect(resolveConditionalInflationBase([
      { date: '2025-09-01', value: null },
      { date: '2025-10-01', value: null },
      { date: '2025-11-01', value: 101 },
    ], '2025-10-01')).toBeNull()
    expect(resolveConditionalInflationBase([
      { date: '2025-10-01', value: null },
      { date: '2025-11-01', value: 101 },
    ], '2025-10-01')).toBeNull()
    expect(resolveConditionalInflationBase([
      { date: '2025-09-01', value: 99 },
      { date: '2025-10-01', value: null },
    ], '2025-10-01')).toBeNull()
    expect(resolveConditionalInflationBase([
      { date: '2025-10-01', value: null },
      { date: '2025-09-01', value: 99 },
      { date: '2025-11-01', value: 101 },
    ], '2025-10-01')).toBeNull()
    expect(resolveConditionalInflationBase([
      { date: '2025-09-01', value: Number.NaN },
      { date: '2025-10-01', value: null },
      { date: '2025-11-01', value: 101 },
    ], '2025-10-01')).toBeNull()
  })
})
