import { describe, expect, it } from 'vitest'
import type { EconomicSeries } from '../models/economicSeries'
import {
  classifyRealWageGrowth,
  createRealWageGrowthAccessibleSummary,
  deriveRealWageGrowthModel,
} from './realWageGrowth'

function series(
  slug: string,
  observations: Array<[string, number | null]>,
): EconomicSeries {
  return {
    id: slug, slug, provider: 'test', providerSeriesId: slug, title: slug,
    shortTitle: slug, description: slug, question: slug, units: 'Percent',
    frequency: 'monthly', seasonalAdjustment: null, transformation: 'test',
    sourceName: 'test', sourceUrl: 'https://example.com', retrievedAt: '2026-07-25',
    observations: observations.map(([date, value]) => ({ date, value })),
  }
}

describe('classifyRealWageGrowth', () => {
  it.each([
    [0.1, 'positive', 'Yes — wages are rising faster than prices.'],
    [0.099, 'about-even', 'About even — wages are roughly keeping pace with prices.'],
    [0, 'about-even', 'About even — wages are roughly keeping pace with prices.'],
    [-0.099, 'about-even', 'About even — wages are roughly keeping pace with prices.'],
    [-0.1, 'negative', 'No — prices are rising faster than wages.'],
    [null, 'unavailable', 'Current real wage growth is unavailable.'],
  ])('classifies %s with explicit neutral boundaries', (value, tier, answer) => {
    expect(classifyRealWageGrowth(value)).toEqual({ answerTier: tier, answer })
  })
})

describe('deriveRealWageGrowthModel', () => {
  it('aligns the derived series to exact wage and CPI months and preserves gaps', () => {
    const model = deriveRealWageGrowthModel({
      realWageGrowth: series('real', [
        ['2026-04-01', 0.48], ['2026-05-01', null], ['2026-06-01', 0.38],
      ]),
      nominalWageGrowth: series('wages', [
        ['2026-04-01', 4], ['2026-05-01', null], ['2026-06-01', 3.6],
      ]),
      cpiInflation: series('cpi', [
        ['2026-03-01', 3], ['2026-04-01', 3.5], ['2026-05-01', 3.4],
        ['2026-06-01', 3.2],
      ]),
    })
    expect(model.observations).toEqual([
      { date: '2026-03-01', value: null },
      { date: '2026-04-01', value: 0.48 },
      { date: '2026-05-01', value: null },
      { date: '2026-06-01', value: 0.38 },
    ])
    expect(model.latestObservation?.date).toBe('2026-06-01')
    expect(model.answerTier).toBe('positive')
    expect(model.domain?.[0]).toBeLessThan(0)
    expect(model.domain?.[1]).toBeGreaterThan(0.5)
  })

  it('does not substitute a nearby CPI month', () => {
    const model = deriveRealWageGrowthModel({
      nominalWageGrowth: series('wages', [['2026-06-01', 3.5]]),
      cpiInflation: series('cpi', [['2026-05-01', 3]]),
      realWageGrowth: series('real', [['2026-06-01', 0.5]]),
    })
    expect(model.status).toBe('unavailable')
  })

  it('uses the available shorter history for its visible period', () => {
    const model = deriveRealWageGrowthModel({
      nominalWageGrowth: series('wages', [
        ['2025-11-01', 3.5], ['2026-06-01', 3.6],
      ]),
      cpiInflation: series('cpi', [
        ['2025-11-01', 3], ['2026-06-01', 3.2],
      ]),
      realWageGrowth: series('real', [
        ['2025-11-01', 0.48], ['2026-06-01', 0.38],
      ]),
    })
    expect(model.visiblePeriod).toEqual(['2025-11-01', '2026-06-01'])
    expect(model.recentObservations).toHaveLength(2)
  })

  it('is unavailable when the latest wage input is null', () => {
    const model = deriveRealWageGrowthModel({
      nominalWageGrowth: series('wages', [['2026-06-01', null]]),
      cpiInflation: series('cpi', [['2026-06-01', 3]]),
      realWageGrowth: series('real', [['2026-06-01', 0]]),
    })
    expect(model.status).toBe('unavailable')
  })

  it('is unavailable when the latest CPI input is null', () => {
    const model = deriveRealWageGrowthModel({
      nominalWageGrowth: series('wages', [['2026-06-01', 3]]),
      cpiInflation: series('cpi', [['2026-06-01', null]]),
      realWageGrowth: series('real', [['2026-06-01', 0]]),
    })
    expect(model.status).toBe('unavailable')
  })

  it('summarizes value, relationship, zero, window, and aggregate scope', () => {
    const model = deriveRealWageGrowthModel({
      nominalWageGrowth: series('wages', [
        ['2021-06-01', 4], ['2026-06-01', 3.5],
      ]),
      cpiInflation: series('cpi', [
        ['2021-06-01', 3], ['2026-06-01', 3],
      ]),
      realWageGrowth: series('real', [
        ['2021-06-01', 0.9], ['2026-06-01', 0.5],
      ]),
    })
    expect(createRealWageGrowthAccessibleSummary(model)).toContain(
      'Real wage growth was +0.5% in June 2026; wages were rising faster than prices.',
    )
    expect(createRealWageGrowthAccessibleSummary(model)).toContain(
      'Zero means wage growth and consumer-price inflation were equal.',
    )
    expect(createRealWageGrowthAccessibleSummary(model)).toContain(
      'visible trend runs from June 2021 through June 2026',
    )
    expect(createRealWageGrowthAccessibleSummary(model)).toContain(
      'does not describe every worker',
    )
  })

  it('normalizes rounded negative zero without changing its neutral answer', () => {
    const model = deriveRealWageGrowthModel({
      nominalWageGrowth: series('wages', [['2026-06-01', 3.4]]),
      cpiInflation: series('cpi', [['2026-06-01', 3.45]]),
      realWageGrowth: series('real', [['2026-06-01', -0.049]]),
    })
    expect(model.answerTier).toBe('about-even')
    expect(createRealWageGrowthAccessibleSummary(model)).toContain(
      'Real wage growth was 0% in June 2026',
    )
  })
})
