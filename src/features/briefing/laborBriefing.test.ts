import { describe, expect, it } from 'vitest'
import type { EconomicSeries } from '../economic-series/models/economicSeries'
import {
  activityTier,
  buildLaborAnswer,
  buildLaborBriefing,
  clampPercentile,
  momentumArrowAngle,
  momentumTier,
} from './laborBriefing'

function series(slug: string, values: Array<number | null>, startYear = 2020): EconomicSeries {
  return {
    id: slug, slug, provider: 'Fixture', providerSeriesId: slug,
    title: slug, shortTitle: slug, description: '', question: '', units: 'Index',
    frequency: 'monthly', seasonalAdjustment: 'Seasonally adjusted', transformation: 'Level',
    sourceName: 'Fixture', sourceUrl: 'https://example.com', retrievedAt: '2026-07-01',
    observations: values.map((value, index) => ({
      date: new Date(Date.UTC(startYear, index, 1)).toISOString().slice(0, 10), value,
    })),
  }
}

function input(activityValues: Array<number | null>, momentumValues: Array<number | null>) {
  const supporting = Array.from({ length: 60 }, (_, index) => 4 + index / 100)
  return {
    activity: series('labor-market-activity-index', activityValues),
    momentum: series('labor-market-momentum-index', momentumValues),
    unemployment: series('unemployment-rate', supporting),
    payrolls: series('payroll-growth', supporting.map((value) => value * 20)),
    monthlyPayrollChange: series('monthly-payroll-change', supporting.map((value) => value * 20)),
    primeAgeEmployment: series('prime-age-employment-ratio', supporting.map((value) => value + 75)),
    claims: series('initial-unemployment-claims-four-week-average', supporting.map((value) => value * 50_000)),
  }
}

