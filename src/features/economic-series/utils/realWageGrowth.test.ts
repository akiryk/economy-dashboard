import { describe, expect, it } from 'vitest'
import type { EconomicSeries } from '../models/economicSeries'
import {
  calculateVisibleRealWageGrowthSummary,
  classifyRealWageGrowth,
  createRealWageGrowthAccessibleSummary,
  createRealWageGrowthRangeModel,
  createVisibleRealWageGrowthAccessibleSummary,
  deriveRealWageGrowthModel,
  describeRealWageGrowthHistoricalPosition,
  formatRealWageGrowthHistoricalPosition,
  formatVisibleRealWageGrowthSummary,
  realWageGrowthHistoricalBandDefinition,
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

function monthlyObservations(
  startYear: number,
  count: number,
  value: (index: number) => number | null,
): Array<[string, number | null]> {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(startYear, index, 1))
    return [date.toISOString().slice(0, 10), value(index)]
  })
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
    expect(model.historicalBands?.status).toBe('insufficient-history')
  })

  it('uses a trailing 25-year comparison and a 61-month compact line', () => {
    const observations = monthlyObservations(2000, 318, (index) => index % 20)
    const inputs = {
      nominalWageGrowth: series('wages', observations),
      cpiInflation: series('cpi', observations),
      realWageGrowth: series('real', observations),
    }
    const model = deriveRealWageGrowthModel(inputs)
    expect(realWageGrowthHistoricalBandDefinition).toMatchObject({
      recentObservationCount: 61,
      comparisonWindow: { kind: 'trailing-years', years: 25 },
      innerPercentiles: [25, 75],
      outerPercentiles: [10, 90],
      minimumFiniteObservations: 60,
    })
    expect(model.recentObservations).toHaveLength(61)
    expect(model.historicalBands).toMatchObject({
      status: 'ready',
      comparisonStart: '2001-06-01',
      comparisonEnd: '2026-06-01',
      validObservationCount: 301,
      recentObservationCount: 61,
    })
  })

  it('excludes nulls from percentiles and enforces the minimum history', () => {
    const enough = monthlyObservations(2021, 61, (index) =>
      index === 4 ? null : index)
    const ready = deriveRealWageGrowthModel({
      nominalWageGrowth: series('wages', enough),
      cpiInflation: series('cpi', enough),
      realWageGrowth: series('real', enough),
    })
    expect(ready.historicalBands).toMatchObject({
      status: 'ready',
      validObservationCount: 60,
      innerLower: 15.75,
      innerUpper: 45.25,
    })

    const tooShort = enough.slice(1)
    const insufficient = deriveRealWageGrowthModel({
      nominalWageGrowth: series('wages', tooShort),
      cpiInflation: series('cpi', tooShort),
      realWageGrowth: series('real', tooShort),
    })
    expect(insufficient.historicalBands).toMatchObject({
      status: 'insufficient-history',
      validObservationCount: 59,
      minimumRequired: 60,
    })
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

describe('real wage historical position', () => {
  const bands = {
    status: 'ready' as const,
    recentObservations: [],
    comparisonStart: '2001-06-01',
    comparisonEnd: '2026-06-01',
    innerLower: -0.5,
    innerUpper: 0.5,
    median: 0,
    outerLower: -1,
    outerUpper: 1,
    latestObservation: { date: '2026-06-01', value: 0 },
    validObservationCount: 300,
    recentObservationCount: 61,
  }

  it.each([
    [-1.01, 'unusually low'],
    [-1, 'below its typical range'],
    [-0.5, 'within its typical range'],
    [0.5, 'within its typical range'],
    [1, 'above its typical range'],
    [1.01, 'unusually high'],
  ])('classifies %s at exact band boundaries', (value, wording) => {
    expect(describeRealWageGrowthHistoricalPosition({
      ...bands,
      latestObservation: { ...bands.latestObservation, value },
    })).toContain(wording)
  })

  it('keeps the historical statement additional to the sign answer', () => {
    expect(formatRealWageGrowthHistoricalPosition(bands)).toBe(
      'The latest reading is within its typical range of the past 25 years.',
    )
  })
})

describe('visible real wage growth context', () => {
  const observations = [
    { date: '2026-01-01', value: 1 },
    { date: '2026-02-01', value: null },
    { date: '2026-03-01', value: -2 },
    { date: '2026-04-01', value: 1 },
    { date: '2026-05-01', value: 0 },
    { date: '2026-06-01', value: -0.049 },
  ]

  it('creates a zero-inclusive range model from the selected observations', () => {
    const model = createRealWageGrowthRangeModel(observations)
    expect(model.recentObservations).toEqual(observations)
    expect(model.latestObservation).toEqual({
      date: '2026-06-01',
      value: -0.049,
    })
    expect(model.domain?.[0]).toBeLessThan(-2)
    expect(model.domain?.[1]).toBeGreaterThan(1)
  })

  it('reports latest extrema, latest ties, and an explicit valid denominator', () => {
    const summary = calculateVisibleRealWageGrowthSummary(observations)
    expect(summary).toMatchObject({
      startPeriod: '2026-01-01',
      endPeriod: '2026-06-01',
      latest: { date: '2026-06-01', value: -0.049 },
      minimum: { date: '2026-03-01', value: -2 },
      maximum: { date: '2026-04-01', value: 1 },
      validObservationCount: 5,
      atOrAboveZeroCount: 3,
      atOrAboveZeroShare: 60,
    })
    expect(formatVisibleRealWageGrowthSummary(summary)).toBe(
      'In the visible period, real wage growth ranged from −2.0% in March 2026 to +1.0% in April 2026. ' +
      'Wages rose at least as fast as prices in 60% of 5 valid months shown. ' +
      'The latest reading is 0% in June 2026.',
    )
  })

  it('provides complete nonvisual context and excludes nulls', () => {
    const summary = calculateVisibleRealWageGrowthSummary(observations)
    expect(createVisibleRealWageGrowthAccessibleSummary(summary)).toContain(
      'selected range runs from January 2026 through June 2026',
    )
    expect(createVisibleRealWageGrowthAccessibleSummary(summary)).toContain(
      'Zero means wage growth and consumer-price inflation were equal',
    )
    expect(createVisibleRealWageGrowthAccessibleSummary(summary)).toContain(
      'does not describe every worker',
    )
  })
})