describe('LMCI Labor briefing domain', () => {
  const activities = ['Well Below Avg.', 'Below Avg.', 'Near Avg.', 'Above Avg.', 'Well Above Avg.'] as const
  const momentums = ['Weakening Sharply', 'Weakening', 'Steady', 'Strengthening', 'Strengthening Sharply'] as const
  const activityClauses = [
    'People are finding and keeping work much less readily than usual',
    'People are finding and keeping work less readily than usual',
    'People are finding and keeping work about as readily as usual',
    'People are finding and keeping work more readily than usual',
    'People are finding and keeping work much more readily than usual',
  ] as const
  const momentumClauses = [
    'conditions are weakening sharply', 'conditions are weakening', 'conditions are holding steady',
    'conditions are strengthening', 'conditions are strengthening sharply',
  ] as const

  it.each(activities.map((tier, index) => [tier, activityClauses[index]] as const))('maps %s to its approved activity clause', (tier, clause) => {
    expect(buildLaborAnswer(tier, 'Steady')).toBe(`${clause}, and conditions are holding steady.`)
  })

  it.each(momentums.map((tier, index) => [tier, momentumClauses[index]] as const))('maps %s to its approved momentum clause', (tier, clause) => {
    expect(buildLaborAnswer('Near Avg.', tier)).toBe(`People are finding and keeping work about as readily as usual, and ${clause}.`)
  })

  it.each(activities.flatMap((activity, activityIndex) => momentums.map((momentum, momentumIndex) => {
    const activityDirection = activityIndex - 2
    const momentumDirection = momentumIndex - 2
    const connector = activityDirection !== 0 && momentumDirection !== 0 && Math.sign(activityDirection) !== Math.sign(momentumDirection) ? 'but' : 'and'
    return [activity, momentum, `${activityClauses[activityIndex]}, ${connector} ${momentumClauses[momentumIndex]}.`] as const
  })))('constructs the approved answer for %s plus %s', (activity, momentum, expected) => {
    expect(buildLaborAnswer(activity, momentum)).toBe(expected)
  })

  it('uses deterministic unavailable and stale fallbacks', () => {
    expect(buildLaborAnswer(null, null)).toBe('Current labor-market conditions cannot be assessed from the available data.')
    expect(buildLaborAnswer(null, 'Steady')).toBe('Current labor-market activity cannot be assessed from the available data, but momentum is holding steady.')
    expect(buildLaborAnswer(null, 'Strengthening', false)).toBe('Current labor-market conditions cannot be assessed from the available data.')
    expect(buildLaborAnswer('Above Avg.', null)).toBe('People are finding and keeping work more readily than usual, but there is no fresh evidence about whether conditions are changing.')
    expect(buildLaborAnswer('Above Avg.', 'Steady', false)).toBe('People are finding and keeping work more readily than usual, but there is no fresh evidence about whether conditions are changing.')
  })

  it.each([
    [0, 'Well Below Avg.'], [20, 'Below Avg.'], [40, 'Near Avg.'],
    [60, 'Above Avg.'], [80, 'Well Above Avg.'], [100, 'Well Above Avg.'],
  ])('maps activity boundary %s to the upper tier', (percentile, expected) => {
    expect(activityTier(percentile)).toBe(expected)
  })

  it.each([
    [0, 'Weakening Sharply'], [20, 'Weakening'], [40, 'Steady'],
    [60, 'Strengthening'], [80, 'Strengthening Sharply'], [100, 'Strengthening Sharply'],
  ])('maps momentum boundary %s to the upper tier', (percentile, expected) => {
    expect(momentumTier(percentile)).toBe(expected)
  })

  it('clamps display percentiles and bounds the momentum angle', () => {
    expect(clampPercentile(-20)).toBe(0)
    expect(clampPercentile(120)).toBe(100)
    expect(momentumArrowAngle(0)).toBe(-45)
    expect(momentumArrowAngle(50)).toBe(0)
    expect(momentumArrowAngle(100)).toBe(45)
    expect(momentumArrowAngle(-100)).toBe(-45)
    expect(momentumArrowAngle(500)).toBe(45)
  })

  it('uses full-history average-rank percentiles, including duplicate values', () => {
    const result = buildLaborBriefing(input([0, 1, 1, 2, 1], [-2, -1, 0, 1, 2]), '2020-06-15')
    if (result.status !== 'ready') throw new Error('Expected ready result')
    expect(result.activity?.rawValue).toBe(1)
    expect(result.activity?.percentile).toBe(50)
    expect(result.activity?.tier).toBe('Near Avg.')
    expect(result.momentum?.percentile).toBe(100)
    expect(result.momentumAngle).toBe(45)
  })

  it('maps lowest, median, and highest latest readings without using raw values as percentages', () => {
    for (const [values, expected] of [
      [[1, 2, 3, 4, 0], 0], [[0, 1, 3, 4, 2], 50], [[0, 1, 2, 3, 4], 100],
    ] as const) {
      const result = buildLaborBriefing(input([...values], [...values]), '2020-06-15')
      if (result.status !== 'ready') throw new Error('Expected ready result')
      expect(result.activity?.percentile).toBe(expected)
    }
  })

  it('renders a fallback for a missing primary and tolerates supporting gaps', () => {
    const missingActivity = buildLaborBriefing(input([0, 1, 2, 3, null], [0, 1, 2, 3, 4]), '2020-06-15')
    expect(missingActivity.status).toBe('ready')
    if (missingActivity.status === 'ready') {
      expect(missingActivity.activity).toBeNull()
      expect(missingActivity.answer).toBe('Current labor-market activity cannot be assessed from the available data, but momentum is strengthening sharply.')
    }
    const withoutSupport = { ...input([0, 1, 2, 3, 4], [0, 1, 2, 3, 4]), unemployment: null, payrolls: null, monthlyPayrollChange: null, primeAgeEmployment: null, claims: null }
    const result = buildLaborBriefing(withoutSupport, '2020-06-15')
    expect(result.status).toBe('ready')
    if (result.status === 'ready') expect(result.supportingErrors).toHaveLength(5)
  })

  it('does not call stale momentum steady', () => {
    const result = buildLaborBriefing(input([0, 1, 2, 3, 4], [0, 1, 2, 3, 4]), '2021-01-15')
    if (result.status !== 'ready') throw new Error('Expected ready result')
    expect(result.momentum?.noFreshEvidence).toBe(true)
    expect(result.answer).toBe('People are finding and keeping work much more readily than usual, but there is no fresh evidence about whether conditions are changing.')
  })
})
